import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'watch-notes');
const DATA_PATH = path.join(ROOT, 'data', 'articles.json');
const TEMPLATE_PATH = path.join(ROOT, 'tools', 'templates', 'watch-note.html');
const SITE_URL = 'https://pro-baseball-watch-guide.com';

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
  validateStringArray(note.keywords, sourceFile + ': keywords');
  validateStringArray(note.tags, sourceFile + ': tags');
  validateStringArray(note.badges, sourceFile + ': badges');
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
  const nextPoints = note.nextPoints.map((point) => '<li>' + escapeHtml(point) + '</li>').join('\n');
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
    BODY_HTML: markdownToHtml(note.bodyMarkdown),
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
    nextPoints: note.nextPoints,
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
