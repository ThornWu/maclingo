// Run against an isolated agent-browser session, never your everyday browser.
// NODE_PATH=/path/to/bundled/node_modules node apps/extension/tests/browser-check.cjs <cdp-url>
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const outputDir = path.resolve(__dirname, '../../../dist');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.connectOverCDP(process.argv[2]);
  const pages = browser.contexts()[0].pages();
  assert(pages.every(page => ['https://example.com/', 'chrome://new-tab-page/', 'about:blank'].includes(page.url())), 'Use an isolated test browser');
  const page = pages.find(page => page.url() === 'https://example.com/');
  assert(page, 'Open https://example.com/ in the test session first');
  await page.reload();
  fs.mkdirSync(outputDir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const { frameTree } = await cdp.send('Page.getFrameTree');
  const { executionContextId } = await cdp.send('Page.createIsolatedWorld', { frameId: frameTree.frame.id, worldName: 'maclingo-ui-test' });
  async function evaluate(expression) {
    const response = await cdp.send('Runtime.evaluate', { contextId: executionContextId, expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
    return response.result.value;
  }
  await evaluate(`
    globalThis.testListener = null;
    globalThis.chrome = { runtime: { onMessage: { addListener(fn) { testListener = fn; } }, async sendMessage() { return { languages: [{ language: 'en' }] }; } } };
    globalThis.realTranslator = globalThis.Translator;
    globalThis.mockMode = 'success';
    globalThis.Translator = {
      async availability() { return 'available'; },
      async create() {
        if (mockMode === 'activation') throw new DOMException('Needs gesture', 'NotAllowedError');
        return { async translate(text) { if (text === 'slow') await new Promise(r => setTimeout(r, 150)); return '译文：' + text; }, destroy() {} };
      }
    };
    globalThis.testRoot = null;
    const attach = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(options) { const root = attach.call(this, options); testRoot = root; return root; };
  `);
  await evaluate(fs.readFileSync(path.resolve(__dirname, '../src/content.js'), 'utf8'));
  async function show(text) {
    await evaluate(`testListener({ type: 'maclingo:show', text: ${JSON.stringify(text)} }); new Promise(resolve => setTimeout(resolve, 80))`);
  }
  await show('<img src=x onerror=alert(1)>');
  assert.equal(await evaluate(`testRoot.querySelector('.result').textContent`), '译文：<img src=x onerror=alert(1)>');
  assert.equal(await evaluate(`testRoot.querySelectorAll('img,script').length`), 0);
  await show('slow'); await show('Latest text');
  await evaluate('new Promise(r => setTimeout(r, 180))');
  assert.equal(await evaluate(`testRoot.querySelector('.result').textContent`), '译文：Latest text');
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  assert.equal(await evaluate('testRoot.host.isConnected'), false);
  await show('Dismiss me');
  await evaluate(`document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))`);
  assert.equal(await evaluate('testRoot.host.isConnected'), false);
  await evaluate(`mockMode = 'activation'`); await show('Download required');
  assert.equal(await evaluate(`testRoot.querySelector('.primary').textContent`), '开始本机翻译');
  await evaluate(`mockMode = 'success'; testRoot.querySelector('.primary').click(); new Promise(r=>setTimeout(r,80))`);
  assert.equal(await evaluate(`testRoot.querySelector('.copy').hidden`), false);
  await show('x'.repeat(10001));
  assert.match(await evaluate(`testRoot.querySelector('.result').textContent`), /文字过长/);
  await show('The quiet joy of reading.');
  await page.screenshot({ path: path.join(outputDir, 'card-preview.png') });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: path.join(outputDir, 'card-preview-dark.png') });
  await page.emulateMedia({ colorScheme: 'light' });
  console.log('PASS: escaping, stale responses, Esc, outside click, activation retry, length limit, light/dark render');
  // Probe the actual browser engine separately from the mocked interaction tests.
  const capability = await evaluate(`realTranslator ? realTranslator.availability({ sourceLanguage: 'en', targetLanguage: 'zh' }) : 'missing'`);
  console.log('Real browser translation availability:', capability);
  await evaluate(`globalThis.Translator = realTranslator`);
  await show('The quiet joy of reading.');
  await evaluate(`new Promise(resolve => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (!testRoot.querySelector('.copy').hidden || testRoot.querySelector('.result').classList.contains('error') || Date.now() - started > 30000) {
        clearInterval(timer); resolve();
      }
    }, 100);
  })`);
  console.log('Real engine card:', await evaluate(`testRoot.querySelector('.result').textContent`));
  await page.screenshot({ path: path.join(outputDir, 'real-engine.png') });
  await cdp.detach();
  // Disconnect by exiting the test process; do not close any browser or pages.
  process.exit(0);
})().catch(error => { console.error(error); process.exit(1); });
