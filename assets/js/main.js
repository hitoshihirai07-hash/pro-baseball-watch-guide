(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "y5b8b6a2x5");

document.documentElement.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.site-footer .footer-grid > div:first-child').forEach(function (footerBlock) {
    if (footerBlock.querySelector('.site-ad-notice')) return;
    var notice = document.createElement('p');
    notice.className = 'site-ad-notice';
    notice.style.fontSize = '.86rem';
    notice.style.margin = '10px 0 0';
    notice.style.color = '#6b5b43';
    notice.textContent = '当サイトではアフィリエイト広告を利用する場合があります。';
    footerBlock.appendChild(notice);
  });
});


document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.site-footer .footer-grid > div:first-child').forEach(function (footerBlock) {
    if (footerBlock.querySelector('.blogmura-ranking')) return;
    var ranking = document.createElement('div');
    ranking.className = 'blogmura-ranking';
    ranking.style.marginTop = '12px';
    ranking.innerHTML = '<a href="https://baseball.blogmura.com/giants/ranking/in?p_cid=11217346" target="_blank" rel="noopener"><img src="https://b.blogmura.com/baseball/giants/88_31.gif" width="88" height="31" border="0" alt="にほんブログ村 野球ブログ 読売ジャイアンツへ" /></a><br /><a href="https://baseball.blogmura.com/giants/ranking/in?p_cid=11217346" target="_blank" rel="noopener">にほんブログ村</a>';
    footerBlock.appendChild(ranking);
  });
});


(function () {
  var articleSearchItems = [];

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); })
      .replace(/[\s　・･ー\-＿_／/｜|（）()［］\[\]「」『』【】.,，、。:：]/g, '');
  }

  function createResultUrl(item) {
    return item && item.path ? item.path : '/articles/';
  }

  function scoreItem(item, rawQuery) {
    var query = normalizeSearchText(rawQuery);
    if (!query) return 0;
    var title = normalizeSearchText(item.listTitle || item.title);
    var category = normalizeSearchText(item.category);
    var description = normalizeSearchText(item.listDescription || item.description);
    var keywords = normalizeSearchText(Array.isArray(item.keywords) ? item.keywords.join(' ') : item.keywords);
    var haystack = title + category + description + keywords;
    if (haystack.indexOf(query) === -1) return 0;
    var score = 1;
    if (title.indexOf(query) !== -1) score += 8;
    if (category.indexOf(query) !== -1) score += 5;
    if (keywords.indexOf(query) !== -1) score += 4;
    if (description.indexOf(query) !== -1) score += 2;
    return score;
  }

  function renderResults(box, query) {
    var status = box.querySelector('[data-article-search-status]');
    var results = box.querySelector('[data-article-search-results]');
    if (!status || !results) return;
    var trimmed = String(query || '').trim();
    results.innerHTML = '';
    if (!trimmed) {
      status.textContent = articleSearchItems.length
        ? 'キーワードを入れると記事候補が表示されます。'
        : '記事データを読み込んでいます。';
      return;
    }
    if (!articleSearchItems.length) {
      status.textContent = '記事データを読み込めませんでした。ページを再読み込みしてください。';
      return;
    }
    var matched = articleSearchItems
      .map(function (item) { return { item: item, score: scoreItem(item, trimmed) }; })
      .filter(function (entry) { return entry.score > 0; })
      .sort(function (a, b) { return b.score - a.score || (b.item.published || '').localeCompare(a.item.published || ''); })
      .slice(0, 8);

    if (!matched.length) {
      status.textContent = '「' + trimmed + '」に近い記事が見つかりませんでした。別の言葉でも試せます。';
      var empty = document.createElement('div');
      empty.className = 'article-search-empty';
      empty.textContent = '例：巨人、直近6試合、打者、投手、バッテリー、球場ルール、配信';
      results.appendChild(empty);
      return;
    }

    status.textContent = '「' + trimmed + '」の候補：' + matched.length + '件表示しています。';
    matched.forEach(function (entry) {
      var item = entry.item;
      var link = document.createElement('a');
      link.className = 'article-search-result';
      link.href = createResultUrl(item);
      link.innerHTML = '<span class="badge"></span><strong></strong><span></span>';
      link.querySelector('.badge').textContent = item.category;
      link.querySelector('strong').textContent = item.listTitle || item.title;
      link.querySelector('span:last-child').textContent = item.listDescription || item.description;
      results.appendChild(link);
    });
  }

  function setupArticleSearch() {
    document.querySelectorAll('[data-article-search]').forEach(function (box) {
      var input = box.querySelector('[data-article-search-input]');
      var clear = box.querySelector('[data-article-search-clear]');
      if (!input || box.getAttribute('data-article-search-ready') === 'true') return;
      box.setAttribute('data-article-search-ready', 'true');
      input.addEventListener('input', function () { renderResults(box, input.value); });
      if (clear) {
        clear.addEventListener('click', function () {
          input.value = '';
          input.focus();
          renderResults(box, '');
        });
      }
      box.querySelectorAll('[data-search-suggestion]').forEach(function (button) {
        button.addEventListener('click', function () {
          input.value = button.getAttribute('data-search-suggestion') || '';
          input.focus();
          renderResults(box, input.value);
        });
      });
      renderResults(box, input.value);
    });
  }

  function loadArticleData() {
    fetch('/data/articles.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('記事データを取得できませんでした。');
        return response.json();
      })
      .then(function (data) {
        articleSearchItems = Array.isArray(data.articles)
          ? data.articles.filter(function (item) { return item.search !== false; })
          : [];
        setupArticleSearch();
        document.querySelectorAll('[data-article-search]').forEach(function (box) {
          var input = box.querySelector('[data-article-search-input]');
          renderResults(box, input ? input.value : '');
        });
      })
      .catch(function () {
        document.querySelectorAll('[data-article-search-status]').forEach(function (status) {
          status.textContent = '記事データを読み込めませんでした。ページを再読み込みしてください。';
        });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArticleData);
  } else {
    loadArticleData();
  }
})();


(function () {
  function setupWatchNoteFilters() {
    document.querySelectorAll('[data-watch-note-section]').forEach(function (section) {
      var filters = section.querySelector('[data-watch-note-filters]');
      var items = Array.prototype.slice.call(section.querySelectorAll('[data-watch-note-item]'));
      var status = section.querySelector('[data-watch-note-status]');
      var empty = section.querySelector('[data-watch-note-empty]');
      if (!filters || !items.length || filters.getAttribute('data-watch-note-ready') === 'true') return;

      filters.setAttribute('data-watch-note-ready', 'true');
      var buttons = Array.prototype.slice.call(filters.querySelectorAll('[data-watch-note-filter-value]'));

      function applyFilter(value, label) {
        var shown = 0;
        items.forEach(function (item) {
          var tags = (item.getAttribute('data-watch-note-tags') || '').split(/\s+/).filter(Boolean);
          var matches = value === 'all' || tags.indexOf(value) !== -1;
          item.hidden = !matches;
          item.setAttribute('aria-hidden', matches ? 'false' : 'true');
          if (matches) shown += 1;
        });

        buttons.forEach(function (button) {
          var active = button.getAttribute('data-watch-note-filter-value') === value;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (empty) empty.hidden = shown !== 0;
        if (status) {
          status.textContent = value === 'all'
            ? 'すべての観戦メモを' + shown + '件表示しています。'
            : label + 'の観戦メモを' + shown + '件表示しています。';
        }
      }

      buttons.forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          applyFilter(button.getAttribute('data-watch-note-filter-value') || 'all', button.textContent.trim());
        });
      });

      applyFilter('all', 'すべて');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWatchNoteFilters);
  } else {
    setupWatchNoteFilters();
  }
})();


/* Broadcast guide CSV renderer */
(function () {
  var teamSlugs = {
    '巨人': 'giants', '阪神': 'hanshin', 'DeNA': 'dena', '広島': 'hiroshima',
    'ヤクルト': 'yakult', '中日': 'chunichi', 'ソフトバンク': 'softbank',
    '日本ハム': 'nippon-ham', 'ロッテ': 'lotte', '西武': 'seibu', '楽天': 'rakuten', 'オリックス': 'orix'
  };

  function parseCsvLine(line) {
    var cells = [];
    var cell = '';
    var quoted = false;
    for (var i = 0; i < line.length; i += 1) {
      var ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; }
        else { quoted = !quoted; }
      } else if (ch === ',' && !quoted) {
        cells.push(cell); cell = '';
      } else { cell += ch; }
    }
    cells.push(cell);
    return cells;
  }

  function parseCsv(text) {
    var lines = text.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n').filter(function (line) { return line.trim() !== ''; });
    if (lines.length < 2) return [];
    var header = parseCsvLine(lines[0]);
    return lines.slice(1).map(function (line) {
      var values = parseCsvLine(line);
      var row = {};
      header.forEach(function (key, index) { row[key] = values[index] || ''; });
      return row;
    });
  }

  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function buildOfficialLink(url) {
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '公式予定を開く';
    return link;
  }

  function renderGuide(box, rows, filter) {
    var shown = rows.filter(function (row) { return filter === 'all' || row['リーグ'] === filter; });
    var tbody = box.querySelector('[data-broadcast-table-body]');
    var cards = box.querySelector('[data-broadcast-card-list]');
    var status = box.querySelector('[data-broadcast-status]');
    if (tbody) tbody.innerHTML = '';
    if (cards) cards.innerHTML = '';
    shown.forEach(function (row) {
      var team = row['主催球団'];
      var tr = document.createElement('tr');
      tr.id = 'team-' + (teamSlugs[team] || team);
      tr.setAttribute('data-broadcast-league', row['リーグ']);
      var teamCell = document.createElement('td');
      teamCell.appendChild(makeEl('strong', 'broadcast-team-name', team));
      teamCell.appendChild(makeEl('span', 'broadcast-league', row['リーグ']));
      tr.appendChild(teamCell);
      tr.appendChild(makeEl('td', '', row['ネット配信（主な入口）']));
      tr.appendChild(makeEl('td', '', row['CS・BS・地域局（主な入口）']));
      var officialCell = document.createElement('td');
      if (row['公式確認URL']) officialCell.appendChild(buildOfficialLink(row['公式確認URL']));
      tr.appendChild(officialCell);
      if (tbody) tbody.appendChild(tr);

      if (cards) {
        var card = makeEl('article', 'broadcast-card');
        var head = makeEl('div', 'broadcast-card-head');
        head.appendChild(makeEl('h3', '', team));
        head.appendChild(makeEl('span', 'broadcast-league', row['リーグ']));
        card.appendChild(head);
        var network = makeEl('p', '');
        network.appendChild(makeEl('strong', '', 'ネット配信'));
        network.appendChild(document.createTextNode(row['ネット配信（主な入口）']));
        card.appendChild(network);
        var tv = makeEl('p', '');
        tv.appendChild(makeEl('strong', '', 'CS・BS・地域局'));
        tv.appendChild(document.createTextNode(row['CS・BS・地域局（主な入口）']));
        card.appendChild(tv);
        var action = makeEl('p', 'broadcast-card-action');
        if (row['公式確認URL']) action.appendChild(buildOfficialLink(row['公式確認URL']));
        card.appendChild(action);
        cards.appendChild(card);
      }
    });
    if (status) {
      var label = filter === 'all' ? '全12球団' : (filter === 'セリーグ' ? 'セ・リーグ' : 'パ・リーグ');
      var date = shown.length && shown[0]['最終確認日'] ? '｜最終確認：' + shown[0]['最終確認日'] : '';
      status.textContent = label + 'を表示しています。' + date;
    }
  }

  function setupBroadcastGuide(box) {
    var staticRows = [];
    box.querySelectorAll('[data-broadcast-table-body] tr').forEach(function (tr) {
      var cells = tr.querySelectorAll('td');
      if (cells.length < 4) return;
      staticRows.push({
        '主催球団': cells[0].querySelector('strong') ? cells[0].querySelector('strong').textContent.trim() : cells[0].textContent.trim(),
        'リーグ': cells[0].querySelector('.broadcast-league') ? cells[0].querySelector('.broadcast-league').textContent.trim() : '',
        'ネット配信（主な入口）': cells[1].textContent.trim(),
        'CS・BS・地域局（主な入口）': cells[2].textContent.trim(),
        '公式確認URL': cells[3].querySelector('a') ? cells[3].querySelector('a').href : ''
      });
    });
    var rows = staticRows;
    var filter = 'all';
    function update() { renderGuide(box, rows, filter); }
    box.querySelectorAll('[data-broadcast-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        filter = button.getAttribute('data-broadcast-filter') || 'all';
        box.querySelectorAll('[data-broadcast-filter]').forEach(function (item) {
          var active = item === button;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        update();
      });
    });
    var csvUrl = box.getAttribute('data-csv');
    if (csvUrl && window.fetch) {
      fetch(csvUrl, { cache: 'no-store' })
        .then(function (response) { if (!response.ok) throw new Error('CSV fetch failed'); return response.text(); })
        .then(function (text) {
          var loaded = parseCsv(text);
          if (loaded.length) { rows = loaded; update(); }
        })
        .catch(function () { update(); });
    } else { update(); }
  }

  function start() {
    document.querySelectorAll('[data-broadcast-guide]').forEach(setupBroadcastGuide);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
