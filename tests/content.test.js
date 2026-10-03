import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const code = readFileSync(new URL('../extension/content.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness({ saved, available = () => 'available', get, speech } = {}) {
  let listener, card;
  const store = { sourceLanguage: saved }, calls = [];
  function element() {
    return { style: { setProperty() {} }, append() {}, setAttribute() {}, focus() {}, remove() {},
      getBoundingClientRect: () => ({ width: 360, height: 200 }), attachShadow: () => ({ append() {} }) };
  }
  const document = {
    activeElement: null, documentElement: element(), addEventListener() {}, removeEventListener() {},
    createElement(tag) {
      const node = element();
      if (tag === 'section') {
        const controls = Object.fromEntries(['.result', '.primary', '.copy', '.original', '.close', '.speak', '.speech-status', '.speech'].map(key => [key, element()]));
        const source = { value: 'auto', options: ['auto', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es'].map(value => ({ value })) };
        const target = { value: 'zh' };
        node.querySelector = key => controls[key]; node.querySelectorAll = () => [source, target];
        card = { controls, source, target };
      }
      return node;
    }
  };
  if (speech) {
    speech.listeners = new Map();
    speech.addEventListener = (type, fn) => speech.listeners.set(type, fn);
    speech.removeEventListener = type => speech.listeners.delete(type);
  }
  const chrome = {
    runtime: { onMessage: { addListener: fn => listener = fn }, async sendMessage() { calls.push('detect'); return { languages: [{ language: 'fr' }] }; } },
    storage: { local: { get: get || (async () => ({ ...store })), async set(value) { Object.assign(store, value); } } }
  };
  vm.runInNewContext(code, { chrome, document, window: { getSelection: () => null, addEventListener() {}, removeEventListener() {} },
    innerWidth: 1000, innerHeight: 800, ResizeObserver: class { observe() {} disconnect() {} },
    AbortController, DOMException, setTimeout, clearTimeout,
    speechSynthesis: speech, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    Translator: { async availability(options) { calls.push(options.sourceLanguage); return available(options); },
      async create(options) { return { async translate() { return `${options.sourceLanguage}:译文`; }, destroy() {} }; } }
  });
  return { show() { listener({ type: 'maclingo:show', text: 'versatile' }); return card; }, store, calls };
}

test('manual choice persists across cards and bypasses short-word detection', async () => {
  const h = harness(); let card = h.show(); await flush();
  card.source.value = 'en'; card.source.onchange(); await flush();
  assert.equal(h.store.sourceLanguage, 'en');
  h.calls.length = 0; card = h.show(); await flush();
  assert.equal(card.source.value, 'en'); assert.deepEqual(h.calls, ['en']);
  assert.equal(card.controls['.result'].textContent, 'en:译文');
});
test('unsupported saved language falls back once without overwriting preference', async () => {
  const h = harness({ saved: 'en', available: ({ sourceLanguage }) => sourceLanguage === 'en' ? 'unavailable' : 'available' });
  const card = h.show(); await flush();
  assert.equal(card.source.value, 'auto'); assert.equal(h.store.sourceLanguage, 'en');
  assert.deepEqual(h.calls, ['en', 'detect', 'fr']);
  assert.equal(card.controls['.result'].textContent, 'fr:译文');
});
test('unsupported automatic result stops instead of retrying forever', async () => {
  const h = harness({ saved: 'en', available: () => 'unavailable' }); const card = h.show(); await flush();
  assert.deepEqual(h.calls, ['en', 'detect', 'fr']);
  assert.match(card.controls['.result'].textContent, /不支持这组语言/);
});
test('late preference load cannot overwrite a new manual choice', async () => {
  let resolve;
  const h = harness({ get: () => new Promise(r => resolve = r) }); const card = h.show();
  card.source.value = 'en'; card.source.onchange(); resolve({ sourceLanguage: 'ja' }); await flush();
  assert.equal(card.source.value, 'en'); assert.equal(card.controls['.result'].textContent, 'en:译文');
});
test('storage failure still allows automatic translation', async () => {
  const h = harness({ get: async () => { throw Error('storage'); } }); const card = h.show(); await flush();
  assert.equal(card.controls['.result'].textContent, 'fr:译文');
});

test('speech uses a local source-language voice and stops on dismissal', async () => {
  const spoken = []; let cancelled = 0;
  const local = { lang: 'en-US', localService: true };
  const speech = { getVoices: () => [{ lang: 'en', localService: false }, local], speak: value => spoken.push(value), cancel: () => cancelled++ };
  const h = harness({ saved: 'en', speech }); const card = h.show(); await flush();
  card.controls['.speak'].onclick();
  assert.equal(spoken[0].text, 'versatile'); assert.equal(spoken[0].voice, local);
  assert.equal(card.controls['.speak'].textContent, '停止朗读');
  card.controls['.close'].onclick(); assert.equal(cancelled, 1);
  spoken[0].onerror(); assert.equal(card.controls['.speech-status'].textContent, '');
});
test('speech never falls back to a remote or unrelated-language voice', async () => {
  let spoken = false;
  const speech = { getVoices: () => [{ lang: 'en', localService: false }, { lang: 'fr', localService: true }], speak: () => spoken = true };
  const h = harness({ saved: 'en', speech }); const card = h.show(); await flush();
  card.controls['.speak'].onclick();
  assert.equal(spoken, false); assert.equal(card.controls['.speak'].hidden, true);
  assert.equal(card.controls['.speech'].hidden, true);
  assert.equal(card.controls['.speech-status'].textContent, '');
  assert.equal(card.controls['.result'].textContent, 'en:译文');
});
test('speech toggles off and resets after completion or failure', async () => {
  let current, cancelled = 0;
  const speech = { getVoices: () => [{ lang: 'en-US', localService: true }], speak: value => current = value, cancel: () => cancelled++ };
  const h = harness({ saved: 'en', speech }); const card = h.show(); await flush();
  const button = card.controls['.speak']; button.onclick(); button.onclick();
  assert.equal(cancelled, 1); assert.equal(button.textContent, '朗读原文');
  button.onclick(); current.onend(); assert.equal(button.textContent, '朗读原文');
  button.onclick(); current.onerror(); assert.match(card.controls['.speech-status'].textContent, /朗读失败/);
});

test('automatic detection hides speech until matching local voices load', async () => {
  let voices = [];
  const speech = { getVoices: () => voices };
  const h = harness({ speech }); const card = h.show(); await flush();
  assert.equal(card.source.value, 'auto');
  assert.equal(card.controls['.speak'].hidden, true);
  voices = [{ lang: 'fr-FR', localService: true }];
  speech.listeners.get('voiceschanged')();
  assert.equal(card.controls['.speak'].hidden, false);
  assert.equal(card.controls['.speech'].hidden, false);
  voices = []; speech.listeners.get('voiceschanged')();
  assert.equal(card.controls['.speak'].hidden, true);
  card.controls['.close'].onclick();
  assert.equal(speech.listeners.size, 0);
});
test('missing speech API hides the entire speech row', async () => {
  const h = harness(); const card = h.show(); await flush();
  assert.equal(card.controls['.speech'].hidden, true);
  assert.equal(card.controls['.speak'].hidden, true);
});
