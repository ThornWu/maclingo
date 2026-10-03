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
  const request = Symbol();
  pending.set(tab.id, request);
  try {
    // Inject on demand: no page readers or selection listeners running in the background.
    const [injection] = await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] }, files: ['content.js'] });
    if (pending.get(tab.id) !== request) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'maclingo:show', text: info.selectionText, frame: Boolean(info.frameId) }, { documentId: injection.documentId });
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
    await chrome.action.setTitle({ tabId: tab.id, title: 'MacLingo · 麦译 · 使用说明' });
  } catch {
    await chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
    await chrome.action.setTitle({ tabId: tab.id, title: '此页面禁止扩展显示卡片，请在普通网页重试。' });
  } finally {
    if (pending.get(tab.id) === request) pending.delete(tab.id);
  }
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message.type !== 'maclingo:detect' || !sender.tab || typeof message.text !== 'string') return;
  chrome.i18n.detectLanguage(message.text.slice(0, 10000), result => {
    const error = chrome.runtime.lastError;
    respond(error ? { error: error.message } : { languages: result.languages });
  });
  return true;
});
