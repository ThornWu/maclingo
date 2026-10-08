import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness({ fail = false } = {}) {
  const events = {}, calls = [];
  const chrome = {
    runtime: { onInstalled: { addListener: fn => events.install = fn }, onMessage: { addListener: fn => events.message = fn } },
    commands: { onCommand: { addListener: fn => events.command = fn } },
    contextMenus: { removeAll: fn => fn(), create: item => calls.push(['menu', item]), onClicked: { addListener: fn => events.click = fn } },
    scripting: { executeScript: async args => { calls.push(['inject', args]); if (fail) throw Error('restricted'); return [{ documentId: 'doc-1' }]; } },
    tabs: { sendMessage: async (...args) => calls.push(['send', ...args]) },
    action: { setBadgeText: async args => calls.push(['badge', args]), setTitle: async args => calls.push(['title', args]) },
    i18n: { detectLanguage: (text, callback) => callback({ languages: [{ language: 'en', percentage: 99 }] }) }
  };
  vm.runInNewContext(readFileSync(new URL('../src/background.js', import.meta.url), 'utf8'), { chrome });
  return { events, calls, chrome };
}
test('menu only appears for selected text on web pages', () => {
  const { events, calls } = harness(); events.install();
  assert.equal(calls[0][1].contexts.join(), 'selection');
  assert.equal(calls[0][1].documentUrlPatterns.join(), 'http://*/*,https://*/*');
});
test('injects on demand and routes the selected text to the exact document', async () => {
  const { events, calls } = harness();
  await events.click({ menuItemId: 'maclingo-translate', selectionText: '<script>hello</script>', frameId: 3 }, { id: 9 });
  const message = calls.find(x => x[0] === 'send');
  assert.equal(message[1], 9); assert.equal(message[2].text, '<script>hello</script>');
  assert.equal(message[2].frame, true); assert.equal(message[3].documentId, 'doc-1');
});
test('ignores empty selection and unrelated menu items', async () => {
  const { events, calls } = harness();
  await events.click({ menuItemId: 'other', selectionText: 'hi' }, { id: 9 });
  await events.click({ menuItemId: 'maclingo-translate', selectionText: ' ' }, { id: 9 });
  assert.equal(calls.length, 0);
});
test('restricted pages report an error without navigating away', async () => {
  const { events, calls } = harness({ fail: true });
  await events.click({ menuItemId: 'maclingo-translate', selectionText: 'hi' }, { id: 9 });
  assert.equal(calls.find(x => x[0] === 'badge')[1].text, '!');
  assert.equal(calls.some(x => x[0] === 'send'), false);
});
test('older injection cannot replace the latest selected text', async () => {
  const { events, calls, chrome } = harness();
  let resolveFirst;
  const original = chrome.scripting.executeScript;
  chrome.scripting.executeScript = () => new Promise(resolve => resolveFirst = resolve);
  const first = events.click({ menuItemId: 'maclingo-translate', selectionText: 'old' }, { id: 9 });
  chrome.scripting.executeScript = original;
  await events.click({ menuItemId: 'maclingo-translate', selectionText: 'new' }, { id: 9 });
  resolveFirst([{ documentId: 'old' }]); await first;
  assert.equal(calls.filter(x => x[0] === 'send').length, 1);
  assert.equal(calls.find(x => x[0] === 'send')[2].text, 'new');
});

test('shortcut reads selection then uses the same translation card', async () => {
  const { events, calls, chrome } = harness();
  const inject = chrome.scripting.executeScript;
  chrome.scripting.executeScript = async args => args.func ? [{ result: 'versatile' }] : inject(args);
  await events.command('translate-selection', { id: 9 });
  assert.equal(calls.find(x => x[0] === 'send')[2].text, 'versatile');
});
test('shortcut with no selection does not inject a card', async () => {
  const { events, calls, chrome } = harness();
  chrome.scripting.executeScript = async () => [{ result: '' }];
  await events.command('translate-selection', { id: 9 });
  assert.equal(calls.some(x => x[0] === 'send'), false);
  assert.match(calls.find(x => x[0] === 'title')[1].title, /请先/);
});
test('shortcut selection handles input text but excludes passwords', async () => {
  const { events, chrome } = harness(); let readSelection;
  chrome.scripting.executeScript = async args => { readSelection = args.func; return [{ result: '' }]; };
  await events.command('translate-selection', { id: 9 });
  const read = activeElement => vm.runInNewContext('(' + readSelection.toString() + ')()', {
    document: { activeElement }, window: { getSelection: () => 'page' }
  });
  assert.equal(read({ tagName: 'INPUT', type: 'text', value: 'one two', selectionStart: 4, selectionEnd: 7 }), 'two');
  assert.equal(read({ tagName: 'INPUT', type: 'password', value: 'secret', selectionStart: 0, selectionEnd: 6 }), '');
  assert.equal(read(null), 'page');
});
