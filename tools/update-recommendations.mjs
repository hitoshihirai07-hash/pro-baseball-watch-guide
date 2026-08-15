import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECOMMENDATIONS_PATH = path.join(ROOT, 'data', 'recommendations.json');
const ARTICLES_DATA_PATH = path.join(ROOT, 'data', 'articles.json');
const ARTICLES_INDEX_PATH = path.join(ROOT, 'articles', 'index.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://pro-baseball-watch-guide.com';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(date) {
  const [year, month, day] = String(date).split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function validateRecommendationData(data) {
  if (!data || !Array.isArray(data.articles)) {
    throw new Error('data/recommendations.json の articles が配列ではありません。');
  }
  const paths = new Set();
  for (const item of data.articles) {
    for (const key of ['path', 'source', 'title', 'published']) {
      if (!item[key]) throw new Error(`${item.path || '不明'}: ${key} がありません。`);
    }
    if (!item.path.startsWith('/articles/')) {
      throw new Error(`${item.path}: おすすめ記事は /articles/ 配下にしてください。`);
    }
    if (paths.has(item.path)) throw new Error(`おすすめ記事のURL重複: ${item.path}`);
    paths.add(item.path);
    if (!fs.existsSync(path.join(ROOT, item.source))) {
      throw new Error(`おすすめ記事の元ページがありません: ${item.source}`);
    }
  }
}

function normalizeItem(item) {
  return {
    type: item.type || 'recommendation',
    path: item.path,
    source: item.source,
    slug: item.slug || item.path.split('/').filter(Boolean).pop(),
    title: item.title,
    listTitle: item.listTitle || item.title,
    description: item.description || item.listDescription || '',
    listDescription: item.listDescription || item.description || '',
    category: item.category || '観戦グッズ・おすすめ',
    group: 'recommendations',
    published: item.published,
    updated: item.updated || item.published,
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    badges: Array.isArray(item.badges) && item.badges.length ? item.badges : ['観戦グッズ'],
    search: item.search !== false,
    sitemap: item.sitemap !== false,
    order: item.order ?? 999
  };
}

function mergeIntoArticleData(recommendations) {
  const data = JSON.parse(fs.readFileSync(ARTICLES_DATA_PATH, 'utf8'));
  if (!Array.isArray(data.articles)) throw new Error('data/articles.json の articles が配列ではありません。');

  const previousRecommendationPaths = data.articles
    .filter(item => item.group === 'recommendations' || item.type === 'recommendation')
    .map(item => item.path)
    .filter(Boolean);
  const base = data.articles.filter(item => item.group !== 'recommendations' && item.type !== 'recommendation');
  data.articles = [...base, ...recommendations];
  data.updated = data.articles.reduce(
    (latest, item) => (item.updated || item.published || '') > latest ? (item.updated || item.published) : latest,
    data.updated || ''
  );
  fs.writeFileSync(ARTICLES_DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return previousRecommendationPaths;
}

function badges(item) {
  const values = item.badges?.length ? item.badges : [item.category].filter(Boolean);
  return `<div aria-label="記事の分類" class="badge-list">${values.map(value => `<span class="badge">${escapeHtml(value)}</span>`).join('')}</div>`;
}

function articleCard(item) {
  const href = item.path.replace('/articles/', '');
  return `<article class="article-card compact">
<div>
${badges(item)}
<h3><a href="${escapeHtml(href)}">${escapeHtml(item.listTitle || item.title)}</a></h3>
<p>${escapeHtml(item.listDescription || item.description)}</p>
<p class="microcopy">${formatDate(item.published)}公開${item.updated && item.updated !== item.published ? ` / ${formatDate(item.updated)}更新` : ''}</p>
</div>
<a class="text-link" href="${escapeHtml(href)}">読む →</a>
</article>`;
}

function recommendationSection(items) {
  const sorted = [...items].sort((a, b) => {
    const orderDiff = (a.order ?? 999) - (b.order ?? 999);
    return orderDiff || b.published.localeCompare(a.published);
  });
  return `<!-- AUTO:RECOMMENDATIONS:START -->
<section class="container section article-category-block" id="watch-gear">
<div class="category-heading"><div><p class="eyebrow">Watching Gear</p><h2>観戦グッズ・おすすめ</h2></div><p>球場観戦で困りやすい、見え方・充電・暑さ・雨・座席の疲れを減らすためのアイテムを紹介します。</p></div>
<div class="category-article-grid">
${sorted.map(articleCard).join('\n')}
</div>
</section>
<!-- AUTO:RECOMMENDATIONS:END -->`;
}

function updateArticlesIndex(items) {
  let html = fs.readFileSync(ARTICLES_INDEX_PATH, 'utf8');

  html = html.replace(/\n?<!-- AUTO:RECOMMENDATIONS:START -->[\s\S]*?<!-- AUTO:RECOMMENDATIONS:END -->\n?/g, '\n');

  const archiveStart = '<section class="container section article-category-block archive-section" id="archive">';
  if (!html.includes(archiveStart)) {
    throw new Error('articles/index.html の過去の記事セクションを確認できません。');
  }
  if (items.length) {
    html = html.replace(archiveStart, `${recommendationSection(items)}\n${archiveStart}`);
  }

  const gearChip = '<a class="category-chip" href="#watch-gear">観戦グッズ・おすすめ</a>';
  html = html.replace(gearChip, '');
  const archiveChip = '<a class="category-chip" href="#archive">過去の記事</a>';
  if (!html.includes(archiveChip)) {
    throw new Error('articles/index.html のカテゴリショートカットを確認できません。');
  }
  if (items.length) html = html.replace(archiveChip, `${gearChip}${archiveChip}`);

  const gearSuggestion = '<button data-search-suggestion="観戦グッズ" type="button">観戦グッズ</button>';
  html = html.replace(gearSuggestion, '');
  const streamingSuggestion = '<button data-search-suggestion="配信" type="button">配信</button>';
  if (items.length && html.includes(streamingSuggestion)) {
    html = html.replace(streamingSuggestion, `${streamingSuggestion}${gearSuggestion}`);
  }

  html = html.replaceAll(
    '観戦メモ、試合の見方、12球団・球場、中継・配信、データ、SNS投稿',
    '観戦メモ、試合の見方、12球団・球場、中継・配信、データ、観戦グッズ・おすすめ、SNS投稿'
  );
  html = html.replace(
    '観戦メモ、Player Lens・データ、試合の見方、12球団・球場、中継・配信から、気になるテーマを選べます。',
    '観戦メモ、Player Lens・データ、試合の見方、12球団・球場、中継・配信、観戦グッズ・おすすめから、気になるテーマを選べます。'
  );

  fs.writeFileSync(ARTICLES_INDEX_PATH, html, 'utf8');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateSitemap(items, previousPaths = []) {
  let xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const pathsToRemove = new Set([
    ...previousPaths,
    ...items.map(item => item.path)
  ].filter(Boolean));
  for (const itemPath of pathsToRemove) {
    const loc = `${SITE_URL}${itemPath}`;
    const pattern = new RegExp(`\\s*<url><loc>${escapeRegExp(loc)}</loc><lastmod>[^<]*</lastmod></url>\\s*`, 'g');
    xml = xml.replace(pattern, '\n');
  }

  const entries = items
    .filter(item => item.sitemap !== false)
    .map(item => `  <url><loc>${SITE_URL}${item.path}</loc><lastmod>${item.updated || item.published}</lastmod></url>`)
    .join('\n');

  if (!xml.includes('</urlset>')) throw new Error('sitemap.xml の </urlset> が見つかりません。');
  xml = xml.replace('</urlset>', `${entries ? entries + '\n' : ''}</urlset>`);
  xml = xml.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
}

if (!fs.existsSync(RECOMMENDATIONS_PATH)) {
  console.log('data/recommendations.json がないため、おすすめ記事更新をスキップしました。');
  process.exit(0);
}

const source = JSON.parse(fs.readFileSync(RECOMMENDATIONS_PATH, 'utf8'));
validateRecommendationData(source);
const recommendations = source.articles.map(normalizeItem);
const previousRecommendationPaths = mergeIntoArticleData(recommendations);
updateArticlesIndex(recommendations);
updateSitemap(recommendations, previousRecommendationPaths);
console.log(`おすすめ記事 ${recommendations.length}件を記事検索・記事一覧・サイトマップへ反映しました。`);
