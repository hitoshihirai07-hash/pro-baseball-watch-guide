import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'watch-notes');
const DATA_PATH = path.join(ROOT, 'data', 'articles.json');
const TEMPLATE_PATH = path.join(ROOT, 'tools', 'templates', 'watch-note.html');
const SITE_URL = 'https://pro-baseball-watch-guide.com';
const ARTICLE_TYPES = new Set([
  '1試合の観戦メモ',
  '3連戦・カードの振り返り',
  '選手について感じたこと',
  'チーム・起用・戦い方について感じたこと',
  '期間・シーズンの総括'
]);

const DEFAULT_NEXT_POINT_LABELS = [
  '打順・起用などで注目する点',
  '状態を確認したい選手',
  '登板状況を見たい投手'
];

const ARTICLE_MID_AD_HTML = String.raw`<section class="article-ad article-ad--mid" aria-label="広告" data-ad-network="i-mobile" data-ad-position="article-mid">
<p class="ad-label">広告</p>
<div class="imobile-unit">
<script>
(function () {
  var isMobile = navigator.userAgentData
    ? navigator.userAgentData.mobile
    : /iPhone|iPod|Android.*Mobile|Windows Phone|Mobi/i.test(navigator.userAgent);
  document.write(isMobile ? "<div id=\"im-e9aed1a6051f4f2cbafa9c5fd2862842\">\n  <script async src=\"https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?20220104\"><\/script>\n  <script>(window.adsbyimobile=window.adsbyimobile||[]).push({pid:85320,mid:595759,asid:1942266,type:\"banner\",display:\"inline\",elementid:\"im-e9aed1a6051f4f2cbafa9c5fd2862842\"})<\/script>\n</div>" : "<div id=\"im-6fdfa4d0df484b7a986cb00c4d040588\">\n  <script async src=\"https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?20220104\"><\/script>\n  <script>(window.adsbyimobile=window.adsbyimobile||[]).push({pid:85320,mid:595661,asid:1942263,type:\"banner\",display:\"inline\",elementid:\"im-6fdfa4d0df484b7a986cb00c4d040588\"})<\/script>\n</div>");
}());
</script>
<noscript><p class="microcopy">広告を表示するにはJavaScriptを有効にしてください。</p></noscript>
</div>
</section>`;

function insertArticleMidAd(html) {
  const sectionEnds = [...html.matchAll(/<\/section>/g)];
  if (sectionEnds.length < 2) return html;
  const target = sectionEnds[Math.ceil(sectionEnds.length / 2) - 1];
  const insertAt = target.index + target[0].length;
  return html.slice(0, insertAt) + '\n' + ARTICLE_MID_AD_HTML + '\n' + html.slice(insertAt);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inlineMarkdown(value = '') {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|\.\.?\/)[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

function removeFrontMatter(markdown) {
  const normalized = String(markdown || '').replace(/\r\n/g, '\n').trim();
  return normalized.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
}

function removeManagedNextSection(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => /^##\s+次カードで見たい3つ\s*$/.test(line.trim()));
  if (start < 0) return markdown;
  let end = start + 1;
  while (end < lines.length && !/^##\s+/.test(lines[end].trim())) end += 1;
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n').trim();
}

function headingId(title, index) {
  const slug = String(title)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section-' + index;
}

function markdownToHtml(markdown) {
  const source = removeManagedNextSection(removeFrontMatter(markdown));
  const lines = source.split('\n');
  const output = [];
  let paragraph = [];
  let listType = null;
  let sectionOpen = false;
  let headingIndex = 0;

  function flushParagraph() {
    if (!paragraph.length) return;
    output.push('<p>' + paragraph.map(inlineMarkdown).join('<br/>') + '</p>');
    paragraph = [];
  }

  function closeList() {
    if (!listType) return;
    output.push('</' + listType + '>');
    listType = null;
  }

  function openList(type) {
    if (listType === type) return;
    closeList();
    output.push('<' + type + '>');
    listType = type;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushParagraph();
      closeList();
      if (sectionOpen) output.push('</section>');
      headingIndex += 1;
      output.push('<section id="' + headingId(h2[1], headingIndex) + '">');
      output.push('<h2>' + inlineMarkdown(h2[1]) + '</h2>');
      sectionOpen = true;
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      flushParagraph();
      closeList();
      output.push('<h3>' + inlineMarkdown(h3[1]) + '</h3>');
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      openList('ul');
      output.push('<li>' + inlineMarkdown(unordered[1]) + '</li>');
      continue;
    }
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      openList('ol');
      output.push('<li>' + inlineMarkdown(ordered[1]) + '</li>');
      continue;
    }
    const quote = line.match(/^>\s?(.+)$/);
    if (quote) {
      flushParagraph();
      closeList();
      output.push('<blockquote><p>' + inlineMarkdown(quote[1]) + '</p></blockquote>');
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  closeList();
  if (sectionOpen) output.push('</section>');
  return output.join('\n');
}

function formatDate(date) {
  const [year, month, day] = String(date).split('-').map(Number);
  return year + '年' + month + '月' + day + '日';
}

function validateString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(name + ' がありません。');
}

function validateStringArray(value, name, minimum = 1) {
  if (!Array.isArray(value) || value.length < minimum || value.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error(name + ' は' + minimum + '件以上の文字列で指定してください。');
  }
}

function validate(note, sourceFile) {
  if (note.schemaVersion !== 1 || note.type !== 'watch-note') {
    throw new Error(sourceFile + ': 対応していない公開用JSONです。');
  }
  for (const key of ['title', 'slug', 'description', 'listDescription', 'published', 'updated', 'gameLabel', 'articleBadge', 'lead', 'bodyMarkdown']) {
    validateString(note[key], sourceFile + ': ' + key);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.slug)) {
    throw new Error(sourceFile + ': slug は半角英数字とハイフンだけで指定してください。');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(note.published) || !/^\d{4}-\d{2}-\d{2}$/.test(note.updated)) {
    throw new Error(sourceFile + ': published / updated は YYYY-MM-DD 形式で指定してください。');
  }
  validateStringArray(note.nextPoints, sourceFile + ': nextPoints', 3);
  if (note.nextPoints.length !== 3) throw new Error(sourceFile + ': nextPoints は3件にしてください。');
  if (note.nextPointLabels !== undefined) {
    validateStringArray(note.nextPointLabels, sourceFile + ': nextPointLabels', 3);
    if (note.nextPointLabels.length !== 3) throw new Error(sourceFile + ': nextPointLabels は3件にしてください。');
  }
  validateStringArray(note.keywords, sourceFile + ': keywords');
  validateStringArray(note.tags, sourceFile + ': tags');
  validateStringArray(note.badges, sourceFile + ': badges');
  if (note.articleType !== undefined && !ARTICLE_TYPES.has(note.articleType)) {
    throw new Error(sourceFile + ': articleType が対応していない種類です。');
  }
}

function applyTemplate(template, values) {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (token, key) => {
    if (!(key in values)) throw new Error('記事テンプレートに未置換の項目があります: ' + token);
    return values[key];
  });
}

function pageHtml(note) {
  const canonical = SITE_URL + '/watch-notes/' + note.slug;
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description: note.description,
    datePublished: note.published,
    dateModified: note.updated,
    inLanguage: 'ja',
    mainEntityOfPage: canonical,
    isPartOf: { '@type': 'WebSite', name: 'プロ野球観戦メモ', url: SITE_URL + '/' },
    author: { '@type': 'Organization', name: 'プロ野球観戦メモ' }
  }, null, 2).replaceAll('<', '\\u003c');
  const nextPointLabels = Array.isArray(note.nextPointLabels) && note.nextPointLabels.length === 3
    ? note.nextPointLabels
    : DEFAULT_NEXT_POINT_LABELS;
  const nextPoints = note.nextPoints.map((point, index) => [
    '<li>',
    '<span class="watch-note-point-label">' + (index + 1) + '．' + escapeHtml(nextPointLabels[index]) + '</span>',
    '<strong class="watch-note-point-value">' + escapeHtml(point) + '</strong>',
    '</li>'
  ].join('')).join('\n');
  const giantsLinks = note.tags.includes('giants')
    ? '<a class="button ghost" href="../giants/">巨人の今を見る</a>\n<a class="button ghost" href="../articles/yomiuri-giants-guide">読売ジャイアンツの紹介を見る</a>'
    : '<a class="button ghost" href="../articles/teams">12球団の紹介を見る</a>';

  return applyTemplate(fs.readFileSync(TEMPLATE_PATH, 'utf8'), {
    TITLE: escapeHtml(note.title),
    DESCRIPTION: escapeHtml(note.description),
    CANONICAL: canonical,
    STRUCTURED_DATA: structuredData,
    GAME_LABEL: escapeHtml(note.gameLabel),
    ARTICLE_BADGE: escapeHtml(note.articleBadge),
    PUBLISHED_JA: formatDate(note.published),
    LEAD: escapeHtml(note.lead),
    BODY_HTML: insertArticleMidAd(markdownToHtml(note.bodyMarkdown)),
    NEXT_POINTS: nextPoints,
    GIANTS_LINKS: giantsLinks
  });
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const files = fs.existsSync(CONTENT_DIR)
  ? fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.json')).sort()
  : [];

if (!files.length) {
  console.log('公開対象の観戦メモJSONはありません。');
  process.exit(0);
}

for (const file of files) {
  const sourcePath = path.join(CONTENT_DIR, file);
  const note = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  validate(note, file);
  const sourceRelative = path.relative(ROOT, sourcePath).split(path.sep).join('/');
  const articlePath = '/watch-notes/' + note.slug;
  const articleSource = 'watch-notes/' + note.slug + '.html';
  const existingIndex = data.articles.findIndex((item) => item.path === articlePath);
  const existing = existingIndex >= 0 ? data.articles[existingIndex] : null;

  if (existing && existing.contentSource !== sourceRelative) {
    throw new Error(file + ': 既存記事とURL末尾が重複しています（' + articlePath + '）。');
  }

  const nextPointLabels = Array.isArray(note.nextPointLabels) && note.nextPointLabels.length === 3
    ? note.nextPointLabels
    : DEFAULT_NEXT_POINT_LABELS;

  const entry = {
    type: 'watch-note',
    path: articlePath,
    source: articleSource,
    contentSource: sourceRelative,
    slug: note.slug,
    title: note.title,
    listTitle: note.title,
    description: note.description,
    listDescription: note.listDescription,
    category: '観戦メモ',
    group: 'watch-notes',
    published: note.published,
    updated: note.updated,
    keywords: note.keywords,
    tags: note.tags,
    badges: note.badges,
    articleType: note.articleType || '',
    nextPoints: note.nextPoints,
    nextPointLabels,
    search: true,
    sitemap: true
  };

  fs.writeFileSync(path.join(ROOT, articleSource), pageHtml(note), 'utf8');
  if (existingIndex >= 0) data.articles[existingIndex] = entry;
  else data.articles.push(entry);
  console.log(articleSource + ' を生成しました。');
}

data.updated = data.articles.reduce((latest, item) => item.updated > latest ? item.updated : latest, data.updated);
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('記事データを更新しました（全' + data.articles.length + '件）。');
