const MENU = 'maclingo-translate';
const pending = new Map();
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({
    id: MENU, title: '用麦译翻译', contexts: ['selection'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  }));
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU || !tab?.id || !info.selectionText?.trim()) return;
  await translateSelection(tab, info.selectionText, Boolean(info.frameId));
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'translate-selection' || !tab?.id) return;
  await translateSelection(tab);
});

async function translateSelection(tab, text, fromFrame = false) {
  const request = Symbol();
  pending.set(tab.id, request);
  try {
    if (text === undefined) {
      const [selection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id, frameIds: [0] },
        func: () => {
          const active = document.activeElement;
          if (active?.tagName === 'INPUT' && active.type === 'password') return '';
          if ((active?.tagName === 'TEXTAREA' || active?.tagName === 'INPUT')
              && typeof active.selectionStart === 'number') {
            return active.value.slice(active.selectionStart, active.selectionEnd);
          }
          return window.getSelection()?.toString() || '';
        }
      });
      if (pending.get(tab.id) !== request) return;
      text = selection?.result;
      if (!text?.trim()) {
        await chrome.action.setTitle({ tabId: tab.id, title: '请先在网页中选中文字，再按翻译快捷键。' });
        return;
      }
    }
    // Inject on demand: no page readers or selection listeners running in the background.
    const [injection] = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, files: ['content.js'] });
    if (pending.get(tab.id) !== request) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'maclingo:show', text, frame: fromFrame }, { documentId: injection.documentId });
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    await chrome.action.setTitle({ tabId: tab.id, title: 'MacLingo · 麦译 · 使用说明' });
  } catch {
    await chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
    await chrome.action.setTitle({ tabId: tab.id, title: '此页面禁止扩展显示卡片，请在普通网页重试。' });
  } finally {
    if (pending.get(tab.id) === request) pending.delete(tab.id);
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type !== 'maclingo:detect' || !sender.tab || typeof message.text !== 'string') return;
  chrome.i18n.detectLanguage(message.text.slice(0, 10000), result => {
    const error = chrome.runtime.lastError;
    respond(error ? { error: error.message } : { languages: result.languages });
  });
  return true;
});
