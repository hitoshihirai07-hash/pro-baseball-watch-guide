(() => {
  'use strict';

  const ARTICLE_PAGE_SIZE = 18;
  const CLARITY_LOCAL_CACHE_KEY = 'pbwg-admin-clarity-v1';
  const CLARITY_LOCAL_CACHE_MS = 12 * 60 * 60 * 1000;
  const RECORDS_KEY = 'baseball-observation-log-records-v1';
  const DRAFT_KEY = 'baseball-observation-log-draft-v1';

  const ARTICLE_KIND_LABELS = [
    '1試合の観戦メモ',
    'カードの振り返り',
    '選手・出来事',
    'チーム・起用・戦い方',
    '期間・シーズン総括'
  ];

  const TEAM_INFO = [
    ['巨人', '読売ジャイアンツ', 'giants'], ['阪神', '阪神タイガース', 'tigers'], ['DeNA', '横浜DeNAベイスターズ', 'baystars'],
    ['広島', '広島東洋カープ', 'carp'], ['ヤクルト', '東京ヤクルトスワローズ', 'swallows'], ['中日', '中日ドラゴンズ', 'dragons'],
    ['ソフトバンク', '福岡ソフトバンクホークス', 'hawks'], ['日本ハム', '北海道日本ハムファイターズ', 'fighters'], ['オリックス', 'オリックス・バファローズ', 'buffaloes'],
    ['ロッテ', '千葉ロッテマリーンズ', 'marines'], ['楽天', '東北楽天ゴールデンイーグルス', 'eagles'], ['西武', '埼玉西武ライオンズ', 'lions']
  ];
  const TEAM_ALIAS = new Map();
  const TEAM_SLUG = new Map();
  TEAM_INFO.forEach(([short, official, slug]) => {
    [short, official].forEach((name) => TEAM_ALIAS.set(name, short));
    TEAM_SLUG.set(short, slug);
  });

  const PLAYER_LENS_FILES = [
    { label: '打者成績', path: '2026stats_batter.csv' },
    { label: '投手成績', path: '2026stats_pitcher.csv', dateFields: ['更新日'] },
    { label: '選手マスター', path: 'current_player_master.csv' },
    { label: '打者左右成績', path: '2026_batter_left_and_right_stats.csv' },
    { label: '投手左右成績', path: '2026_pitcher_left_and_right_stats.csv' },
    { label: '新人王候補', path: 'rookie_candidates.csv' },
    { label: '守備位置別出場数', path: 'starter_positions.csv' },
    { label: '直近6試合野手', path: 'recent_batter_6days.csv', dateFields: ['更新日'] },
    { label: '直近6試合投手', path: 'recent_pitcher_6days.csv', dateFields: ['更新日'] },
    { label: '野手1試合成績', path: 'batter_game_result.csv', metaOnly: true },
    { label: '投手1試合成績', path: 'pitcher_daily_results.csv', metaOnly: true },
    { label: '直近6試合盗塁', path: 'recent_steal_6days.csv', dateFields: ['更新日'] },
    { label: '守備成績', path: 'fielding_summary.csv', dateFields: ['更新日'] },
    { label: '交流戦野手', path: 'interleague_batters.csv' },
    { label: '交流戦投手', path: 'interleague_pitchers.csv' },
    { label: '対球団別野手成績', path: 'team_stats_batter.csv', metaOnly: true },
    { label: '対球団別投手成績', path: 'team_stats_pitcher.csv', metaOnly: true },
    { label: '順位・残り試合', path: 'npb_standings.csv', dateFields: ['更新日'] },
    { label: '登録履歴', path: 'registration_history.csv', dateFields: ['更新日時', '更新日', '登録日'] }
  ];

  const state = {
    cloudflare: null,
    ga4: null,
    clarity: null,
    articles: [],
    playerLens: new Map(),
    playerLensReports: [],
    articlePage: 1,
    snsRows: []
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const el = Object.fromEntries([
    'refreshAllButton','summaryCfPv','summaryCfVisits','summaryGa4Users','summaryGa4Sessions','summaryClaritySessions','summaryClarityIssues','summaryArticleCount','summaryLatestArticle','summaryPlayerLens','summaryPlayerLensDetail','pageNotice',
    'cfPageViews','cfVisits','ga4Users','ga4Sessions','ga4Views','ga4EngagementRate','trafficChart','todayActions','siteHealth','rerunHealthButton','cfTopPages','ga4TopPages','ga4Sources','claritySessions','clarityRage','clarityDead','clarityScriptError','clarityStatus','recentArticles',
    'evaluationSearch','evaluationFilter','evaluationSummary','evaluationRows',
    'reloadPlayerLensButton','playerLensDataRows','playerLensHealth',
    'xTeam','xTheme','xCount','xOutput','buildXButton','copyXButton','openXButton','xMessage','xImageCanvas','drawXImageButton','downloadXImageButton','xCandidates','snsDropZone','snsCsvFile','snsFileStatus','snsAnalysisPanel','clearSnsButton','snsSummary','snsCategoryRows','snsTopPosts','snsRecommendations',
    'watchNoteKinds','articleSearch','articleGroupFilter','articleStatusFilter','filteredCount','articleTableBody','paginationLabel','paginationButtons','toast'
  ].map((id) => [id, document.getElementById(id)]));

  let toastTimer = null;

  function formatNumber(value) {
    return new Intl.NumberFormat('ja-JP').format(Number(value) || 0);
  }
  function formatPercent(value, digits = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    const normalized = number <= 1 ? number * 100 : number;
    return `${normalized.toFixed(digits)}%`;
  }
  function formatSeconds(value) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) return '--';
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const min = Math.floor(seconds / 60);
    return `${min}分${Math.round(seconds % 60)}秒`;
  }
  function formatDate(value) {
    const text = String(value || '').trim();
    const match = text.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
    return match ? `${match[1]}/${match[2].padStart(2,'0')}/${match[3].padStart(2,'0')}` : (text || '--');
  }
  function safeJson(value, fallback = null) {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  }
  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('show');
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
  }
  function setNotice(message = '') {
    el.pageNotice.hidden = !message;
    el.pageNotice.textContent = message;
  }
  function normalizeTeam(value) {
    const text = String(value || '').trim();
    return TEAM_ALIAS.get(text) || text;
  }
  function normalizePath(value) {
    if (!value) return '/';
    try {
      const url = new URL(value, location.origin);
      let path = url.pathname || '/';
      path = path.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
      if (path.length > 1) path = path.replace(/\/+$/, '');
      return path || '/';
    } catch {
      let path = String(value).split('?')[0].split('#')[0] || '/';
      if (!path.startsWith('/')) path = `/${path}`;
      if (path.length > 1) path = path.replace(/\/+$/, '');
      return path;
    }
  }
  function numberValue(value) {
    const text = String(value ?? '').replace(/,/g, '').replace(/%/g, '').trim();
    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
  }
  function pick(row, keys) {
    for (const key of keys) {
      if (row && row[key] !== undefined && String(row[key]).trim() !== '') return row[key];
    }
    return '';
  }

  function parseCsv(text) {
    const matrix = [];
    let row = [], cell = '', quoted = false;
    const input = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < input.length; i += 1) {
      const char = input[i], next = input[i + 1];
      if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') i += 1;
        row.push(cell); cell = '';
        if (row.some((value) => value !== '')) matrix.push(row);
        row = [];
      } else cell += char;
    }
    if (cell || row.length) { row.push(cell); if (row.some((value) => value !== '')) matrix.push(row); }
    const headers = (matrix.shift() || []).map((item) => item.trim());
    return matrix.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
  }

  function setupTabs() {
    $$('.workspace-tab').forEach((button) => button.addEventListener('click', () => {
      const target = button.dataset.tab;
      $$('.workspace-tab').forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      $$('.tab-panel').forEach((panel) => {
        const active = panel.dataset.panel === target;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    }));
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `${url} の取得に失敗しました（${response.status}）`);
    return payload;
  }

  async function loadCloudflare() {
    try {
      state.cloudflare = await fetchJson('api/analytics');
      renderCloudflare();
    } catch (error) {
      state.cloudflare = null;
      el.summaryCfPv.textContent = '--';
      el.summaryCfVisits.textContent = '取得できません';
      el.cfPageViews.textContent = '--';
      el.cfVisits.textContent = '--';
      renderTableMessage(el.cfTopPages, 3, error.message);
    }
  }

  function seriesSlice(days) {
    return (state.cloudflare?.series || []).slice(-days);
  }
  function sumRows(rows, key) { return rows.reduce((sum, row) => sum + (Number(row[key]) || 0), 0); }
  function renderCloudflare() {
    const rows = seriesSlice(7);
    const pv = sumRows(rows, 'pageviews');
    const visits = sumRows(rows, 'visits');
    el.summaryCfPv.textContent = formatNumber(pv);
    el.summaryCfVisits.textContent = `${formatNumber(visits)} 訪問`;
    el.cfPageViews.textContent = formatNumber(pv);
    el.cfVisits.textContent = formatNumber(visits);
    renderTrafficChart(rows);
    renderSimplePages(el.cfTopPages, state.cloudflare?.topPages7 || [], ['pageviews','visits']);
    renderPageEvaluation();
    renderTodayActions();
  }

  function renderTrafficChart(rows) {
    const svg = el.trafficChart;
    svg.replaceChildren();
    if (!rows.length) return;
    const width = 760, height = 250, left = 38, right = 12, top = 18, bottom = 28;
    const innerW = width - left - right, innerH = height - top - bottom;
    const max = Math.max(1, ...rows.map((row) => Number(row.pageviews) || 0));
    const ns = 'http://www.w3.org/2000/svg';
    const make = (name, attrs = {}) => {
      const node = document.createElementNS(ns, name);
      Object.entries(attrs).forEach(([key,value]) => node.setAttribute(key, value));
      return node;
    };
    [0,.25,.5,.75,1].forEach((ratio) => {
      const y = top + innerH * ratio;
      svg.append(make('line', { x1:left, x2:width-right, y1:y, y2:y, class:'chart-grid' }));
      const label = make('text', { x:2, y:y+4, class:'chart-label' });
      label.textContent = formatNumber(Math.round(max * (1-ratio)));
      svg.append(label);
    });
    const points = rows.map((row,index) => {
      const x = left + (rows.length === 1 ? innerW/2 : innerW * index/(rows.length-1));
      const y = top + innerH - (Number(row.pageviews)||0)/max*innerH;
      return [x,y,row];
    });
    const area = `M ${points[0][0]} ${top+innerH} ` + points.map(([x,y]) => `L ${x} ${y}`).join(' ') + ` L ${points.at(-1)[0]} ${top+innerH} Z`;
    svg.append(make('path', { d:area, class:'chart-area' }));
    svg.append(make('polyline', { points:points.map(([x,y]) => `${x},${y}`).join(' '), class:'chart-line' }));
    points.forEach(([x,,row],index) => {
      if (index === 0 || index === points.length-1 || points.length <= 7) {
        const label = make('text', { x, y:height-7, 'text-anchor':'middle', class:'chart-label' });
        label.textContent = String(row.date || '').slice(5).replace('-', '/');
        svg.append(label);
      }
    });
  }

  async function loadGa4() {
    try {
      state.ga4 = await fetchJson('api/ga4');
      renderGa4();
    } catch (error) {
      state.ga4 = null;
      el.summaryGa4Users.textContent = '--';
      el.summaryGa4Sessions.textContent = '取得できません';
      ['ga4Users','ga4Sessions','ga4Views','ga4EngagementRate'].forEach((id) => el[id].textContent = '--');
      renderTableMessage(el.ga4TopPages, 3, error.message);
      renderTableMessage(el.ga4Sources, 3, error.message);
    }
  }
  function renderGa4() {
    const overview = state.ga4?.overview30 || {};
    el.summaryGa4Users.textContent = formatNumber(overview.activeUsers);
    el.summaryGa4Sessions.textContent = `${formatNumber(overview.sessions)} セッション`;
    el.ga4Users.textContent = formatNumber(overview.activeUsers);
    el.ga4Sessions.textContent = formatNumber(overview.sessions);
    el.ga4Views.textContent = formatNumber(overview.screenPageViews);
    el.ga4EngagementRate.textContent = formatPercent(overview.engagementRate);
    renderSimplePages(el.ga4TopPages, state.ga4?.pages30 || [], ['screenPageViews','activeUsers']);
    renderGa4Sources();
    renderPageEvaluation();
    renderTodayActions();
  }

  function renderGa4Sources() {
    el.ga4Sources.replaceChildren();
    const rows = (state.ga4?.sources30 || []).slice(0,8);
    if (!rows.length) return renderTableMessage(el.ga4Sources,3,'データがありません。');
    rows.forEach((row)=>{
      const tr=document.createElement('tr');
      tr.innerHTML='<td></td><td></td><td></td>';
      tr.children[0].textContent=row.sessionDefaultChannelGroup || '(not set)';
      tr.children[1].textContent=formatNumber(row.sessions);
      tr.children[2].textContent=formatNumber(row.activeUsers);
      el.ga4Sources.append(tr);
    });
  }

  function clarityLocalCache() {
    const cache = safeJson(localStorage.getItem(CLARITY_LOCAL_CACHE_KEY), null);
    if (!cache?.savedAt || !cache?.payload || Date.now() - cache.savedAt > CLARITY_LOCAL_CACHE_MS) return null;
    return cache.payload;
  }
  async function loadClarity() {
    try {
      const local = clarityLocalCache();
      state.clarity = local || await fetchJson('api/clarity');
      if (!local) localStorage.setItem(CLARITY_LOCAL_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), payload: state.clarity }));
      renderClarity();
    } catch (error) {
      state.clarity = null;
      el.summaryClaritySessions.textContent = '--';
      el.summaryClarityIssues.textContent = '取得できません';
      ['claritySessions','clarityRage','clarityDead','clarityScriptError'].forEach((id) => el[id].textContent = '--');
      el.clarityStatus.textContent = error.message;
      el.clarityStatus.classList.add('error-note');
    }
  }

  function clarityMetricInfo(metricPattern) {
    const metric = (state.clarity?.metrics || []).find((item) => metricPattern.test(String(item.metricName || '')));
    return metric?.information || [];
  }
  function numericFromObject(obj, keyPattern = null) {
    const entries = Object.entries(obj || {}).filter(([key]) => !/^(URL|url|PageTitle|Source|Medium|Browser|Device|OS|Country|Region)$/i.test(key));
    const preferred = keyPattern ? entries.find(([key]) => keyPattern.test(key)) : null;
    const candidates = preferred ? [preferred, ...entries] : entries;
    for (const [,value] of candidates) {
      const number = numberValue(value);
      if (Number.isFinite(number) && String(value ?? '').trim() !== '') return number;
    }
    return 0;
  }
  function clarityTotal(metricPattern, keyPattern = null) {
    const rows = clarityMetricInfo(metricPattern);
    if (!rows.length) return 0;
    return rows.reduce((sum,row) => sum + numericFromObject(row,keyPattern), 0);
  }
  function renderClarity() {
    const trafficRows = clarityMetricInfo(/^Traffic$/i);
    const sessions = trafficRows.reduce((sum,row) => sum + numberValue(pick(row,['totalSessionCount','sessionCount','sessions'])), 0);
    const rage = clarityTotal(/Rage Click/i, /rage|click/i);
    const dead = clarityTotal(/Dead Click/i, /dead|click/i);
    const script = clarityTotal(/Script Error/i, /script|error/i);
    el.summaryClaritySessions.textContent = formatNumber(sessions);
    el.summaryClarityIssues.textContent = `${formatNumber(rage + dead + script)} 要確認操作`;
    el.claritySessions.textContent = formatNumber(sessions);
    el.clarityRage.textContent = formatNumber(rage);
    el.clarityDead.textContent = formatNumber(dead);
    el.clarityScriptError.textContent = formatNumber(script);
    el.clarityStatus.classList.remove('error-note');
    el.clarityStatus.textContent = `直近${state.clarity?.days || 3}日。API取得は12時間キャッシュして回数を節約します。`;
    renderPageEvaluation();
    renderTodayActions();
  }

  function renderSimplePages(tbody, rows, metricKeys) {
    tbody.replaceChildren();
    const visible = (rows || []).slice(0, 8);
    if (!visible.length) return renderTableMessage(tbody, 3, 'データがありません。');
    visible.forEach((row) => {
      const tr = document.createElement('tr');
      const path = normalizePath(row.path || row.unifiedPagePathScreen || row.pagePath || '/');
      const title = row.pageTitle || pageTitleForPath(path);
      const td1 = document.createElement('td'); td1.className = 'path-cell'; td1.title = path; td1.textContent = title || path;
      const td2 = document.createElement('td'); td2.textContent = formatNumber(row[metricKeys[0]]);
      const td3 = document.createElement('td'); td3.textContent = formatNumber(row[metricKeys[1]]);
      tr.append(td1,td2,td3); tbody.append(tr);
    });
  }
  function renderTableMessage(tbody, colspan, message) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-state"></td></tr>`;
    tbody.querySelector('td').textContent = message;
  }

  async function loadArticles() {
    try {
      const payload = await fetchJson('../data/articles.json');
      state.articles = Array.isArray(payload.articles) ? payload.articles : [];
      renderArticleSummary();
      renderArticleKinds();
      renderArticleTable();
      renderRecentArticles();
      renderPageEvaluation();
    } catch (error) {
      state.articles = [];
      el.summaryArticleCount.textContent = '--';
      el.summaryLatestArticle.textContent = '取得できません';
    }
  }

  function articleKind(item) {
    if (ARTICLE_KIND_LABELS.includes(item.articleType)) return item.articleType;
    const title = String(item.title || '');
    const tags = new Set([...(item.tags || []), ...(item.badges || [])]);
    if (/総括|前半戦|後半戦|シーズン/u.test(title)) return '期間・シーズン総括';
    if (tags.has('series') || tags.has('2連戦') || tags.has('3連戦') || /カード振り返り/u.test(title)) return 'カードの振り返り';
    if (/起用|打順|継投|チーム/u.test(title)) return 'チーム・起用・戦い方';
    if (tags.has('single-game') || tags.has('試合観戦')) return '1試合の観戦メモ';
    return '選手・出来事';
  }
  function articleIssue(item) {
    const required = ['title','path','published','description'];
    if (required.some((key) => !String(item[key] || '').trim())) return '基本情報が不足';
    if (item.type === 'watch-note' && item.contentSource && (!Array.isArray(item.nextPoints) || item.nextPoints.length !== 3)) return '次カード3点を確認';
    return '';
  }
  function renderArticleSummary() {
    const notes = state.articles.filter((item) => item.type === 'watch-note').sort((a,b) => String(b.published).localeCompare(String(a.published)));
    el.summaryArticleCount.textContent = formatNumber(state.articles.length);
    el.summaryLatestArticle.textContent = notes[0]?.listTitle || notes[0]?.title || '観戦メモなし';
  }
  function renderRecentArticles() {
    el.recentArticles.replaceChildren();
    const localCount = getLocalRecordsCount();
    if (localCount) {
      const saved = document.createElement('a'); saved.className = 'compact-item'; saved.href = 'watch-note/?records=1';
      saved.innerHTML = '<span><strong>端末内の保存記録</strong><small></small></span><b>開く</b>';
      saved.querySelector('small').textContent = `${localCount}件を保存中`; el.recentArticles.append(saved);
    }
    const notes = state.articles.filter((item) => item.type === 'watch-note').sort((a,b) => String(b.published).localeCompare(String(a.published))).slice(0,4);
    if (!notes.length && !localCount) { el.recentArticles.innerHTML = '<p class="loading-row">観戦メモはありません。</p>'; return; }
    notes.forEach((item) => {
      const a = document.createElement('a'); a.className = 'compact-item'; a.href = `..${item.path}`; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = `<span><strong></strong><small></small></span><b>開く</b>`;
      a.querySelector('strong').textContent = item.listTitle || item.title;
      a.querySelector('small').textContent = formatDate(item.published);
      el.recentArticles.append(a);
    });
  }
  function renderArticleKinds() {
    const notes = state.articles.filter((item) => item.type === 'watch-note');
    const counts = new Map(ARTICLE_KIND_LABELS.map((label) => [label,0]));
    notes.forEach((item) => counts.set(articleKind(item), (counts.get(articleKind(item)) || 0) + 1));
    el.watchNoteKinds.replaceChildren();
    counts.forEach((count,label) => {
      const span = document.createElement('span'); span.className = 'kind-item'; span.innerHTML = `<span></span><b>${count}件</b>`; span.querySelector('span').textContent = label; el.watchNoteKinds.append(span);
    });
  }
  function filteredArticles() {
    const search = el.articleSearch.value.trim().toLowerCase();
    const group = el.articleGroupFilter.value, status = el.articleStatusFilter.value;
    return [...state.articles]
      .filter((item) => group === 'all' || item.type === group)
      .filter((item) => status === 'all' || (status === 'warning' ? Boolean(articleIssue(item)) : !articleIssue(item)))
      .filter((item) => !search || [item.title,item.listTitle,item.description,...(item.badges||[]),...(item.keywords||[])].join(' ').toLowerCase().includes(search))
      .sort((a,b) => String(b.published).localeCompare(String(a.published)));
  }
  function renderArticleTable() {
    const articles = filteredArticles();
    const pages = Math.max(1, Math.ceil(articles.length / ARTICLE_PAGE_SIZE));
    state.articlePage = Math.min(state.articlePage, pages);
    const start = (state.articlePage - 1) * ARTICLE_PAGE_SIZE;
    const visible = articles.slice(start, start + ARTICLE_PAGE_SIZE);
    el.filteredCount.textContent = `${articles.length}件`;
    el.paginationLabel.textContent = articles.length ? `${start+1}～${Math.min(start+ARTICLE_PAGE_SIZE,articles.length)}件 / 全${articles.length}件` : '該当なし';
    el.articleTableBody.replaceChildren();
    if (!visible.length) return renderTableMessage(el.articleTableBody, 5, '条件に合う記事はありません。');
    visible.forEach((item) => {
      const tr = document.createElement('tr');
      const issue = articleIssue(item);
      const type = item.type === 'watch-note' ? articleKind(item) : item.type === 'tool' ? 'ツール' : 'ガイド・記事';
      tr.innerHTML = `<td class="article-title-cell"><strong></strong><small></small></td><td><span class="type-label"></span></td><td></td><td><span class="state-label"></span></td><td><a class="open-link" target="_blank" rel="noopener">開く</a></td>`;
      tr.children[0].querySelector('strong').textContent = item.listTitle || item.title;
      tr.children[0].querySelector('small').textContent = (item.badges || []).join('・') || item.description || '';
      tr.children[1].querySelector('span').textContent = type;
      tr.children[2].textContent = formatDate(item.published);
      const stateLabel = tr.children[3].querySelector('span'); stateLabel.textContent = issue || '公開済み'; stateLabel.classList.add(issue ? 'warning' : 'ok');
      tr.children[4].querySelector('a').href = `..${item.path}`;
      el.articleTableBody.append(tr);
    });
    renderArticlePagination(pages);
  }
  function renderArticlePagination(pages) {
    el.paginationButtons.replaceChildren();
    const add = (label,page,disabled=false) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'page-button'; button.textContent = label; button.disabled = disabled;
      if (page === state.articlePage) button.classList.add('is-active');
      button.addEventListener('click', () => { state.articlePage = page; renderArticleTable(); }); el.paginationButtons.append(button);
    };
    add('‹', Math.max(1,state.articlePage-1), state.articlePage===1);
    for (let page=1;page<=pages;page+=1) {
      if (pages > 7 && page > 2 && page < pages-1 && Math.abs(page-state.articlePage)>1) continue;
      add(String(page),page);
    }
    add('›', Math.min(pages,state.articlePage+1), state.articlePage===pages);
  }

  function pageTitleForPath(path) {
    const item = state.articles.find((article) => normalizePath(article.path) === normalizePath(path));
    if (item) return item.listTitle || item.title;
    if (path === '/') return 'トップ';
    if (path.startsWith('/player-lens')) return `Player Lens ${path.replace('/player-lens','') || 'トップ'}`;
    return path;
  }

  function clarityByPath() {
    const map = new Map();
    for (const item of state.clarity?.byUrl || []) {
      const path = normalizePath(item.url || item.URL || '');
      if (!map.has(path)) map.set(path, { path, metrics:{} });
      Object.assign(map.get(path).metrics, item.metrics || {});
    }
    return map;
  }
  function metricEntry(row, pattern) {
    const match = Object.entries(row?.metrics || {}).find(([name]) => pattern.test(name));
    return match?.[1] || null;
  }
  function metricNumber(row, metricPattern, fieldPattern = null) {
    const entry = metricEntry(row, metricPattern);
    if (!entry) return 0;
    return numericFromObject(entry, fieldPattern);
  }
  function evaluationData() {
    const map = new Map();
    const ensure = (path) => {
      const key = normalizePath(path);
      if (!map.has(key)) map.set(key, { path:key, title:pageTitleForPath(key), cfPv:0, cfVisits:0, ga4Views:0, ga4Users:0, avgSession:0, viewsPerUser:0, scroll:0, rage:0, dead:0 });
      return map.get(key);
    };
    (state.cloudflare?.topPages7 || []).forEach((row) => { const item=ensure(row.path); item.cfPv=Number(row.pageviews)||0; item.cfVisits=Number(row.visits)||0; });
    (state.ga4?.pages30 || []).forEach((row) => { const item=ensure(row.unifiedPagePathScreen || row.pagePath || row.path); item.title=row.pageTitle || item.title; item.ga4Views=Number(row.screenPageViews)||0; item.ga4Users=Number(row.activeUsers)||0; item.avgSession=Number(row.averageEngagementTime)||0; item.viewsPerUser=Number(row.screenPageViewsPerUser)||0; });
    clarityByPath().forEach((row,path) => {
      const item=ensure(path);
      item.scroll=metricNumber(row,/Scroll Depth/i,/scroll|depth/i);
      item.rage=metricNumber(row,/Rage Click/i,/rage|click/i);
      item.dead=metricNumber(row,/Dead Click/i,/dead|click/i);
    });
    return [...map.values()].map((item) => ({ ...item, evaluation:evaluatePage(item) })).sort((a,b) => Math.max(b.ga4Views,b.cfPv)-Math.max(a.ga4Views,a.cfPv));
  }
  function pageEvaluationKind(path) {
    const normalized = normalizePath(path);
    if ([
      '/', '/articles', '/watch-notes', '/player-lens', '/player-lens/teams'
    ].includes(normalized)) return 'navigation';
    if (normalized.startsWith('/player-lens/')) return 'tool';
    return 'content';
  }

  function evaluatePage(item) {
    const kind = pageEvaluationKind(item.path);
    const ga4Users = Number(item.ga4Users) || 0;
    const ga4Views = Number(item.ga4Views) || 0;
    const cfPv = Number(item.cfPv) || 0;
    const avgSession = Number(item.avgSession) || 0;
    const scroll = Number(item.scroll) || 0;
    const rage = Number(item.rage) || 0;
    const dead = Number(item.dead) || 0;

    // ページ品質の判断材料はGA4のユーザー数を基準にする。
    // Cloudflare PVが多くても、GA4ユーザーが少ない段階では改善判断を急がない。
    if (!state.ga4 || ga4Users < 10) {
      const reason = state.ga4
        ? `GA4ユーザー${ga4Users}人のため判断保留`
        : 'GA4データ未取得のため判断保留';
      return { key:'low-data', label:'データ少', tone:'muted', reasons:[reason] };
    }

    const highTraffic = ga4Users >= 15 || ga4Views >= 30 || cfPv >= 40;
    const uxReasons = [];
    if (rage >= 2) uxReasons.push('Rage Clickあり');
    if (dead >= 3) uxReasons.push('Dead Clickあり');

    // 読ませるページだけ、滞在とスクロールを内容改善の判断材料にする。
    // トップ・一覧・Player Lensなどの入口/ツールページは、短時間で次へ進むこと自体を悪く扱わない。
    const contentReasons = [];
    if (kind === 'content') {
      if (avgSession > 0 && avgSession < 20) contentReasons.push('平均Eng時間が短め');
      if (scroll > 0 && scroll < 30) contentReasons.push('スクロールが浅め');
    }

    if (highTraffic && uxReasons.length) {
      return { key:'improve', label:'改善優先', tone:'bad', reasons:uxReasons };
    }
    if (kind === 'content' && highTraffic && contentReasons.length >= 2) {
      return { key:'improve', label:'改善優先', tone:'bad', reasons:contentReasons };
    }

    if (kind === 'content') {
      if (avgSession >= 45 || scroll >= 55) {
        return { key:'good', label:'良好', tone:'good', reasons:[] };
      }
    } else if (!uxReasons.length && (avgSession >= 20 || Number(item.viewsPerUser) >= 1.5)) {
      return { key:'good', label:'良好', tone:'good', reasons:[] };
    }

    const reasons = [];
    if (kind === 'content' && contentReasons.length) reasons.push(...contentReasons);
    if (uxReasons.length) reasons.push(...uxReasons);
    return { key:'watch', label:'様子見', tone:'warn', reasons };
  }
  function renderPageEvaluation() {
    if (!el.evaluationRows) return;
    const all = evaluationData();
    const query = el.evaluationSearch.value.trim().toLowerCase();
    const filter = el.evaluationFilter.value;
    const visible = all.filter((item) => (filter==='all' || item.evaluation.key===filter) && (!query || `${item.title} ${item.path}`.toLowerCase().includes(query)));
    const counts = all.reduce((acc,item) => { acc[item.evaluation.key]=(acc[item.evaluation.key]||0)+1; return acc; },{});
    el.evaluationSummary.innerHTML = [
      ['改善優先',counts.improve||0],['良好',counts.good||0],['様子見',counts.watch||0],['データ少',counts['low-data']||0]
    ].map(([label,count]) => `<span class="evaluation-pill"><span>${label}</span><b>${count}</b></span>`).join('');
    el.evaluationRows.replaceChildren();
    if (!visible.length) return renderTableMessage(el.evaluationRows, 10, '条件に合うページがありません。');
    visible.slice(0,100).forEach((item) => {
      const tr=document.createElement('tr');
      tr.innerHTML = `<td class="page-name"><strong></strong><small></small></td><td>${formatNumber(item.cfPv)}</td><td>${formatNumber(item.ga4Views)}</td><td>${formatNumber(item.ga4Users)}</td><td>${formatSeconds(item.avgSession)}</td><td>${item.viewsPerUser?item.viewsPerUser.toFixed(2):'--'}</td><td>${item.scroll?formatPercent(item.scroll):'--'}</td><td>${formatNumber(item.rage)}</td><td>${formatNumber(item.dead)}</td><td><span class="status-badge ${item.evaluation.tone}"></span></td>`;
      tr.querySelector('.page-name strong').textContent=item.title;
      tr.querySelector('.page-name small').textContent=item.path;
      const badge=tr.querySelector('.status-badge'); badge.textContent=item.evaluation.label; if(item.evaluation.reasons.length) badge.title=item.evaluation.reasons.join(' / ');
      el.evaluationRows.append(tr);
    });
  }

  async function loadPlayerLens(force = false) {
    el.summaryPlayerLens.textContent = '確認中';
    el.summaryPlayerLensDetail.textContent = 'データ取得中';
    el.playerLensDataRows.innerHTML = `<tr><td colspan="4" class="empty-state">データを確認しています。</td></tr>`;
    const reports = await Promise.all(PLAYER_LENS_FILES.map(async (file) => {
      const url = `../player-lens/data/${file.path}${force ? `?v=${Date.now()}` : ''}`;
      try {
        if (file.metaOnly) {
          const response = await fetch(url, { method:'HEAD', cache:'no-store' });
          if (!response.ok) throw new Error(String(response.status));
          return { ...file, ok:true, count:null, latest:'', metaOnly:true };
        }
        const response = await fetch(url, { cache:'no-store' });
        if (!response.ok) throw new Error(String(response.status));
        const text = await response.text();
        const rows = parseCsv(text);
        state.playerLens.set(file.path, rows);
        const latest = latestDate(rows, file.dateFields || ['更新日','更新日時','試合日','日付']);
        return { ...file, ok:true, count:rows.length, latest };
      } catch (error) {
        state.playerLens.delete(file.path);
        return { ...file, ok:false, count:0, latest:'', error:error.message };
      }
    }));
    state.playerLensReports = reports;
    renderPlayerLensReports();
    renderXTeamOptions();
    renderXCandidates();
  }
  function latestDate(rows, fields) {
    let latest='';
    for (const row of rows || []) for (const field of fields || []) {
      const value=String(row[field]||'').trim();
      const comparable=value.replace(/(\d{4})\/(\d{1,2})\/(\d{1,2})/,'$1-$2-$3');
      if (comparable && comparable > latest.replace(/\//g,'-')) latest=value;
    }
    return latest;
  }
  function renderPlayerLensReports() {
    const ok=state.playerLensReports.filter((item)=>item.ok).length;
    const bad=state.playerLensReports.length-ok;
    el.summaryPlayerLens.textContent = bad ? `${ok}/${state.playerLensReports.length}` : '正常';
    el.summaryPlayerLensDetail.textContent = bad ? `${bad}件 要確認` : `${ok}データ取得成功`;
    el.playerLensDataRows.replaceChildren();
    state.playerLensReports.forEach((report) => {
      const tr=document.createElement('tr');
      tr.innerHTML=`<td></td><td>${report.count===null?'—':formatNumber(report.count)}</td><td>${report.latest?formatDate(report.latest):'—'}</td><td><span class="status-badge ${report.ok?'good':'bad'}">${report.ok?'正常':'エラー'}</span></td>`;
      tr.children[0].textContent=report.label; el.playerLensDataRows.append(tr);
    });
    renderTodayActions();
  }

  async function checkPages(target, pages) {
    target.replaceChildren();
    const results = await Promise.all(pages.map(async ([label,url]) => {
      try { const response=await fetch(url,{method:'HEAD',cache:'no-store'}); return {label,url,ok:response.ok,status:response.status}; }
      catch { return {label,url,ok:false,status:0}; }
    }));
    results.forEach((item)=>{
      const div=document.createElement('div'); div.className='health-item'; div.innerHTML=`<span></span><span class="status-badge ${item.ok?'good':'bad'}">${item.ok?'OK':item.status||'ERR'}</span>`; div.children[0].textContent=item.label; target.append(div);
    });
    return results;
  }
  async function runHealthChecks() {
    await Promise.all([
      checkPages(el.siteHealth,[['トップ','../'],['観戦メモ','../watch-notes/'],['Player Lens','../player-lens/'],['記事一覧','../articles/']]),
      checkPages(el.playerLensHealth,[['トップ','../player-lens/'],['球団別','../player-lens/teams'],['データに質問','../player-lens/data-question'],['順位','../player-lens/standings'],['登録状況','../player-lens/roster']])
    ]);
  }

  function renderTodayActions() {
    const actions=[];
    const evals=evaluationData();
    const improve=evals.filter((item)=>item.evaluation.key==='improve').slice(0,2);
    improve.forEach((item)=>actions.push({title:`改善優先：${item.title}`,detail:item.evaluation.reasons.join('・')||item.path,tone:'bad',badge:'確認'}));
    const failed=state.playerLensReports.filter((item)=>!item.ok);
    if (failed.length) actions.push({title:'Player Lensデータ要確認',detail:`${failed.length}件を取得できません`,tone:'bad',badge:'エラー'});
    const rage=clarityTotal(/Rage Click/i,/rage|click/i);
    if (rage>0) actions.push({title:'Rage Clickを確認',detail:`直近3日で${formatNumber(rage)}件`,tone:'warn',badge:'Clarity'});
    if (!actions.length && (state.cloudflare || state.ga4 || state.clarity)) actions.push({title:'大きな異常は見つかっていません',detail:'ページ評価・Player Lensとも致命的な警告なし',tone:'good',badge:'OK'});
    el.todayActions.replaceChildren();
    (actions.length?actions:[{title:'分析データを読み込み中',detail:'少し待ってから自動更新されます',tone:'muted',badge:'待機'}]).forEach((item)=>{
      const div=document.createElement('div'); div.className='action-item'; div.innerHTML=`<span><strong></strong><small></small></span><span class="action-badge ${item.tone}"></span>`; div.querySelector('strong').textContent=item.title; div.querySelector('small').textContent=item.detail; div.querySelector('.action-badge').textContent=item.badge; el.todayActions.append(div);
    });
  }

  function renderXTeamOptions() {
    const current=el.xTeam.value;
    el.xTeam.innerHTML='<option value="all">全体</option>' + TEAM_INFO.map(([short])=>`<option value="${short}">${short}</option>`).join('');
    if ([...el.xTeam.options].some((option)=>option.value===current)) el.xTeam.value=current;
  }
  function playerRows(path, team='all') {
    const rows=state.playerLens.get(path)||[];
    if(team==='all') return rows;
    return rows.filter((row)=>normalizeTeam(pick(row,['チーム','球団名','球団']))===team);
  }
  function validPlayerName(row) { return String(pick(row,['選手名','選手'])||'').trim(); }
  function buildXText() {
    const team=el.xTeam.value, theme=el.xTheme.value, count=Number(el.xCount.value)||5;
    let rows=[], title='', lines=[];
    if(theme==='batter') {
      rows=playerRows('2026stats_batter.csv',team).filter((row)=>validPlayerName(row) && numberValue(row['打席'])>=20).sort((a,b)=>numberValue(b.OPS)-numberValue(a.OPS)).slice(0,count);
      title=`${team==='all'?'NPB':team} 打者OPS`; lines=rows.map((row,i)=>`${i+1}. ${validPlayerName(row)} OPS ${pick(row,['OPS'])||'-'} / 打率 ${pick(row,['打率'])||'-'} / ${pick(row,['本塁打'])||0}HR`);
    } else if(theme==='pitcher') {
      rows=playerRows('2026stats_pitcher.csv',team).filter((row)=>validPlayerName(row) && numberValue(row['投球回(アウト)'])>=15).sort((a,b)=>numberValue(a['防御率'])-numberValue(b['防御率'])).slice(0,count);
      title=`${team==='all'?'NPB':team} 投手防御率`; lines=rows.map((row,i)=>`${i+1}. ${validPlayerName(row)} 防御率 ${pick(row,['防御率'])||'-'} / ${pick(row,['勝'])||0}勝 / ${pick(row,['奪三振'])||0}K`);
    } else if(theme==='recent-batter') {
      rows=playerRows('recent_batter_6days.csv',team).filter((row)=>validPlayerName(row) && numberValue(row['打席'])>=8).sort((a,b)=>numberValue(b['打率'])-numberValue(a['打率'])).slice(0,count);
      title=`${team==='all'?'NPB':team} 直近6試合 野手`; lines=rows.map((row,i)=>`${i+1}. ${validPlayerName(row)} 打率 ${pick(row,['打率'])||'-'} / ${pick(row,['安打'])||0}安打 / ${pick(row,['本塁打'])||0}HR`);
    } else if(theme==='recent-pitcher') {
      rows=playerRows('recent_pitcher_6days.csv',team).filter((row)=>validPlayerName(row) && numberValue(row['登板'])>0).sort((a,b)=>numberValue(a['防御率'])-numberValue(b['防御率'])).slice(0,count);
      title=`${team==='all'?'NPB':team} 直近6試合 投手`; lines=rows.map((row,i)=>`${i+1}. ${validPlayerName(row)} 防御率 ${pick(row,['防御率'])||'-'} / ${pick(row,['登板'])||0}登板 / ${pick(row,['奪三振'])||0}K`);
    } else {
      rows=playerRows('npb_standings.csv',team).sort((a,b)=>numberValue(a['順位'])-numberValue(b['順位']));
      if(team==='all') rows=(state.playerLens.get('npb_standings.csv')||[]).sort((a,b)=>String(a['リーグ']).localeCompare(String(b['リーグ']))||numberValue(a['順位'])-numberValue(b['順位']));
      title=`${team==='all'?'NPB':team} 順位・残り試合`; lines=rows.slice(0,team==='all'?12:1).map((row)=>`${pick(row,['リーグ'])||''} ${pick(row,['順位'])||'-'}位 ${pick(row,['球団'])||'-'} ${pick(row,['勝利'])||0}勝${pick(row,['敗戦'])||0}敗 残り${pick(row,['残り試合'])||0}`);
    }
    if(!lines.length) return '条件に合うデータがありません。';
    const slug=team!=='all'?TEAM_SLUG.get(team):'';
    const link=slug?`https://pro-baseball-watch-guide.com/player-lens/teams/${slug}`:'https://pro-baseball-watch-guide.com/player-lens/';
    return `【Player Lens｜${title}】\n${lines.join('\n')}\n\n${link}\n#プロ野球`;
  }
  function renderXCandidates() {
    const standings=state.playerLens.get('npb_standings.csv')||[];
    const giants=standings.find((row)=>normalizeTeam(row['球団'])==='巨人');
    const batters=playerRows('recent_batter_6days.csv','巨人').filter((row)=>numberValue(row['打席'])>=8).sort((a,b)=>numberValue(b['打率'])-numberValue(a['打率'])).slice(0,2);
    const pitchers=playerRows('recent_pitcher_6days.csv','巨人').filter((row)=>numberValue(row['登板'])>0).sort((a,b)=>numberValue(a['防御率'])-numberValue(b['防御率'])).slice(0,2);
    const candidates=[];
    if(giants) candidates.push(['順位・残り試合',`巨人 ${giants['順位']}位・残り${giants['残り試合']}試合`,'standings']);
    batters.forEach((row)=>candidates.push(['直近好調野手',`${row['選手名']} 打率${row['打率']}`,'recent-batter']));
    pitchers.forEach((row)=>candidates.push(['直近投手',`${row['選手名']} 防御率${row['防御率']}`,'recent-pitcher']));
    el.xCandidates.replaceChildren();
    if(!candidates.length){el.xCandidates.innerHTML='<p class="loading-row">候補を作れるデータがありません。</p>';return;}
    candidates.slice(0,5).forEach(([label,detail,theme])=>{
      const button=document.createElement('button'); button.type='button'; button.className='compact-item'; button.innerHTML='<span><strong></strong><small></small></span><b>使う</b>'; button.querySelector('strong').textContent=label; button.querySelector('small').textContent=detail;
      button.addEventListener('click',()=>{el.xTeam.value='巨人';el.xTheme.value=theme;el.xOutput.value=buildXText();updateXMessage();}); el.xCandidates.append(button);
    });
  }
  function updateXMessage(message='') {
    const length=[...el.xOutput.value].length;
    el.xMessage.textContent=message || `${length}文字${length>280?'（280文字を超えています。編集してください）':''}`;
    el.xMessage.classList.toggle('error-note',length>280);
  }

  function drawXImage() {
    const canvas = el.xImageCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const lines = el.xOutput.value.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean);
    const title = lines[0] || 'Player Lens';
    const body = lines.filter((line)=>!/^https?:\/\//.test(line) && !/^#/.test(line)).slice(1,7);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fffaf4'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f08a24'; ctx.fillRect(0,0,canvas.width,18);
    ctx.fillStyle = '#1f2937'; ctx.font = '700 34px sans-serif'; ctx.fillText('Player Lens',64,86);
    ctx.fillStyle = '#687386'; ctx.font = '500 22px sans-serif'; ctx.fillText('プロ野球観戦メモ / データ投稿',64,122);
    ctx.fillStyle = '#1f2937'; ctx.font = '800 40px sans-serif';
    wrapCanvasText(ctx,title,64,196,1060,52,2);
    let y = 315;
    ctx.font = '700 30px sans-serif';
    body.forEach((line,index)=>{
      ctx.fillStyle = index % 2 === 0 ? '#ffffff' : '#fff3e6';
      ctx.beginPath(); ctx.roundRect(64,y-36,1072,60,12); ctx.fill();
      ctx.fillStyle = '#263142'; ctx.fillText(line.slice(0,58),88,y+3); y += 72;
    });
    ctx.fillStyle = '#f08a24'; ctx.fillRect(64,610,1072,2);
    ctx.fillStyle = '#687386'; ctx.font = '600 20px sans-serif'; ctx.fillText('pro-baseball-watch-guide.com/player-lens/',64,646);
  }

  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=2) {
    const chars = [...String(text || '')];
    let line = '', count = 0;
    for (const char of chars) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line,x,y + count*lineHeight); count += 1; line = char;
        if (count >= maxLines) return;
      } else line = test;
    }
    if (line && count < maxLines) ctx.fillText(line,x,y + count*lineHeight);
  }

  function downloadXImage() {
    drawXImage();
    const link = document.createElement('a');
    link.download = `player-lens-x-${new Date().toISOString().slice(0,10)}.png`;
    link.href = el.xImageCanvas.toDataURL('image/png');
    link.click();
  }

  function classifyPost(text) {
    const value=String(text||'');
    if(/おはよう|こんにちは|こんばんは/.test(value)) return '朝・挨拶';
    if(/Player Lens|プロ野球観戦メモ|サイト|ブログ|記事|プロフのリンク/i.test(value)) return 'サイト紹介';
    if(/予想|見込み|先発予想|スタメン予想|明日|カード/.test(value)) return '予想・展望';
    if(/試合終了|うさほー|勝ち越し|連勝|連敗|振り返り|総括|勝利|敗戦/.test(value)) return '試合結果・振り返り';
    if(/退場|登録抹消|昇格|降格|公示|速報|途中経過|同点|逆転/.test(value)) return '試合中・速報';
    if(/打率|防御率|OPS|得点圏|QS|HQS|連続|打席|投球|本塁打|HR|盗塁|順位|首位|勝率|データ/i.test(value)) return 'データ・記録';
    return 'その他';
  }
  function median(values) {
    const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b); if(!sorted.length)return 0; const m=Math.floor(sorted.length/2); return sorted.length%2?sorted[m]:(sorted[m-1]+sorted[m])/2;
  }
  function analyzeSnsRows(rows) {
    return rows.map((row,index)=>{
      const impressions=numberValue(row['インプレッション数']); const engagement=numberValue(row['エンゲージメント']);
      const url=numberValue(row['URLのクリック数']); const profile=numberValue(row['プロフィールへのアクセス数']);
      return {index,date:String(row['日付']||''),body:String(row['ポスト本文']||'').trim(),link:String(row['ポストのリンク']||''),category:classifyPost(row['ポスト本文']),impressions,engagement,url,profile,engagementRate:impressions?engagement/impressions*100:0};
    }).filter((row)=>row.body);
  }
  function renderSnsAnalysis() {
    const rows=state.snsRows; if(!rows.length){el.snsAnalysisPanel.hidden=true;return;}
    el.snsAnalysisPanel.hidden=false;
    const sum=(key)=>rows.reduce((total,row)=>total+(row[key]||0),0); const impressions=sum('impressions'), engagement=sum('engagement');
    const cards=[['投稿数',rows.length],['総imp',impressions],['中央値imp',median(rows.map((row)=>row.impressions))],['反応率',impressions?`${(engagement/impressions*100).toFixed(1)}%`:'0%'],['URLクリック',sum('url')],['プロフィール',sum('profile')]];
    el.snsSummary.innerHTML=cards.map(([label,value])=>`<article><span>${label}</span><strong>${typeof value==='number'?formatNumber(value):value}</strong></article>`).join('');
    const groups=new Map(); rows.forEach((row)=>{if(!groups.has(row.category))groups.set(row.category,[]);groups.get(row.category).push(row);});
    el.snsCategoryRows.replaceChildren();
    [...groups.entries()].sort((a,b)=>b[1].length-a[1].length).forEach(([category,items])=>{
      const imp=items.reduce((s,r)=>s+r.impressions,0), eng=items.reduce((s,r)=>s+r.engagement,0), url=items.reduce((s,r)=>s+r.url,0);
      const tr=document.createElement('tr'); tr.innerHTML=`<td></td><td>${items.length}</td><td>${formatNumber(median(items.map((r)=>r.impressions)))}</td><td>${imp?(eng/imp*100).toFixed(1):'0.0'}%</td><td>${formatNumber(url)}</td>`; tr.children[0].textContent=category; el.snsCategoryRows.append(tr);
    });
    el.snsTopPosts.replaceChildren();
    [...rows].sort((a,b)=>b.impressions-a.impressions).slice(0,5).forEach((row,index)=>{
      const div=document.createElement('article');div.className='post-item';div.innerHTML=`<header><strong>#${index+1} ${formatNumber(row.impressions)} imp</strong><small></small></header><p></p>`;div.querySelector('small').textContent=`${row.category} / 反応率${row.engagementRate.toFixed(1)}%`;div.querySelector('p').textContent=row.body;el.snsTopPosts.append(div);
    });
    const groupStats=[...groups.entries()].filter(([,items])=>items.length>=2).map(([category,items])=>({category,items,median:median(items.map((r)=>r.impressions)),rate:items.reduce((s,r)=>s+r.impressions,0)?items.reduce((s,r)=>s+r.engagement,0)/items.reduce((s,r)=>s+r.impressions,0)*100:0,url:items.reduce((s,r)=>s+r.url,0)}));
    el.snsRecommendations.replaceChildren();
    if(groupStats.length){
      const reach=[...groupStats].sort((a,b)=>b.median-a.median)[0], reaction=[...groupStats].sort((a,b)=>b.rate-a.rate)[0], traffic=[...groupStats].sort((a,b)=>b.url-a.url)[0];
      [['リーチを狙うなら',`${reach.category}：中央値${formatNumber(reach.median)}imp`],['反応を狙うなら',`${reaction.category}：反応率${reaction.rate.toFixed(1)}%`],['サイト誘導',traffic.url?`${traffic.category}：URLクリック${formatNumber(traffic.url)}件`:'URLクリック実績を増やして比較']].forEach(([title,body])=>{const div=document.createElement('article');div.className='recommendation';div.innerHTML='<strong></strong><p></p>';div.querySelector('strong').textContent=title;div.querySelector('p').textContent=body;el.snsRecommendations.append(div);});
    }
  }
  async function handleSnsFile(file) {
    if(!file) return;
    try {
      const text=await file.text(); const rows=parseCsv(text); const headers=Object.keys(rows[0]||{}); const required=['日付','ポスト本文','インプレッション数','エンゲージメント']; const missing=required.filter((key)=>!headers.includes(key));
      if(missing.length) throw new Error(`必要な列がありません：${missing.join('、')}`);
      state.snsRows=analyzeSnsRows(rows); el.snsFileStatus.textContent=`${file.name} / ${state.snsRows.length}投稿を読み込みました。`; renderSnsAnalysis();
    } catch(error){state.snsRows=[];el.snsFileStatus.textContent=error.message;el.snsFileStatus.classList.add('error-note');renderSnsAnalysis();}
  }

  function getLocalRecordsCount() {
    const records=safeJson(localStorage.getItem(RECORDS_KEY),[]); const draft=safeJson(localStorage.getItem(DRAFT_KEY),null); let count=Array.isArray(records)?records.length:0; if(draft&&typeof draft==='object') count+=1; return count;
  }

  function setupEvents() {
    el.refreshAllButton.addEventListener('click', async()=>{ setNotice('全体を更新しています。'); await Promise.allSettled([loadCloudflare(),loadGa4(),loadClarity(),loadArticles(),loadPlayerLens(true),runHealthChecks()]); setNotice(''); showToast('全体を更新しました'); });
    el.rerunHealthButton.addEventListener('click',runHealthChecks);
    el.reloadPlayerLensButton.addEventListener('click',()=>loadPlayerLens(true));
    el.evaluationSearch.addEventListener('input',renderPageEvaluation); el.evaluationFilter.addEventListener('change',renderPageEvaluation);
    [el.articleSearch,el.articleGroupFilter,el.articleStatusFilter].forEach((control)=>{control.addEventListener('input',()=>{state.articlePage=1;renderArticleTable();});control.addEventListener('change',()=>{state.articlePage=1;renderArticleTable();});});
    el.buildXButton.addEventListener('click',()=>{el.xOutput.value=buildXText();updateXMessage();drawXImage();});
    el.xOutput.addEventListener('input',()=>updateXMessage());
    el.copyXButton.addEventListener('click',async()=>{if(!el.xOutput.value.trim())return;await navigator.clipboard.writeText(el.xOutput.value);updateXMessage('コピーしました。');showToast('投稿文をコピーしました');});
    el.openXButton.addEventListener('click',()=>{const text=el.xOutput.value.trim();if(!text){updateXMessage('先に投稿文を作成してください。');return;}window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`,'_blank','noopener');});
    el.drawXImageButton.addEventListener('click',drawXImage);
    el.downloadXImageButton.addEventListener('click',downloadXImage);
    el.snsCsvFile.addEventListener('change',()=>handleSnsFile(el.snsCsvFile.files?.[0]));
    ['dragenter','dragover'].forEach((name)=>el.snsDropZone.addEventListener(name,(event)=>{event.preventDefault();el.snsDropZone.classList.add('is-dragging');}));
    ['dragleave','drop'].forEach((name)=>el.snsDropZone.addEventListener(name,(event)=>{event.preventDefault();el.snsDropZone.classList.remove('is-dragging');}));
    el.snsDropZone.addEventListener('drop',(event)=>handleSnsFile(event.dataTransfer?.files?.[0]));
    el.clearSnsButton.addEventListener('click',()=>{state.snsRows=[];el.snsCsvFile.value='';el.snsFileStatus.textContent='CSVはまだ読み込まれていません。';el.snsAnalysisPanel.hidden=true;});
  }

  async function init() {
    setupTabs(); setupEvents(); renderXTeamOptions();
    if(getLocalRecordsCount()>0) el.summaryLatestArticle.title=`端末内の保存記録 ${getLocalRecordsCount()}件`;
    await Promise.allSettled([loadArticles(),loadCloudflare(),loadGa4(),loadClarity(),loadPlayerLens(),runHealthChecks()]);
    drawXImage();
    renderTodayActions();
  }

  init();
})();
