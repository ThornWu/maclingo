import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const flush = () => new Promise(resolve => setImmediate(resolve));
function harness() {
  const listeners = new Map(), shown = []; let change, scheduled;
  const document = { activeElement: null, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) };
  vm.runInNewContext(readFileSync(new URL('../src/selection.js', import.meta.url), 'utf8'), {
    document, window: { getSelection: () => ({ isCollapsed: false, toString: () => 'versatile' }) },
    chrome: { storage: { onChanged: { addListener: fn => change = fn }, local: { get: async () => ({}) } } },
    __maclingoShowSelection: text => shown.push(text), setTimeout: fn => scheduled = fn, clearTimeout: () => scheduled = null
  });
  return { listeners, shown, set: value => change({ autoSelection: { newValue: value } }, 'local'), tick: () => scheduled?.() };
}
test('selection stays off by default; enabling adds listeners; disabling cancels pending translation', async () => {
  const h = harness(); await flush(); assert.equal(h.listeners.size, 0);
  h.set(true); assert.equal(h.listeners.size, 2);
  h.listeners.get('pointerup')({ type: 'pointerup', button: 0, isTrusted: true, composedPath: () => [] });
  h.tick(); assert.deepEqual(h.shown, ['versatile']);
  h.listeners.get('pointerup')({ type: 'pointerup', button: 0, isTrusted: true, composedPath: () => [] });
  h.set(false); h.tick(); assert.equal(h.listeners.size, 0); assert.equal(h.shown.length, 1);
});
test('selection ignores editable targets, card contents and synthetic events', async () => {
  const h = harness(); await flush(); h.set(true);
  const selected = h.listeners.get('pointerup');
  selected({ type: 'pointerup', button: 0, isTrusted: true, composedPath: () => [{ closest: () => ({}) }] }); h.tick();
  selected({ type: 'pointerup', button: 0, isTrusted: false, composedPath: () => [] }); h.tick();
  assert.equal(h.shown.length, 0);
});
test('new setting wins over an older initial storage read', async () => {
  const h = harness(); h.set(true); await flush(); assert.equal(h.listeners.size, 2);
});
