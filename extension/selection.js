(() => {
  if (globalThis.__maclingoSelectionInstalled) return;
  globalThis.__maclingoSelectionInstalled = true;
  let enabled = false, timer, revision = 0;
  const ignore = node => node?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-maclingo-card]');
  const selected = event => {
    clearTimeout(timer);
    if (!enabled || !event.isTrusted || (event.type === 'pointerup' && event.button !== 0)) return;
    if (event.type === 'keyup' && !(event.shiftKey && event.key.startsWith('Arrow'))) return;
    if (event.composedPath().some(ignore) || ignore(document.activeElement)) return;
    timer = setTimeout(() => {
      if (!enabled) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;
      const anchor = selection.anchorNode?.parentElement;
      const focus = selection.focusNode?.parentElement;
      if (ignore(anchor) || ignore(focus)) return;
      const text = selection.toString().trim();
      if (text && text.length <= 10000) globalThis.__maclingoShowSelection(text);
    }, 200);
  };
  const apply = value => {
    enabled = value === true;
    clearTimeout(timer);
    document.removeEventListener('pointerup', selected);
    document.removeEventListener('keyup', selected);
    if (enabled) {
      document.addEventListener('pointerup', selected);
      document.addEventListener('keyup', selected);
    }
  };
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.autoSelection) { revision++; apply(changes.autoSelection.newValue); }
  });
  chrome.storage.local.get('autoSelection').then(settings => {
    if (revision === 0) apply(settings.autoSelection);
  }).catch(() => apply(false));
})();
