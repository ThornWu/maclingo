import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness({ fail = false } = {}) {
  const events = {}, calls = [];
  const chrome = {
    runtime: { onInstalled: { addListener: fn => events.install = fn }, onMessage: { addListener: fn => events.message = fn } },
    contextMenus: { removeAll: fn => fn(), create: item => calls.push(['menu', item]), onClicked: { addListener: fn => events.click = fn } },
    scripting: { executeScript: async args => { calls.push(['inject', args]); if (fail) throw Error('restricted'); return [{ documentId: 'doc-1' }]; } },
    tabs: { sendMessage: async (...args) => calls.push(['send', ...args]) },
    action: { setBadgeText: async args => calls.push(['badge', args]), setTitle: async args => calls.push(['title', args]) },
    i18n: { detectLanguage: (text, callback) => callback({ languages: [{ language: 'en', percentage: 99 }] }) }
  };
  vm.runInNewContext(readFileSync(new URL('../extension/background.js', import.meta.url), 'utf8'), { chrome });
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
