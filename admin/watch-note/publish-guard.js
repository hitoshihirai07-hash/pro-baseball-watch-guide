(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const markdownInput = $('#publishMarkdown');
  const titleInput = $('#publishTitle');
  const dateInput = $('#publishDate');
  const articleTypeInput = $('#articleType');
  const gameTitleInput = $('#gameTitle');
  const approvedInput = $('#publishApproved');
  const downloadButton = $('#downloadPublishFileButton');

  if (!markdownInput || !downloadButton) return;

  function normalize(value) {
    return String(value || '').replace(/\r\n/g, '\n').trim();
  }

  function dispatchChange(element) {
    if (!element) return;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function extractTitle(markdown) {
    const source = normalize(markdown);
    const h1 = source.match(/^#\s+(.+)$/m);
    if (h1) return h1[1].trim();
    const frontMatter = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    const title = frontMatter?.[1]?.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    return title ? title[1].trim() : '';
  }

  function removeFrontMatter(markdown) {
    return normalize(markdown).replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
  }

  function cleanBodyMarkdown(markdown) {
    let source = removeFrontMatter(markdown);
    const title = normalize(titleInput?.value);
    const published = normalize(dateInput?.value);
    const lines = source.split('\n');

    while (lines.length && !lines[0].trim()) lines.shift();

    if (lines.length) {
      const first = lines[0].trim();
      const h1Title = first.replace(/^#\s+/, '').trim();
      if ((first.startsWith('# ') && (!title || h1Title === title)) || (title && first === title)) {
        lines.shift();
        while (lines.length && !lines[0].trim()) lines.shift();
      }
    }

    if (lines.length) {
      const first = lines[0].trim();
      const formattedPublished = published
        ? published.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => `公開日：${y}年${Number(m)}月${Number(d)}日`)
        : '';
      if (/^公開日[：:]\s*/.test(first) || (formattedPublished && first === formattedPublished)) {
        lines.shift();
        while (lines.length && !lines[0].trim()) lines.shift();
      }
    }

    source = lines.join('\n').trim();
    return source;
  }

  function inferArticleContext(markdown) {
    const source = normalize(markdown);
    const title = normalize(titleInput?.value) || extractTitle(source);
    const isPlayerFocus = /【選手フォーカス】|選手フォーカス/.test(title);

    if (isPlayerFocus && articleTypeInput?.value === '1試合の観戦メモ') {
      articleTypeInput.value = '選手について感じたこと';
      dispatchChange(articleTypeInput);
    }

    if (articleTypeInput?.value === '選手について感じたこと' && !normalize(gameTitleInput?.value)) {
      gameTitleInput.value = '現在まで';
      dispatchChange(gameTitleInput);
    }
  }

  function setStatus(message, kind = 'info') {
    const status = $('#publishMarkdownImportStatus');
    if (!status) return;
    status.textContent = message;
    status.style.color = kind === 'error' ? '#9b1c1c' : '';
    status.style.fontWeight = kind === 'error' ? '700' : '';
  }

  function installMarkdownImporter() {
    const field = markdownInput.closest('.field-label');
    if (!field || $('#publishMarkdownFile')) return;

    const wrap = document.createElement('div');
    wrap.className = 'action-buttons';
    wrap.style.marginTop = '10px';

    const label = document.createElement('label');
    label.className = 'button button-secondary';
    label.style.cursor = 'pointer';
    label.textContent = 'Markdownファイルを読み込む';

    const fileInput = document.createElement('input');
    fileInput.id = 'publishMarkdownFile';
    fileInput.type = 'file';
    fileInput.accept = '.md,.markdown,text/markdown,text/plain';
    fileInput.style.display = 'none';
    label.append(fileInput);

    const status = document.createElement('span');
    status.id = 'publishMarkdownImportStatus';
    status.className = 'field-help';
    status.textContent = '見出し（##）を含むMarkdownをそのまま読み込めます。';

    wrap.append(label, status);
    field.append(wrap);

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const markdown = String(reader.result || '');
        markdownInput.value = markdown;
        if (!normalize(titleInput?.value)) {
          const title = extractTitle(markdown);
          if (title) titleInput.value = title;
        }
        inferArticleContext(markdown);
        if (approvedInput) approvedInput.checked = false;
        dispatchChange(markdownInput);
        dispatchChange(titleInput);
        if (approvedInput) dispatchChange(approvedInput);
        setStatus(`${file.name} を読み込みました。Markdownの見出しを保持しています。`);
      };
      reader.onerror = () => setStatus('Markdownファイルを読み込めませんでした。', 'error');
      reader.readAsText(file, 'utf-8');
      fileInput.value = '';
    });
  }

  installMarkdownImporter();

  downloadButton.addEventListener('click', (event) => {
    inferArticleContext(markdownInput.value);

    const cleaned = cleanBodyMarkdown(markdownInput.value);
    markdownInput.value = cleaned;
    dispatchChange(markdownInput);

    if (!normalize(gameTitleInput?.value)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('「対象の試合・期間」が空です。選手記事以外は入力してから公開してください。', 'error');
      gameTitleInput?.focus();
      return;
    }

    if (!/^##\s+\S+/m.test(cleaned)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus('Markdown見出し（##）がありません。MDファイルを読み込むか、見出しを付けてから公開してください。', 'error');
      markdownInput.focus();
      return;
    }

    setStatus('Markdown構造を確認しました。タイトル・公開日の重複も除外してJSON化します。');
  }, true);
})();
