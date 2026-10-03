const toggle = document.querySelector('#auto-selection');
const status = document.querySelector('#setting-status');
const origins = ['http://*/*', 'https://*/*'];
const id = 'maclingo-selection';
const files = ['content.js', 'selection.js'];

async function unregister() {
  const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (scripts.length) await chrome.scripting.unregisterContentScripts({ ids: [id] });
}

(async () => {
  try {
    const settings = await chrome.storage.local.get('autoSelection');
    toggle.checked = settings.autoSelection === true && await chrome.permissions.contains({ origins });
    if (settings.autoSelection === true && !toggle.checked) {
      await chrome.storage.local.set({ autoSelection: false });
      await unregister();
    }
    toggle.disabled = false;
  } catch { status.textContent = '无法读取设置，请重新打开扩展。'; }
})();

toggle.onchange = async () => {
  const enabled = toggle.checked;
  toggle.disabled = true;
  status.textContent = '';
  try {
    if (enabled && !await chrome.permissions.request({ origins })) {
      toggle.checked = false;
      status.textContent = '未开启：需要允许访问网页才能自动划词翻译。';
      return;
    }
    if (enabled) {
      const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
      if (!scripts.length) await chrome.scripting.registerContentScripts([
        { id, matches: origins, js: files, runAt: 'document_idle', persistAcrossSessions: true }
      ]);
      await chrome.storage.local.set({ autoSelection: true });
      const tabs = await chrome.tabs.query({ url: origins });
      await Promise.allSettled(tabs.map(tab => chrome.scripting.executeScript({ target: { tabId: tab.id }, files })));
    } else {
      await chrome.storage.local.set({ autoSelection: false });
      await unregister();
    }
    status.textContent = enabled ? '已开启划词自动翻译。' : '已关闭，仍可使用右键或快捷键翻译。';
  } catch {
    toggle.checked = false;
    await chrome.storage.local.set({ autoSelection: false }).catch(() => {});
    await unregister().catch(() => {});
    status.textContent = '设置失败，划词自动翻译保持关闭，请重试。';
  } finally { toggle.disabled = false; }
};
