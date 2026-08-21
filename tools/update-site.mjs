import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'data', 'articles.json');
const SITE_URL = 'https://pro-baseball-watch-guide.com';

const DEFAULT_NEXT_POINT_LABELS = [
  '打順・起用などで注目する点',
  '状態を確認したい選手',
  '登板状況を見たい投手'
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function write(file, content) {
  fs.writeFileSync(path.join(ROOT, file), content, 'utf8');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value = '') {
  return escapeHtml(value);
}

function cdata(value = '') {
  return String(value).replaceAll(']]>', ']]]]><![CDATA[>');
}

function replaceBlock(source, name, content) {
  const start = `<!-- AUTO:${name}:START -->`;
  const end = `<!-- AUTO:${name}:END -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(source)) {
    throw new Error(`${name} の自動生成マーカーが見つかりません。`);
  }
  return source.replace(pattern, `${start}\n${content.trim()}\n${end}`);
}

function formatDate(date) {
  const [year, month, day] = String(date).split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

function hrefForArticlesIndex(item) {
  if (item.path.startsWith('/articles/')) return item.path.replace('/articles/', '');
  return `..${item.path}`;
}

function badges(item) {
  const values = item.badges?.length ? item.badges : [item.category].filter(Boolean);
  return `<div aria-label="記事の分類" class="badge-list">${values.map(value => `<span class="badge">${escapeHtml(value)}</span>`).join('')}</div>`;
}

function articleCard(item, href, options = {}) {
  const compact = options.compact ? ' compact' : '';
  const label = options.linkLabel || '読む →';
  const generatedAttrs = item.type === 'watch-note'
    ? ` data-watch-note-item="" data-watch-note-tags="${escapeHtml((item.tags || []).join(' '))}"`
    : '';
  return `<article class="article-card${compact}"${generatedAttrs}>
<div>
${badges(item)}
<h3><a href="${escapeHtml(href)}">${escapeHtml(item.listTitle || item.title)}</a></h3>
<p>${escapeHtml(item.listDescription || item.description)}</p>
${options.showDate === false ? '' : `<p class="microcopy">${formatDate(item.published)}公開${item.updated && item.updated !== item.published ? ` / ${formatDate(item.updated)}更新` : ''}</p>`}
</div>
<a class="text-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>
</article>`;
}

function categorySection({ id, eyebrow, title, description, items, extra = '' }) {
  return `<section class="container section article-category-block" id="${id}">
<div class="category-heading"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div><p>${description}</p></div>
<div class="category-article-grid">
${items.map(item => articleCard(item, hrefForArticlesIndex(item), { compact: true })).join('\n')}
</div>
${extra}
</section>`;
}

function validate(data) {
  if (!Array.isArray(data.articles)) throw new Error('data/articles.json の articles が配列ではありません。');
  const paths = new Set();
  for (const item of data.articles) {
    for (const key of ['path', 'source', 'title', 'published', 'group']) {
      if (!item[key]) throw new Error(`${item.path || '不明'}: ${key} がありません。`);
    }
    if (paths.has(item.path)) throw new Error(`重複URL: ${item.path}`);
    paths.add(item.path);
    const source = path.join(ROOT, item.source);
    if (!fs.existsSync(source)) throw new Error(`元ページがありません: ${item.source}`);
    if (item.nextPoints !== undefined) {
      if (!Array.isArray(item.nextPoints) || item.nextPoints.length !== 3 || item.nextPoints.some(point => typeof point !== 'string' || !point.trim())) {
        throw new Error(`${item.path}: nextPoints は空でない文字列3件にしてください。`);
      }
      if (!Array.isArray(item.nextPointLabels) || item.nextPointLabels.length !== 3 || item.nextPointLabels.some(label => typeof label !== 'string' || !label.trim())) {
        throw new Error(`${item.path}: nextPointLabels は空でない文字列3件にしてください。`);
      }
    }
  }
}

function generateHome(data) {
  const latest = data.articles
    .filter(item => item.type === 'watch-note')
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, 3);
  const html = latest.map(item => articleCard(item, item.path)).join('\n');
  const file = 'index.html';
  write(file, replaceBlock(read(file), 'HOME_WATCH_NOTES', html));
}

function latestGiantsWatchNotes(data, limit = 3) {
  return data.articles
    .filter(item => item.type === 'watch-note' && (item.tags || []).includes('giants'))
    .sort((a, b) => b.published.localeCompare(a.published))
    .slice(0, limit);
}

function generateGiants(data) {
  const html = latestGiantsWatchNotes(data)
    .map(item => articleCard(item, item.path))
    .join('\n');
  const file = 'giants/index.html';
  let source = replaceBlock(read(file), 'GIANTS_WATCH_NOTES', html);
  const latestWithNextPoints = latestGiantsWatchNotes(data, 20)
    .find(item => Array.isArray(item.nextPoints) && item.nextPoints.length === 3);
  const nextPointsHtml = latestWithNextPoints
    ? `<section aria-labelledby="next-card-points-title" class="container section">
<div class="section-title">
<p class="eyebrow">From The Latest Note</p>
<h2 id="next-card-points-title">次カードで見たい3つ</h2>
<p class="section-description"><a href="${escapeHtml(latestWithNextPoints.path)}">${escapeHtml(latestWithNextPoints.listTitle || latestWithNextPoints.title)}</a>から、次の試合で見たい点をまとめています。</p>
</div>
<div class="featured-article-grid">
${latestWithNextPoints.nextPoints.map((point, index) => {
  const labels = Array.isArray(latestWithNextPoints.nextPointLabels) && latestWithNextPoints.nextPointLabels.length === 3
    ? latestWithNextPoints.nextPointLabels
    : DEFAULT_NEXT_POINT_LABELS;
  return `<article class="featured-article-card"><span class="badge">${index + 1}</span><h3>${escapeHtml(labels[index])}</h3><p>${escapeHtml(point)}</p></article>`;
}).join('\n')}
</div>
</section>`
    : '';
  source = replaceBlock(source, 'GIANTS_NEXT_POINTS', nextPointsHtml);
  write(file, source);
}

function generateWatchNotes(data) {
  const notes = data.articles
    .filter(item => item.type === 'watch-note')
    .sort((a, b) => b.published.localeCompare(a.published));
  const html = notes.map(item => articleCard(item, item.slug)).join('\n');
  const file = 'watch-notes/index.html';
  let source = replaceBlock(read(file), 'WATCH_NOTE_LIST', html);
  source = source.replace(
    /すべての観戦メモを\d+件表示しています。/,
    `すべての観戦メモを${notes.length}件表示しています。`
  );
  write(file, source);
}

function generateArticlesIndex(data) {
  const byGroup = group => data.articles
    .filter(item => item.group === group)
    .sort((a, b) => {
      const orderDiff = (a.order ?? 999) - (b.order ?? 999);
      return orderDiff || b.published.localeCompare(a.published);
    });

  const latestNotes = byGroup('watch-notes').slice(0, 3);
  const watchSection = `<section class="container section article-category-block" id="watch-notes">
<div class="category-heading"><div><p class="eyebrow">Watch Notes</p><h2>観戦メモ</h2></div><p>巨人戦を中心に、試合で気になった選手・起用・チームの変化を新しい順に残しています。</p></div>
<article class="article-card category-feature"><div><span class="badge">観戦メモ一覧</span><h3><a href="../watch-notes/">観戦メモをまとめて読む</a></h3><p>3連戦の振り返り、選手や起用について感じたことを一覧から探せます。</p></div><a class="text-link" href="../watch-notes/">一覧を見る →</a></article>
<div class="category-article-grid">
${latestNotes.map(item => articleCard(item, `..${item.path}`, { compact: true })).join('\n')}
</div>
</section>`;

  const sections = [
    watchSection,
    categorySection({
      id: 'data',
      eyebrow: 'Player Lens & Data',
      title: 'Player Lens・データ',
      description: '試合で気になった選手を、シーズン成績・直近6試合・守備・バッテリーなどから見返します。',
      items: byGroup('data')
    }),
    categorySection({
      id: 'game-view',
      eyebrow: 'Game View',
      title: '試合の見方',
      description: '先発、打順、継投、守備から、試合の流れを追うための記事です。',
      items: byGroup('game-view')
    }),
    (() => {
      const items = byGroup('teams-stadiums');
      const overview = items.filter(item => !['12球団', '球場ガイド'].includes(item.category) || item.slug === 'teams');
      const teams = items.filter(item => item.category === '12球団' && item.slug !== 'teams');
      const stadiums = items.filter(item => item.category === '球場ガイド');
      return `<section class="container section article-category-block" id="teams-stadiums">
<div class="category-heading"><div><p class="eyebrow">Teams & Stadiums</p><h2>12球団・球場</h2></div><p>12球団の紹介、本拠地球場、球場ルールをそれぞれ一覧から選べます。</p></div>
<div class="category-article-grid">
${overview.map(item => articleCard(item, hrefForArticlesIndex(item), { compact: true })).join('\n')}
</div>
<div class="category-subsection"><h3>12球団ガイド</h3></div>
<div class="category-article-grid">
${teams.map(item => articleCard(item, hrefForArticlesIndex(item), { compact: true })).join('\n')}
</div>
<div class="category-subsection"><h3>球場ガイド</h3></div>
<div class="category-article-grid">
${stadiums.map(item => articleCard(item, hrefForArticlesIndex(item), { compact: true })).join('\n')}
</div>
</section>`;
    })(),
    categorySection({
      id: 'watch-home',
      eyebrow: 'Watch',
      title: '中継・配信',
      description: '見たい試合の主催球団を起点に、配信・テレビの確認方法を整理します。',
      items: byGroup('watch-home')
    })
  ];

  const watchGuide = byGroup('watch-guide');
  const site = byGroup('site');
  sections.push(`<section class="container section article-category-block" id="watch-guide">
<div class="category-heading"><div><p class="eyebrow">Watching Guide</p><h2>観戦準備・特集</h2></div><p>チケット、応援席、シーズンの特集など、観戦前後に役立つ記事をまとめています。</p></div>
<div class="category-article-grid">
${watchGuide.map(item => articleCard(item, hrefForArticlesIndex(item), { compact: true })).join('\n')}
</div>
${site.map(item => articleCard(item, hrefForArticlesIndex(item), { compact: true, showDate: false })).join('\n')}
</section>`);

  const file = 'articles/index.html';
  write(file, replaceBlock(read(file), 'ARTICLE_GROUPS', sections.join('\n')));
}

function generateSitemap(data) {
  const latestNote = data.articles
    .filter(item => item.type === 'watch-note')
    .sort((a, b) => b.updated.localeCompare(a.updated))[0];
  const latestGiantsNote = latestGiantsWatchNotes(data, 1)[0];
  const staticPages = [
    { path: '/', updated: latestNote?.updated || data.updated },
    { path: '/giants/', updated: latestGiantsNote?.updated || data.updated },
    { path: '/articles/', updated: data.updated },
    { path: '/watch-notes/', updated: latestNote?.updated || data.updated },
    { path: '/player-lens/', updated: data.updated },
    { path: '/about', updated: '2026-07-02' },
    { path: '/contact', updated: '2026-06-17' },
    { path: '/disclaimer', updated: '2026-06-17' },
    { path: '/privacy', updated: '2026-06-17' }
  ];
  const entries = [...staticPages, ...data.articles.filter(item => item.sitemap !== false).map(item => ({
    path: item.path,
    updated: item.updated || item.published
  }))];
  const seen = new Set();
  const unique = entries.filter(entry => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map(entry => `  <url><loc>${SITE_URL}${entry.path}</loc><lastmod>${entry.updated}</lastmod></url>`).join('\n')}
</urlset>
`;
  write('sitemap.xml', xml);
}

function generateFeed(data) {
  const notes = data.articles
    .filter(item => item.type === 'watch-note')
    .sort((a, b) => b.published.localeCompare(a.published));
  const latest = notes[0];
  const lastBuildDate = new Date(`${latest?.updated || data.updated}T00:00:00+09:00`).toUTCString();
  const items = notes.map(item => {
    const url = `${SITE_URL}${item.path}`;
    const pubDate = new Date(`${item.published}T00:00:00+09:00`).toUTCString();
    const categories = (item.badges || []).map(value => `    <category>${escapeXml(value)}</category>`).join('\n');
    return `  <item>
    <title>${escapeXml(item.listTitle || item.title)}</title>
    <link>${escapeXml(url)}</link>
    <guid isPermaLink="true">${escapeXml(url)}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${cdata(item.listDescription || item.description)}]]></description>
${categories}
  </item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>プロ野球観戦メモ｜観戦メモRSS</title>
  <link>${SITE_URL}/watch-notes/</link>
  <description>巨人戦を中心に、試合・選手・起用を振り返る観戦メモの新着情報です。</description>
  <language>ja</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`;
  write('feed.xml', xml);
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
validate(data);
generateHome(data);
generateGiants(data);
generateWatchNotes(data);
generateArticlesIndex(data);
generateSitemap(data);
generateFeed(data);
console.log(`記事データ ${data.articles.length}件からトップ・巨人ページ・一覧・RSS・サイトマップを更新しました。`);
