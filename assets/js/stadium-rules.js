(function () {
  'use strict';

  var stadiumOrder = [
    'giants_tokyo', 'swallows_jingu', 'baystars_yokohama', 'dragons_vantelin', 'tigers_koshien', 'carp_mazda',
    'fighters_escon', 'eagles_miyagi', 'lions_belluna', 'marines_zozo', 'buffaloes_kyocera', 'hawks_paypay'
  ];
  var categoryOrder = [
    'food', 'pet_bottle', 'water_bottle', 'glass_bottle', 'can', 'alcohol', 'umbrella',
    'large_baggage', 'carry_case', 'stroller', 'reentry', 'bag_check', 'cashless'
  ];
  var categoryIcons = {
    food: '🍱', pet_bottle: '🧴', water_bottle: '🥤', glass_bottle: '🍾', can: '🥫', alcohol: '🍺', umbrella: '☂️',
    large_baggage: '🧳', carry_case: '🧳', stroller: '👶', reentry: '↩️', bag_check: '🔍', cashless: '💳'
  };
  var stadiumShortNames = {
    giants_tokyo: '東京ドーム', swallows_jingu: '明治神宮野球場', baystars_yokohama: '横浜スタジアム',
    dragons_vantelin: 'バンテリンドーム ナゴヤ', tigers_koshien: '阪神甲子園球場', carp_mazda: 'マツダスタジアム',
    fighters_escon: 'エスコンフィールド', eagles_miyagi: '楽天モバイル 最強パーク宮城', lions_belluna: 'ベルーナドーム',
    marines_zozo: 'ZOZOマリン', buffaloes_kyocera: '京セラドーム大阪', hawks_paypay: 'みずほPayPayドーム福岡'
  };

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var cell = '';
    var quoted = false;
    var source = String(text || '').replace(/^\uFEFF/, '');
    for (var i = 0; i < source.length; i += 1) {
      var ch = source[i];
      if (ch === '"') {
        if (quoted && source[i + 1] === '"') { cell += '"'; i += 1; }
        else { quoted = !quoted; }
      } else if (ch === ',' && !quoted) {
        row.push(cell); cell = '';
      } else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && source[i + 1] === '\n') i += 1;
        row.push(cell); cell = '';
        if (row.some(function (value) { return value !== ''; })) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    if (rows.length < 2) return [];
    var header = rows[0];
    return rows.slice(1).map(function (values) {
      var item = {};
      header.forEach(function (key, index) { item[key] = values[index] || ''; });
      return item;
    });
  }

  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function statusClass(value) {
    if (value === '可') return 'status-ok';
    if (value === '条件付き') return 'status-conditional';
    if (value === '不可') return 'status-no';
    return 'status-check';
  }

  function makeRuleCard(row, compareMode) {
    var article = makeEl('article', 'rule-card ' + (row['検証状態'] === '更新確認待ち' ? 'is-pending' : ''));
    var head = makeEl('div', 'rule-card-head');
    var labelWrap = makeEl('div', 'rule-card-label');
    labelWrap.appendChild(makeEl('span', 'rule-card-icon', categoryIcons[row.category_id] || '⚾'));
    var titleWrap = makeEl('div');
    titleWrap.appendChild(makeEl('p', 'rule-card-kicker', compareMode ? 'STADIUM' : 'RULE'));
    titleWrap.appendChild(makeEl('h3', '', compareMode ? row['球場名'] : row['カテゴリ名']));
    labelWrap.appendChild(titleWrap);
    head.appendChild(labelWrap);
    head.appendChild(makeEl('span', 'rule-status ' + statusClass(row['判定']), row['判定']));
    article.appendChild(head);

    article.appendChild(makeEl('p', 'rule-summary', row['一言要約']));
    if (row['詳細・条件']) article.appendChild(makeEl('p', 'rule-detail', row['詳細・条件']));

    var meta = makeEl('div', 'rule-meta');
    meta.appendChild(makeEl('span', '', '確認日：' + (row['確認日'] || '未記載')));
    if (row['検証状態'] === '更新確認待ち') {
      meta.appendChild(makeEl('span', 'rule-verification-pending', '公式記載の確認待ち'));
    } else {
      meta.appendChild(makeEl('span', 'rule-verification-ok', '公式情報確認済み'));
    }
    article.appendChild(meta);

    if (row['公式URL']) {
      var link = makeEl('a', 'rule-official-link', '公式ページで最新情報を確認 ↗');
      link.href = row['公式URL'];
      link.target = '_blank';
      link.rel = 'noopener';
      if (row['公式ページ名']) link.setAttribute('aria-label', row['公式ページ名'] + 'を開く');
      article.appendChild(link);
    }
    return article;
  }

  function setQuery(params) {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    url.search = '';
    Object.keys(params).forEach(function (key) { if (params[key]) url.searchParams.set(key, params[key]); });
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }

  function setup(box, rows) {
    var byStadium = {};
    var byCategory = {};
    rows.forEach(function (row) {
      if (!byStadium[row.stadium_id]) byStadium[row.stadium_id] = [];
      if (!byCategory[row.category_id]) byCategory[row.category_id] = [];
      byStadium[row.stadium_id].push(row);
      byCategory[row.category_id].push(row);
    });
    Object.keys(byStadium).forEach(function (key) {
      byStadium[key].sort(function (a, b) { return categoryOrder.indexOf(a.category_id) - categoryOrder.indexOf(b.category_id); });
    });
    Object.keys(byCategory).forEach(function (key) {
      byCategory[key].sort(function (a, b) { return stadiumOrder.indexOf(a.stadium_id) - stadiumOrder.indexOf(b.stadium_id); });
    });

    var tabButtons = Array.prototype.slice.call(box.querySelectorAll('[data-rules-tab]'));
    var panels = Array.prototype.slice.call(box.querySelectorAll('[data-rules-panel]'));
    var stadiumButtons = box.querySelector('[data-stadium-buttons]');
    var categoryButtons = box.querySelector('[data-category-buttons]');
    var stadiumSelection = box.querySelector('[data-stadium-selection]');
    var categorySelection = box.querySelector('[data-category-selection]');
    var stadiumResults = box.querySelector('[data-stadium-results]');
    var categoryResults = box.querySelector('[data-category-results]');

    function activateTab(tab) {
      tabButtons.forEach(function (button) {
        var active = button.getAttribute('data-rules-tab') === tab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-rules-panel') !== tab; });
    }

    function renderStadium(stadiumId, shouldScroll) {
      var selectedRows = byStadium[stadiumId] || [];
      if (!selectedRows.length) return;
      activateTab('stadium');
      stadiumResults.innerHTML = '';
      selectedRows.forEach(function (row) { stadiumResults.appendChild(makeRuleCard(row, false)); });
      box.querySelector('[data-selected-stadium-title]').textContent = selectedRows[0]['球場名'];
      var confirmed = selectedRows.filter(function (row) { return row['検証状態'] === '一次情報確認済'; }).length;
      box.querySelector('[data-selected-stadium-status]').textContent = '13項目中' + confirmed + '項目を公式情報で確認済みです。';
      stadiumSelection.hidden = false;
      stadiumButtons.querySelectorAll('button').forEach(function (button) {
        button.classList.toggle('is-active', button.getAttribute('data-stadium-id') === stadiumId);
      });
      setQuery({ stadium: stadiumId });
      if (shouldScroll) stadiumSelection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderCategory(categoryId, shouldScroll) {
      var selectedRows = byCategory[categoryId] || [];
      if (!selectedRows.length) return;
      activateTab('category');
      categoryResults.innerHTML = '';
      selectedRows.forEach(function (row) { categoryResults.appendChild(makeRuleCard(row, true)); });
      box.querySelector('[data-selected-category-title]').textContent = selectedRows[0]['カテゴリ名'] + 'を12球場で比較';
      var confirmed = selectedRows.filter(function (row) { return row['検証状態'] === '一次情報確認済'; }).length;
      box.querySelector('[data-selected-category-status]').textContent = '12球場中' + confirmed + '球場を公式情報で確認済みです。';
      categorySelection.hidden = false;
      categoryButtons.querySelectorAll('button').forEach(function (button) {
        button.classList.toggle('is-active', button.getAttribute('data-category-id') === categoryId);
      });
      setQuery({ category: categoryId });
      if (shouldScroll) categorySelection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    stadiumOrder.forEach(function (stadiumId) {
      if (!byStadium[stadiumId]) return;
      var button = makeEl('button', 'stadium-choice', '');
      button.type = 'button';
      button.setAttribute('data-stadium-id', stadiumId);
      button.appendChild(makeEl('span', 'stadium-choice-mark', '⚾'));
      button.appendChild(makeEl('strong', '', stadiumShortNames[stadiumId] || byStadium[stadiumId][0]['球場名']));
      button.appendChild(makeEl('small', '', '13項目を確認'));
      button.addEventListener('click', function () { renderStadium(stadiumId, true); });
      stadiumButtons.appendChild(button);
    });

    categoryOrder.forEach(function (categoryId) {
      if (!byCategory[categoryId]) return;
      var name = byCategory[categoryId][0]['カテゴリ名'];
      var button = makeEl('button', 'category-choice', '');
      button.type = 'button';
      button.setAttribute('data-category-id', categoryId);
      button.appendChild(makeEl('span', '', categoryIcons[categoryId] || '⚾'));
      button.appendChild(makeEl('strong', '', name));
      button.addEventListener('click', function () { renderCategory(categoryId, true); });
      categoryButtons.appendChild(button);
    });

    tabButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var tab = button.getAttribute('data-rules-tab') || 'stadium';
        activateTab(tab);
        if (tab === 'stadium') setQuery({});
        else setQuery({});
      });
    });

    var reset = box.querySelector('[data-stadium-reset]');
    if (reset) reset.addEventListener('click', function () {
      stadiumSelection.hidden = true;
      stadiumButtons.querySelectorAll('button').forEach(function (button) { button.classList.remove('is-active'); });
      setQuery({});
      stadiumButtons.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    var params = new URLSearchParams(window.location.search);
    var initialStadium = params.get('stadium');
    var initialCategory = params.get('category');
    if (initialStadium && byStadium[initialStadium]) renderStadium(initialStadium, false);
    else if (initialCategory && byCategory[initialCategory]) renderCategory(initialCategory, false);
    else activateTab('stadium');
  }

  function start() {
    document.querySelectorAll('[data-stadium-rules]').forEach(function (box) {
      var loading = box.querySelector('[data-rules-loading]');
      var error = box.querySelector('[data-rules-error]');
      var csvUrl = box.getAttribute('data-csv');
      fetch(csvUrl, { cache: 'no-store' })
        .then(function (response) { if (!response.ok) throw new Error('CSV fetch failed'); return response.text(); })
        .then(function (text) {
          var rows = parseCsv(text);
          if (rows.length !== 156) throw new Error('Unexpected row count: ' + rows.length);
          if (loading) loading.hidden = true;
          setup(box, rows);
        })
        .catch(function (err) {
          if (loading) loading.hidden = true;
          if (error) error.hidden = false;
          if (window.console) console.error(err);
        });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
