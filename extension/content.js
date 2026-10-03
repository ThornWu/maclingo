(() => {
  if (globalThis.__maclingoInstalled) return;
  globalThis.__maclingoInstalled = true;
  let dismiss = () => {};
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'maclingo:show' && typeof message.text === 'string') show(message.text, message.frame);
  });

  function show(text, fromFrame) {
    dismiss();
    const selection = window.getSelection();
    const rect = !fromFrame && selection?.rangeCount ? selection.getRangeAt(0).getBoundingClientRect() : null;
    const previousFocus = document.activeElement;
    const host = document.createElement('div');
    host.style.cssText = 'all:initial!important;position:fixed!important;z-index:2147483647!important;display:block!important;';
    const shadow = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host { color-scheme: light dark; }
      * { box-sizing: border-box; }
      .card { width:min(360px,calc(100vw - 24px)); max-height:calc(100vh - 24px); overflow:auto;
        background:#fff; color:#202825; border:1px solid #dce3df; border-radius:14px;
        box-shadow:0 12px 40px #152b2526,0 2px 8px #152b2512; padding:18px;
        font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; text-align:left; }
      header,footer,.languages { display:flex; align-items:center; gap:8px; }
      header { margin-bottom:14px; } .brand { font-weight:650; flex:1; } .mark { color:#226b61; font-size:19px; }
      button,select { font:inherit; color:inherit; cursor:pointer; }
      button { border:0; border-radius:6px; padding:5px 9px; background:#edf2ef; }
      button:hover { background:#e0e9e3; } button:focus-visible,select:focus-visible,summary:focus-visible { outline:2px solid #226b61; outline-offset:3px; }
      .close { background:transparent; font-size:18px; line-height:1; } .languages { font-size:12px; color:#637169; }
      select { max-width:135px; background:transparent; border:1px solid #dce3df; border-radius:5px; padding:3px; }
      .result { font-size:16px; line-height:1.8; white-space:pre-wrap; overflow-wrap:anywhere; margin:15px 0; user-select:text; }
      .muted { font-size:13px; color:#637169; } .error { color:#a23f33; }
      details { border-top:1px solid #e6eae7; padding-top:9px; margin-bottom:12px; }
      summary { cursor:pointer; color:#637169; font-size:12px; } .original { font-size:12px; color:#637169; white-space:pre-wrap; overflow-wrap:anywhere; max-height:120px; overflow:auto; }
      footer { justify-content:space-between; } .note { font-size:11px; color:#637169; }
      .primary { background:#226b61; color:white; } .primary:hover { background:#19574f; }
      [hidden] { display:none!important; }
      @media(prefers-color-scheme:dark) {
        .card { background:#242b28; color:#edf2ef; border-color:#44514a; box-shadow:0 12px 40px #0006; }
        button { background:#39473f; } button:hover { background:#485b50; }
        .muted,.note,summary,.original,.languages { color:#adbbb2; } select { border-color:#526359; }
        option { background:#242b28; } details { border-color:#44514a; } .mark { color:#83baa3; } .error { color:#ffa699; }
        .primary { background:#226b61; } .close { background:transparent; }
      }
    `;
    const card = document.createElement('section');
    card.className = 'card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'MacLingo · 麦译');
    // This template is static. Selected text and model output are only assigned via textContent.
    card.innerHTML = `<header><svg class="mark" aria-hidden="true" width="24" height="24" viewBox="0 0 128 128"><rect x="4" y="4" width="120" height="120" rx="30" fill="#226b61"/><path d="M30 87V38l34 23 34-23v49" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 61v27" stroke="#a9dec8" stroke-width="8" stroke-linecap="round"/></svg><span class="brand">MacLingo · 麦译</span><button class="close" aria-label="关闭翻译" title="关闭（Esc）">×</button></header>
      <div class="languages"><select aria-label="原文语言"><option value="auto">自动识别</option><option value="en">英语</option><option value="zh">中文</option><option value="ja">日语</option><option value="ko">韩语</option><option value="fr">法语</option><option value="de">德语</option><option value="es">西班牙语</option></select><span>→</span><select aria-label="目标语言"><option value="zh">简体中文</option><option value="en">英语</option><option value="ja">日语</option><option value="zh-Hant">繁體中文</option><option value="ko">韩语</option><option value="fr">法语</option></select></div>
      <div class="result muted" role="status" aria-live="polite">正在准备翻译…</div>
      <details><summary>查看原文</summary><div class="original"></div></details>
      <footer><span class="note">本机翻译 · 不保存记录</span><button class="primary" hidden>重试</button><button class="copy" hidden>复制译文</button></footer>`;
    shadow.append(style, card);
    document.documentElement.append(host);
    const result = card.querySelector('.result');
    const retry = card.querySelector('.primary');
    const copy = card.querySelector('.copy');
    const [source, target] = card.querySelectorAll('select');
    card.querySelector('.original').textContent = text;
    let closed = false, revision = 0, translator, controller, output = '';
    const position = () => {
      const width = card.getBoundingClientRect().width;
      const height = card.getBoundingClientRect().height;
      const x = rect?.width ? rect.left : innerWidth - width - 24;
      const below = rect?.height ? rect.bottom + 10 : 24;
      const y = below + height > innerHeight - 12 && rect ? rect.top - height - 10 : below;
      host.style.setProperty('left', `${Math.max(12, Math.min(x, innerWidth - width - 12))}px`, 'important');
      host.style.setProperty('top', `${Math.max(12, Math.min(y, innerHeight - height - 12))}px`, 'important');
    };
    const observer = new ResizeObserver(position); observer.observe(card); position();
    const outside = event => { if (!event.composedPath().includes(host)) dismiss(); };
    const escape = event => { if (event.key === 'Escape') { event.stopPropagation(); dismiss(); } };
    dismiss = () => {
      if (closed) return;
      closed = true; revision++; controller?.abort(); translator?.destroy(); observer.disconnect();
      document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', position);
      const focused = document.activeElement === host;
      host.remove();
      if (focused && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', position);
    card.querySelector('.close').onclick = () => dismiss();
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(output); copy.textContent = '已复制'; }
      catch { copy.textContent = '请选中译文复制'; }
    };
    const run = async () => {
      const current = ++revision;
      controller?.abort(); translator?.destroy(); translator = null;
      controller = new AbortController();
      const requestController = controller;
      const signal = controller.signal;
      const timeout = setTimeout(() => requestController.abort(new DOMException('翻译准备超时，请检查网络后重试。首次下载语言包可能需要较长时间。', 'TimeoutError')), 120000);
      const active = () => !closed && current === revision;
      result.className = 'result muted'; result.textContent = '正在翻译…';
      retry.hidden = true; copy.hidden = true; copy.textContent = '复制译文'; output = '';
      try {
        if (text.length > 10000) throw new Error('文字过长，请每次选择不超过 10,000 个字符。');
        if (!globalThis.Translator) throw new Error('此浏览器或页面暂不支持本机翻译。请使用新版 Chrome，在 HTTPS 网页重试。');
        let language = source.value;
        if (language === 'auto') {
          const detection = await chrome.runtime.sendMessage({ type: 'maclingo:detect', text });
          if (!active()) return;
          language = detection?.languages?.find(item => item.language !== 'und')?.language;
          if (!language) throw new Error('这段文字太短，无法可靠识别语言。请在上方选择原文语言。');
        }
        if (language === 'zh-CN') language = 'zh';
        if (language === target.value) { output = text; }
        else {
          const options = { sourceLanguage: language, targetLanguage: target.value };
          const availability = await Translator.availability(options);
          if (!active()) return;
          if (availability === 'unavailable') throw new Error('本机引擎暂不支持这组语言，请切换原文或目标语言。');
          result.textContent = availability === 'available' ? '正在翻译…' : '首次使用正在准备语言包…';
          const instance = await Translator.create({ ...options, signal, monitor(monitor) {
            monitor.addEventListener('downloadprogress', event => {
              if (active()) result.textContent = `正在下载语言包 ${Math.round(event.loaded * 100)}%…`;
            });
          }});
          if (!active()) { instance.destroy(); return; }
          translator = instance;
          const translated = await instance.translate(text, { signal });
          if (!active()) return;
          output = translated;
          instance.destroy(); translator = null;
        }
        result.className = 'result'; result.textContent = output; copy.hidden = false;
      } catch (error) {
        if (!active()) return;
        result.className = 'result error';
        const activation = error.name === 'NotAllowedError';
        result.textContent = activation ? '首次使用需允许浏览器准备语言包。点击下方按钮开始。' : signal.reason?.message || error.message || '翻译失败，请重试。';
        retry.textContent = activation ? '开始本机翻译' : '重试'; retry.hidden = false;
      } finally {
        clearTimeout(timeout);
      }
      position();
    };
    retry.onclick = run; source.onchange = run; target.onchange = run;
    card.querySelector('.close').focus({ preventScroll: true });
    run();
  }
})();
