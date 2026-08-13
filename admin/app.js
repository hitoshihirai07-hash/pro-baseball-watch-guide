(() => {
  'use strict';

  const RECORDS_KEY = 'baseball-observation-log-records-v1';
  const DRAFT_KEY = 'baseball-observation-log-draft-v1';
  const PAGE_SIZE = 20;
  const ARTICLE_KIND_LABELS = [
    '1試合の観戦メモ',
    '3連戦・カードの振り返り',
    '選手・出来事',
    'チーム・起用・戦い方',
    '期間・シーズン総括'
  ];

  const state = {
    articles: [],
    analytics: null,
    days: 7,
    page: 1,
    health: null
  };

  const $ = (selector) => document.querySelector(selector);
  const el = {
    allArticleCount: $('#allArticleCount'),
    articleUpdateLabel: $('#articleUpdateLabel'),
    watchNoteCount: $('#watchNoteCount'),
    watchNoteTypeLabel: $('#watchNoteTypeLabel'),
    latestPublished: $('#latestPublished'),
    latestTitle: $('#latestTitle'),
    siteStatusSummary: $('#siteStatusSummary'),
    siteCheckedAt: $('#siteCheckedAt'),
    pageNotice: $('#pageNotice'),
    analyticsLoading: $('#analyticsLoading'),
    analyticsSetup: $('#analyticsSetup'),
    analyticsSetupMessage: $('#analyticsSetupMessage'),
    analyticsContent: $('#analyticsContent'),
    pageViews: $('#pageViews'),
    visits: $('#visits'),
    pageViewsChange: $('#pageViewsChange'),
    visitsChange: $('#visitsChange'),
    trendChart: $('#trendChart'),
    popularPeriod: $('#popularPeriod'),
    popularPagesBody: $('#popularPagesBody'),
    draftCountLabel: $('#draftCountLabel'),
    draftList: $('#draftList'),
    healthList: $('#healthList'),
    watchNoteKinds: $('#watchNoteKinds'),
    articleSearch: $('#articleSearch'),
    articleGroupFilter: $('#articleGroupFilter'),
    articleStatusFilter: $('#articleStatusFilter'),
    filteredCount: $('#filteredCount'),
    articleTableBody: $('#articleTableBody'),
    paginationLabel: $('#paginationLabel'),
    paginationButtons: $('#paginationButtons'),
    refreshButton: $('#refreshButton'),
    rerunHealthButton: $('#rerunHealthButton'),
    toast: $('#toast')
  };

  let toastTimer;

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('ja-JP').format(Number(value) || 0);
  }

  function formatDate(value, withYear = true) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return value || '--';
    const [year, month, day] = value.split('-').map(Number);
    return withYear ? `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}` : `${month}/${day}`;
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '日時不明';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('show');
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2300);
  }

  function articleKind(item) {
    if (ARTICLE_KIND_LABELS.includes(item.articleType)) return item.articleType;
    const savedTypeLabels = {
      '選手について感じたこと': '選手・出来事',
      'チーム・起用・戦い方について感じたこと': 'チーム・起用・戦い方',
      '期間・シーズンの総括': '期間・シーズン総括'
    };
    if (savedTypeLabels[item.articleType]) return savedTypeLabels[item.articleType];
    const title = String(item.title || '');
    const tags = new Set([...(item.tags || []), ...(item.badges || [])]);
    if (/総括|前半戦|後半戦|シーズン/u.test(title) || tags.has('前半戦総括')) return '期間・シーズン総括';
    if (tags.has('series') || tags.has('3連戦') || /カード振り返り/u.test(title)) return '3連戦・カードの振り返り';
    if (/起用|打順|継投|チーム/u.test(title)) return 'チーム・起用・戦い方';
    if (tags.has('single-game') || tags.has('試合観戦')) return '1試合の観戦メモ';
    return '選手・出来事';
  }

  function articleGroupLabel(item) {
    if (item.type === 'watch-note') return articleKind(item);
    if (item.type === 'tool') return 'ツール';
    const labels = {
      data: 'Player Lens・データ',
      'game-view': '試合の見方',
      'teams-stadiums': '12球団・球場',
      'watch-home': '中継・配信',
      archive: '過去の記事',
      site: 'サイト案内'
    };
    return labels[item.group] || 'ガイド・記事';
  }

  function articleIssue(item) {
    const required = ['title', 'path', 'published', 'description'];
    if (required.some((key) => !String(item[key] || '').trim())) return '基本情報が不足';
    if (item.type === 'watch-note' && item.contentSource && (!Array.isArray(item.nextPoints) || item.nextPoints.length !== 3)) {
      return '次カード3点を確認';
    }
    if (item.type === 'watch-note' && item.contentSource && (!Array.isArray(item.nextPointLabels) || item.nextPointLabels.length !== 3)) {
      return '次カード3点の項目名を確認';
    }
    return '';
  }

  function publicPath(path) {
    if (!path) return '#';
    return path.startsWith('/') ? `..${path}` : `../${path}`;
  }

  async function loadArticleData() {
    const response = await fetch('../data/articles.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`記事データを取得できません（${response.status}）`);
    const data = await response.json();
    if (!Array.isArray(data.articles)) throw new Error('記事データの形式が正しくありません。');
    state.articles = data.articles;
    renderSummary(data);
    renderArticleKinds();
    renderArticleTable();
  }

  function renderSummary(data) {
    const notes = state.articles.filter((item) => item.type === 'watch-note').sort((a, b) => b.published.localeCompare(a.published));
    const latest = notes[0];
    el.allArticleCount.textContent = formatNumber(state.articles.length);
    el.articleUpdateLabel.textContent = `データ更新 ${formatDate(data.updated)}`;
    el.watchNoteCount.textContent = formatNumber(notes.length);
    el.watchNoteTypeLabel.textContent = `${new Set(notes.map(articleKind)).size}種類で管理`;
    el.latestPublished.textContent = latest ? formatDate(latest.published) : '--';
    el.latestTitle.textContent = latest?.listTitle || latest?.title || '観戦メモなし';
    el.latestTitle.title = el.latestTitle.textContent;
  }

  function renderArticleKinds() {
    const notes = state.articles.filter((item) => item.type === 'watch-note');
    const counts = new Map(ARTICLE_KIND_LABELS.map((label) => [label, 0]));
    notes.forEach((item) => counts.set(articleKind(item), (counts.get(articleKind(item)) || 0) + 1));
    el.watchNoteKinds.replaceChildren();
    counts.forEach((count, label) => {
      const span = document.createElement('span');
      span.className = 'kind-item';
      const dot = document.createElement('i');
      const text = document.createElement('span');
      text.textContent = label;
      const number = document.createElement('b');
      number.textContent = `${count}件`;
      span.append(dot, text, number);
      el.watchNoteKinds.append(span);
    });
  }

  function filteredArticles() {
    const search = el.articleSearch.value.trim().toLowerCase();
    const group = el.articleGroupFilter.value;
    const status = el.articleStatusFilter.value;
    return [...state.articles]
      .filter((item) => group === 'all' || item.type === group)
      .filter((item) => status === 'all' || (status === 'warning' ? Boolean(articleIssue(item)) : !articleIssue(item)))
      .filter((item) => {
        if (!search) return true;
        return [item.title, item.listTitle, item.description, ...(item.badges || []), ...(item.keywords || [])]
          .join(' ').toLowerCase().includes(search);
      })
      .sort((a, b) => b.published.localeCompare(a.published));
  }

  function renderArticleTable() {
    const articles = filteredArticles();
    const pageCount = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
    if (state.page > pageCount) state.page = pageCount;
    const start = (state.page - 1) * PAGE_SIZE;
    const visible = articles.slice(start, start + PAGE_SIZE);
    el.filteredCount.textContent = `${articles.length}件`;
    el.paginationLabel.textContent = articles.length ? `${start + 1}～${Math.min(start + PAGE_SIZE, articles.length)}件 / 全${articles.length}件` : '該当する記事はありません';
    el.articleTableBody.replaceChildren();

    if (!visible.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = '条件に合う記事はありません。';
      row.append(cell);
      el.articleTableBody.append(row);
    }

    visible.forEach((item) => {
      const row = document.createElement('tr');
      const titleCell = document.createElement('td');
      titleCell.className = 'article-title-cell';
      const title = document.createElement('strong');
      title.textContent = item.listTitle || item.title;
      const description = document.createElement('small');
      description.textContent = (item.badges || []).join('・') || item.description || '';
      titleCell.append(title, description);

      const typeCell = document.createElement('td');
      const type = document.createElement('span');
      type.className = `type-label ${item.type}`;
      type.textContent = articleGroupLabel(item);
      typeCell.append(type);

      const dateCell = document.createElement('td');
      dateCell.className = 'date-cell';
      dateCell.textContent = formatDate(item.published);

      const statusCell = document.createElement('td');
      const issue = articleIssue(item);
      const statusLabel = document.createElement('span');
      statusLabel.className = `status-label ${issue ? 'warning' : 'ok'}`;
      statusLabel.textContent = issue || '公開済み';
      statusCell.append(statusLabel);

      const actionCell = document.createElement('td');
      const open = document.createElement('a');
      open.className = 'open-link';
      open.href = publicPath(item.path);
      open.target = '_blank';
      open.rel = 'noopener';
      open.textContent = '開く';
      actionCell.append(open);
      row.append(titleCell, typeCell, dateCell, statusCell, actionCell);
      el.articleTableBody.append(row);
    });
    renderPagination(pageCount);
  }

  function renderPagination(pageCount) {
    el.paginationButtons.replaceChildren();
    const previous = pageButton('‹', state.page - 1, state.page === 1, '前のページ');
    el.paginationButtons.append(previous);
    for (let page = 1; page <= pageCount; page += 1) {
      if (pageCount > 7 && page > 2 && page < pageCount - 1 && Math.abs(page - state.page) > 1) continue;
      const button = pageButton(String(page), page, false, `${page}ページ`);
      if (page === state.page) button.classList.add('is-active');
      el.paginationButtons.append(button);
    }
    el.paginationButtons.append(pageButton('›', state.page + 1, state.page === pageCount, '次のページ'));
  }

  function pageButton(label, page, disabled, ariaLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-button';
    button.textContent = label;
    button.disabled = disabled;
    button.setAttribute('aria-label', ariaLabel);
    button.addEventListener('click', () => {
      state.page = page;
      renderArticleTable();
      $('.article-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return button;
  }

  function getLocalRecords() {
    const records = safeParse(localStorage.getItem(RECORDS_KEY), []);
    const draft = safeParse(localStorage.getItem(DRAFT_KEY), null);
    const list = Array.isArray(records) ? records.filter((record) => record && typeof record === 'object') : [];
    if (draft && typeof draft === 'object' && !list.some((record) => record.id === draft.id)) list.push(draft);
    return list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  }

  function renderDrafts() {
    const records = getLocalRecords();
    el.draftCountLabel.textContent = records.length ? `${records.length}件をこの端末に保存` : '保存した記録はありません';
    el.draftList.replaceChildren();
    if (!records.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-small';
      empty.textContent = '観戦メモ作成画面で入力すると、ここに表示されます。';
      el.draftList.append(empty);
      return;
    }
    records.slice(0, 3).forEach((record) => {
      const link = document.createElement('a');
      link.className = 'draft-item';
      link.href = 'watch-note/?records=1';
      const info = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = record.gameTitle || '名称未入力の記録';
      const meta = document.createElement('small');
      meta.textContent = record.updatedAt ? `更新 ${formatDateTime(record.updatedAt)}` : '更新日時不明';
      info.append(title, meta);
      const action = document.createElement('b');
      action.textContent = '開く';
      link.append(info, action);
      el.draftList.append(link);
    });
  }

  function dayKey(date) {
    return date.toISOString().slice(0, 10);
  }

  function dateRange(days, offset = 0) {
    const end = new Date();
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() - offset);
    const result = [];
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(end);
      date.setUTCDate(end.getUTCDate() - index);
      result.push(dayKey(date));
    }
    return result;
  }

  function periodSeries(days, offset = 0) {
    const source = new Map((state.analytics?.series || []).map((row) => [row.date, row]));
    return dateRange(days, offset).map((date) => ({ date, pageviews: 0, visits: 0, ...(source.get(date) || {}) }));
  }

  function sumSeries(series, key) {
    return series.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
  }

  function changeLabel(current, previous) {
    if (!previous) return { text: current ? '前期間は0' : '前期間と同じ', className: 'change-neutral' };
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < .05) return { text: '前期間と同じ', className: 'change-neutral' };
    return {
      text: `${change > 0 ? '+' : ''}${change.toFixed(1)}%（前期間比）`,
      className: change > 0 ? 'change-up' : 'change-down'
    };
  }

  function setChange(element, current, previous) {
    const value = changeLabel(current, previous);
    element.textContent = value.text;
    element.className = value.className;
  }

  function renderAnalytics() {
    const current = periodSeries(state.days);
    const previous = periodSeries(state.days, state.days);
    const pageviews = sumSeries(current, 'pageviews');
    const visits = sumSeries(current, 'visits');
    el.pageViews.textContent = formatNumber(pageviews);
    el.visits.textContent = formatNumber(visits);
    setChange(el.pageViewsChange, pageviews, sumSeries(previous, 'pageviews'));
    setChange(el.visitsChange, visits, sumSeries(previous, 'visits'));
    el.popularPeriod.textContent = `過去${state.days}日`;
    renderChart(current);
    renderPopularPages(state.days === 7 ? state.analytics.topPages7 : state.analytics.topPages30);
  }

  function svgElement(name, attributes = {}) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function renderChart(series) {
    const svg = el.trendChart;
    svg.replaceChildren();
    const width = 680;
    const height = 250;
    const padding = { top: 20, right: 16, bottom: 34, left: 44 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maximum = Math.max(1, ...series.flatMap((row) => [row.pageviews, row.visits]));
    const roundedMax = Math.ceil(maximum / Math.max(1, Math.pow(10, Math.floor(Math.log10(maximum))))) * Math.max(1, Math.pow(10, Math.floor(Math.log10(maximum))));

    for (let index = 0; index <= 4; index += 1) {
      const y = padding.top + (plotHeight / 4) * index;
      svg.append(svgElement('line', { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: 'chart-grid' }));
      const label = svgElement('text', { x: padding.left - 7, y: y + 4, 'text-anchor': 'end', class: 'chart-axis-label' });
      label.textContent = formatNumber(Math.round(roundedMax * (1 - index / 4)));
      svg.append(label);
    }

    const x = (index) => padding.left + (series.length === 1 ? plotWidth / 2 : (plotWidth * index) / (series.length - 1));
    const y = (value) => padding.top + plotHeight - (plotHeight * value) / roundedMax;
    const points = (key) => series.map((row, index) => `${x(index)},${y(row[key])}`).join(' ');
    svg.append(svgElement('polyline', { points: points('pageviews'), class: 'chart-pageviews' }));
    svg.append(svgElement('polyline', { points: points('visits'), class: 'chart-visits' }));

    const labelEvery = state.days === 7 ? 1 : 5;
    series.forEach((row, index) => {
      if (index % labelEvery === 0 || index === series.length - 1) {
        const label = svgElement('text', { x: x(index), y: height - 10, 'text-anchor': 'middle', class: 'chart-axis-label' });
        label.textContent = formatDate(row.date, false);
        svg.append(label);
      }
      if (state.days === 7) {
        svg.append(svgElement('circle', { cx: x(index), cy: y(row.pageviews), r: 3.2, class: 'chart-point-pageviews' }));
        svg.append(svgElement('circle', { cx: x(index), cy: y(row.visits), r: 2.8, class: 'chart-point-visits' }));
      }
    });
  }

  function renderPopularPages(pages = []) {
    el.popularPagesBody.replaceChildren();
    const visible = pages.filter((row) => !String(row.path || '').startsWith('/admin')).slice(0, 10);
    if (!visible.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 4;
      cell.textContent = 'この期間の閲覧データはまだありません。';
      row.append(cell);
      el.popularPagesBody.append(row);
      return;
    }
    visible.forEach((page, index) => {
      const article = state.articles.find((item) => item.path === page.path || `${item.path}/` === page.path);
      const row = document.createElement('tr');
      const pageCell = document.createElement('td');
      pageCell.className = 'page-cell';
      const link = document.createElement('a');
      link.href = publicPath(page.path);
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = `${index + 1}. ${article?.listTitle || article?.title || page.path}`;
      const path = document.createElement('small');
      path.textContent = page.path;
      pageCell.append(link, path);
      const views = document.createElement('td');
      views.className = 'numeric';
      views.textContent = formatNumber(page.pageviews);
      const visits = document.createElement('td');
      visits.className = 'numeric';
      visits.textContent = formatNumber(page.visits);
      const action = document.createElement('td');
      const open = document.createElement('a');
      open.className = 'open-link';
      open.href = publicPath(page.path);
      open.target = '_blank';
      open.rel = 'noopener';
      open.textContent = '開く';
      action.append(open);
      row.append(pageCell, views, visits, action);
      el.popularPagesBody.append(row);
    });
  }

  async function loadAnalytics() {
    el.analyticsLoading.hidden = false;
    el.analyticsSetup.hidden = true;
    el.analyticsContent.hidden = true;
    try {
      const response = await fetch('api/analytics', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(payload.message || `閲覧データを取得できません（${response.status}）`), { setup: response.status === 503 });
      if (!Array.isArray(payload.series)) throw new Error('閲覧データの形式が正しくありません。');
      state.analytics = payload;
      el.analyticsLoading.hidden = true;
      el.analyticsContent.hidden = false;
      renderAnalytics();
    } catch (error) {
      el.analyticsLoading.hidden = true;
      el.analyticsSetup.hidden = false;
      el.analyticsSetupMessage.textContent = error.setup
        ? error.message
        : '公開環境で閲覧データを取得できませんでした。Cloudflareの設定とAPIトークンを確認してください。';
    }
  }

  function normalizeHealth(report) {
    const checks = Array.isArray(report?.checks) ? report.checks : [];
    return {
      generatedAt: report?.generatedAt,
      status: report?.status || (checks.some((item) => item.status === 'error') ? 'error' : checks.some((item) => item.status === 'warning') ? 'warning' : 'ok'),
      checks
    };
  }

  function renderHealth(report) {
    state.health = normalizeHealth(report);
    const labels = { ok: '正常', warning: '要確認', error: 'エラー' };
    el.siteStatusSummary.textContent = labels[state.health.status] || '確認中';
    el.siteStatusSummary.className = `status-text ${state.health.status || 'pending'}`;
    el.siteCheckedAt.textContent = state.health.generatedAt ? `最終チェック ${formatDateTime(state.health.generatedAt)}` : 'チェック日時なし';
    el.healthList.replaceChildren();
    state.health.checks.slice(0, 8).forEach((check) => {
      const item = document.createElement('li');
      item.className = check.status || 'warning';
      const name = document.createElement('span');
      const nameText = document.createElement('strong');
      nameText.textContent = check.label;
      const detail = document.createElement('small');
      const samples = Array.isArray(check.samples) && check.samples.length ? ` / ${check.samples.slice(0, 2).join('、')}` : '';
      detail.textContent = `${check.detail || ''}${samples}`;
      name.append(nameText, detail);
      const status = document.createElement('b');
      status.textContent = labels[check.status] || '要確認';
      item.append(name, status);
      el.healthList.append(item);
    });
    if (!state.health.checks.length) {
      const item = document.createElement('li');
      item.className = 'warning';
      item.textContent = 'チェック結果がありません。';
      el.healthList.append(item);
    }
  }

  async function loadHealthReport() {
    try {
      const response = await fetch('site-check.json', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      renderHealth(await response.json());
    } catch {
      await runLiveHealth(false);
    }
  }

  async function runLiveHealth(showMessage = true) {
    const targets = [
      ['内部リンクの基準ページ', '../'],
      ['RSS', '../feed.xml'],
      ['サイトマップ', '../sitemap.xml'],
      ['観戦メモ一覧', '../watch-notes/'],
      ['巨人の今', '../giants/']
    ];
    const results = await Promise.all(targets.map(async ([label, url]) => {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        return { label, status: response.ok ? 'ok' : 'error', detail: `HTTP ${response.status}` };
      } catch {
        return { label, status: 'error', detail: '取得に失敗' };
      }
    }));
    const robots = document.querySelector('meta[name="robots"]')?.content || '';
    results.push({ label: '管理画面の検索除外', status: robots.includes('noindex') ? 'ok' : 'error', detail: robots || '設定なし' });
    const liveStatus = results.some((item) => item.status === 'error') ? 'error' : 'ok';
    const liveSummary = {
      label: '公開ページの応答',
      status: liveStatus,
      detail: liveStatus === 'ok' ? `${targets.length}ページが応答しました。` : '応答しない公開ページがあります。',
      samples: results.filter((item) => item.status === 'error').map((item) => item.label)
    };
    const checks = showMessage && state.health?.checks?.length
      ? [liveSummary, ...state.health.checks.filter((item) => item.label !== liveSummary.label)]
      : results;
    renderHealth({ generatedAt: new Date().toISOString(), checks });
    if (showMessage) showToast('公開ページの応答を再確認しました。');
  }

  function bindEvents() {
    document.querySelectorAll('.period-button').forEach((button) => {
      button.addEventListener('click', () => {
        state.days = Number(button.dataset.days);
        document.querySelectorAll('.period-button').forEach((item) => {
          const active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        if (state.analytics) renderAnalytics();
      });
    });
    [el.articleSearch, el.articleGroupFilter, el.articleStatusFilter].forEach((control) => {
      control.addEventListener('input', () => { state.page = 1; renderArticleTable(); });
      control.addEventListener('change', () => { state.page = 1; renderArticleTable(); });
    });
    el.refreshButton.addEventListener('click', async () => {
      el.refreshButton.disabled = true;
      await Promise.allSettled([loadArticleData(), loadAnalytics(), loadHealthReport()]);
      renderDrafts();
      el.refreshButton.disabled = false;
      showToast('ダッシュボードを更新しました。');
    });
    el.rerunHealthButton.addEventListener('click', () => runLiveHealth());
  }

  async function init() {
    bindEvents();
    renderDrafts();
    const results = await Promise.allSettled([loadArticleData(), loadAnalytics(), loadHealthReport()]);
    const articleError = results[0].status === 'rejected' ? results[0].reason : null;
    if (articleError) {
      el.pageNotice.hidden = false;
      el.pageNotice.textContent = articleError.message;
    }
  }

  init();
})();
