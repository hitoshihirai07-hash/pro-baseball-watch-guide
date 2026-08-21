import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_PATH = path.join(ROOT, 'data', 'articles.json');
const REPORT_PATH = path.join(ROOT, 'admin', 'site-check.json');
const SITE_ORIGIN = 'https://pro-baseball-watch-guide.com';
const PLAYER_LENS_PROXY_PATH = path.join(ROOT, 'functions', 'player-lens', '[[path]].js');

function filesUnder(directory, extension = '') {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(absolute, extension));
    else if (!extension || entry.name.endsWith(extension)) result.push(absolute);
  }
  return result;
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function pageUrl(file) {
  const name = relative(file);
  if (name === 'index.html') return '/';
  if (name.endsWith('/index.html')) return `/${name.slice(0, -'index.html'.length)}`;
  return `/${name.replace(/\.html$/, '')}`;
}

function targetCandidates(pathname) {
  const clean = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!clean) return ['index.html'];
  if (clean.endsWith('/')) return [`${clean}index.html`];
  if (path.extname(clean)) return [clean];
  return [`${clean}.html`, `${clean}/index.html`];
}

function localTargetExists(value, sourceFile) {
  if (!value || /^(#|mailto:|tel:|javascript:|data:)/i.test(value)) return true;
  let url;
  try {
    url = new URL(value, `${SITE_ORIGIN}${pageUrl(sourceFile)}`);
  } catch {
    return false;
  }
  if (url.origin !== SITE_ORIGIN || url.pathname.startsWith('/cdn-cgi/')) return true;
  if ((url.pathname === '/player-lens' || url.pathname.startsWith('/player-lens/')) && fs.existsSync(PLAYER_LENS_PROXY_PATH)) return true;
  return targetCandidates(url.pathname).some((candidate) => fs.existsSync(path.join(ROOT, candidate)));
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((value) => seen.has(value) ? duplicates.add(value) : seen.add(value));
  return [...duplicates];
}

function check(label, status, detail, count = 0, samples = []) {
  return { label, status, detail, count, samples: samples.slice(0, 10) };
}

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const articles = Array.isArray(data.articles) ? data.articles : [];
const htmlFiles = filesUnder(ROOT, '.html').filter((file) => !relative(file).startsWith('tools/'));
const publicHtml = htmlFiles.filter((file) => !relative(file).startsWith('admin/'));
const adminHtml = htmlFiles.filter((file) => relative(file).startsWith('admin/'));
const checks = [];

const brokenReferences = [];
for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    if (!localTargetExists(match[1], file)) brokenReferences.push(`${relative(file)} → ${match[1]}`);
  }
}
checks.push(check(
  '内部リンク・画像・CSS・JavaScript',
  brokenReferences.length ? 'error' : 'ok',
  brokenReferences.length ? `${brokenReferences.length}件の参照先が見つかりません。` : `${htmlFiles.length}ページの参照先を確認しました。`,
  brokenReferences.length,
  brokenReferences
));

const playerLensProxyExists = fs.existsSync(PLAYER_LENS_PROXY_PATH);
checks.push(check(
  'Player Lens統合ルート',
  playerLensProxyExists ? 'ok' : 'error',
  playerLensProxyExists ? '/player-lens/ をPlayer Lensへ接続するPages Functionを確認しました。' : 'functions/player-lens/[[path]].js がありません。',
  playerLensProxyExists ? 0 : 1,
  playerLensProxyExists ? [] : ['functions/player-lens/[[path]].js']
));

const missingArticleFiles = articles
  .filter((item) => item.source && !fs.existsSync(path.join(ROOT, item.source)))
  .map((item) => `${item.path} → ${item.source}`);
checks.push(check(
  '記事データとHTML',
  missingArticleFiles.length ? 'error' : 'ok',
  missingArticleFiles.length ? `${missingArticleFiles.length}件の記事HTMLがありません。` : `${articles.length}件の記事データとHTMLを照合しました。`,
  missingArticleFiles.length,
  missingArticleFiles
));

const duplicatePaths = duplicateValues(articles.map((item) => item.path));
const duplicateTitles = duplicateValues(articles.map((item) => item.title));
const duplicateSlugs = duplicateValues(articles.filter((item) => item.type === 'watch-note').map((item) => item.slug));
const duplicateSummary = [...duplicatePaths.map((value) => `URL: ${value}`), ...duplicateSlugs.map((value) => `slug: ${value}`), ...duplicateTitles.map((value) => `タイトル: ${value}`)];
checks.push(check(
  'URL・slug・タイトルの重複',
  duplicateSummary.length ? 'error' : 'ok',
  duplicateSummary.length ? `${duplicateSummary.length}件の重複があります。` : '重複はありません。',
  duplicateSummary.length,
  duplicateSummary
));

const metadataIssues = [];
for (const file of publicHtml) {
  const source = fs.readFileSync(file, 'utf8');
  const missing = [];
  const isRedirectPage = /<meta\s+http-equiv=["']refresh["']/i.test(source);
  if (!/<title>[^<]+<\/title>/i.test(source)) missing.push('title');
  if (!isRedirectPage && !/<meta\s+name=["']description["'][^>]+content=["'][^"']+/i.test(source) && !/<meta\s+content=["'][^"']+["'][^>]+name=["']description["']/i.test(source)) missing.push('description');
  if (relative(file) !== '404.html' && !/<link\s+rel=["']canonical["'][^>]+href=["'][^"']+/i.test(source) && !/<link\s+href=["'][^"']+["'][^>]+rel=["']canonical["']/i.test(source)) missing.push('canonical');
  if (missing.length) metadataIssues.push(`${relative(file)}: ${missing.join('、')}`);
}
checks.push(check(
  'title・description・canonical',
  metadataIssues.length ? 'warning' : 'ok',
  metadataIssues.length ? `${metadataIssues.length}ページに不足があります。` : `${publicHtml.length}ページの基本メタ情報を確認しました。`,
  metadataIssues.length,
  metadataIssues
));

const notes = articles.filter((item) => item.type === 'watch-note');
const feed = fs.existsSync(path.join(ROOT, 'feed.xml')) ? fs.readFileSync(path.join(ROOT, 'feed.xml'), 'utf8') : '';
const feedMissing = notes.filter((item) => !feed.includes(`${SITE_ORIGIN}${item.path}`)).map((item) => item.path);
checks.push(check(
  '観戦メモRSS',
  !feed || feedMissing.length ? 'error' : 'ok',
  !feed ? 'feed.xmlがありません。' : feedMissing.length ? `${feedMissing.length}件がRSSにありません。` : `${notes.length}件の観戦メモを確認しました。`,
  feedMissing.length,
  feedMissing
));

const sitemap = fs.existsSync(path.join(ROOT, 'sitemap.xml')) ? fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8') : '';
const sitemapTargets = articles.filter((item) => item.sitemap !== false);
const sitemapMissing = sitemapTargets.filter((item) => !sitemap.includes(`${SITE_ORIGIN}${item.path}`)).map((item) => item.path);
checks.push(check(
  'サイトマップ',
  !sitemap || sitemapMissing.length ? 'error' : 'ok',
  !sitemap ? 'sitemap.xmlがありません。' : sitemapMissing.length ? `${sitemapMissing.length}件がサイトマップにありません。` : `${sitemapTargets.length}件の記事URLを確認しました。`,
  sitemapMissing.length,
  sitemapMissing
));

const latestGiants = notes
  .filter((item) => (item.tags || []).includes('giants'))
  .sort((a, b) => b.published.localeCompare(a.published))[0];
const giantsPage = fs.existsSync(path.join(ROOT, 'giants', 'index.html')) ? fs.readFileSync(path.join(ROOT, 'giants', 'index.html'), 'utf8') : '';
const giantsOk = Boolean(latestGiants && giantsPage.includes(latestGiants.path));
checks.push(check(
  '「巨人の今」の最新記事',
  giantsOk ? 'ok' : 'error',
  giantsOk ? `${latestGiants.path}を表示しています。` : '最新の巨人戦観戦メモが表示されていません。',
  giantsOk ? 0 : 1,
  giantsOk ? [] : [latestGiants?.path || '最新記事なし']
));

const headers = fs.existsSync(path.join(ROOT, '_headers')) ? fs.readFileSync(path.join(ROOT, '_headers'), 'utf8') : '';
const adminNoindexIssues = adminHtml
  .filter((file) => !/<meta\s+name=["']robots["'][^>]+noindex/i.test(fs.readFileSync(file, 'utf8')))
  .map(relative);
const headersProtectAdmin = /\/admin\/\*[\s\S]*X-Robots-Tag:\s*noindex/i.test(headers);
if (!headersProtectAdmin) adminNoindexIssues.push('_headers: /admin/* のX-Robots-Tag');
checks.push(check(
  '管理画面の検索除外',
  adminNoindexIssues.length ? 'error' : 'ok',
  adminNoindexIssues.length ? `${adminNoindexIssues.length}件の設定を確認してください。` : `${adminHtml.length}ページをnoindexで保護しています。`,
  adminNoindexIssues.length,
  adminNoindexIssues
));

const status = checks.some((item) => item.status === 'error')
  ? 'error'
  : checks.some((item) => item.status === 'warning') ? 'warning' : 'ok';
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status,
  summary: {
    pages: htmlFiles.length,
    articles: articles.length,
    watchNotes: notes.length,
    errors: checks.filter((item) => item.status === 'error').length,
    warnings: checks.filter((item) => item.status === 'warning').length
  },
  checks
};

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`サイトチェック: ${status}（エラー ${report.summary.errors} / 注意 ${report.summary.warnings}）`);
checks.filter((item) => item.status !== 'ok').forEach((item) => console.log(`- ${item.label}: ${item.detail}`));
if (status === 'error') process.exitCode = 1;
