(() => {
  'use strict';

  const STORAGE_KEY = 'baseball-observation-log-records-v1';
  const DRAFT_KEY = 'baseball-observation-log-draft-v1';
  const $ = (selector) => document.querySelector(selector);

  const ARTICLE_TYPES = [
    '1試合の観戦メモ',
    '3連戦・カードの振り返り',
    '選手について感じたこと',
    'チーム・起用・戦い方について感じたこと',
    '期間・シーズンの総括'
  ];

  const ARTICLE_TYPE_MIGRATION = {
    '試合について感じたこと': '1試合の観戦メモ',
    '観戦・球場について感じたこと': '1試合の観戦メモ',
    '期間を見て感じたこと': '期間・シーズンの総括',
    'その他': '1試合の観戦メモ'
  };


  const NEXT_POINT_LABELS = [
    '打順・起用などで注目する点',
    '状態を確認したい選手',
    '登板状況を見たい投手'
  ];

  const TEAM_NAMES = [
    ['読売ジャイアンツ', '巨人'],
    ['巨人', '巨人'],
    ['阪神タイガース', '阪神'],
    ['阪神', '阪神'],
    ['横浜DeNAベイスターズ', 'DeNA'],
    ['DeNA', 'DeNA'],
    ['横浜', 'DeNA'],
    ['広島東洋カープ', '広島'],
    ['広島', '広島'],
    ['東京ヤクルトスワローズ', 'ヤクルト'],
    ['ヤクルト', 'ヤクルト'],
    ['中日ドラゴンズ', '中日'],
    ['中日', '中日'],
    ['福岡ソフトバンクホークス', 'ソフトバンク'],
    ['ソフトバンク', 'ソフトバンク'],
    ['北海道日本ハムファイターズ', '日本ハム'],
    ['日本ハム', '日本ハム'],
    ['千葉ロッテマリーンズ', 'ロッテ'],
    ['ロッテ', 'ロッテ'],
    ['埼玉西武ライオンズ', '西武'],
    ['西武', '西武'],
    ['東北楽天ゴールデンイーグルス', '楽天'],
    ['楽天', '楽天'],
    ['オリックス・バファローズ', 'オリックス'],
    ['オリックス', 'オリックス']
  ];

  const TEAM_SLUGS = {
    '巨人': 'giants',
    '阪神': 'tigers',
    'DeNA': 'baystars',
    '広島': 'carp',
    'ヤクルト': 'swallows',
    '中日': 'dragons',
    'ソフトバンク': 'hawks',
    '日本ハム': 'fighters',
    'ロッテ': 'marines',
    '西武': 'lions',
    '楽天': 'eagles',
    'オリックス': 'buffaloes'
  };

  const TARGET_TEAMS = [
    '巨人', '阪神', 'DeNA', '広島', 'ヤクルト', '中日',
    'ソフトバンク', '日本ハム', 'ロッテ', '西武', '楽天', 'オリックス',
    '複数球団・その他'
  ];

  const el = {
    form: $('#recordForm'),
    gameDate: $('#gameDate'),
    gameTitle: $('#gameTitle'),
    targetTeam: $('#targetTeam'),
    stadium: $('#stadium'),
    articleType: $('#articleType'),
    mainPoint: $('#mainPoint'),
    players: $('#players'),
    goodPoints: $('#goodPoints'),
    concerns: $('#concerns'),
    usageNotes: $('#usageNotes'),
    teamNotes: $('#teamNotes'),
    playerLensChecks: $('#playerLensChecks'),
    newMemo: $('#newMemo'),
    memoList: $('#memoList'),
    memoEmpty: $('#memoEmpty'),
    memoCount: $('#memoCount'),
    avoidContent: $('#avoidContent'),
    articleTone: $('#articleTone'),
    articleLength: $('#articleLength'),
    generatePrompt: $('#generatePromptButton'),
    copySheetRow: $('#copySheetRowButton'),
    outputDialog: $('#outputDialog'),
    articleMetaOutput: $('#articleMetaOutput'),
    titleSuggestionsOutput: $('#titleSuggestionsOutput'),
    outlineOutput: $('#outlineOutput'),
    promptOutput: $('#promptOutput'),
    closeDialog: $('#closeDialogButton'),
    copyArticleKit: $('#copyArticleKitButton'),
    copyPrompt: $('#copyPromptButton'),
    copyMemoTable: $('#copyMemoTableButton'),
    addMemo: $('#addMemoButton'),
    newRecord: $('#newRecordButton'),
    openRecords: $('#openRecordsButton'),
    recordsDialog: $('#recordsDialog'),
    closeRecordsDialog: $('#closeRecordsDialogButton'),
    recordsList: $('#recordsList'),
    exportData: $('#exportDataButton'),
    importData: $('#importDataInput'),
    clearCurrent: $('#clearCurrentButton'),
    saveStatus: $('#saveStatus'),
    nextPoint1: $('#nextPoint1'),
    nextPoint2: $('#nextPoint2'),
    nextPoint3: $('#nextPoint3'),
    publishDate: $('#publishDate'),
    publishSlug: $('#publishSlug'),
    publishTitle: $('#publishTitle'),
    publishDescription: $('#publishDescription'),
    publishListDescription: $('#publishListDescription'),
    publishMarkdown: $('#publishMarkdown'),
    publishApproved: $('#publishApproved'),
    fillPublishFields: $('#fillPublishFieldsButton'),
    downloadPublishFile: $('#downloadPublishFileButton'),
    toast: $('#toast')
  };

  let memos = [];
  let currentRecordId = createId();
  let createdAt = new Date().toISOString();
  let toastTimer = null;
  let saveTimer = null;
  let currentArticleKit = null;

  function createId() {
    return window.crypto && crypto.randomUUID ? crypto.randomUUID() : `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function getTodayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getRecords() {
    const data = safeParse(localStorage.getItem(STORAGE_KEY), []);
    return Array.isArray(data) ? data.filter(isRecordLike) : [];
  }

  function isRecordLike(record) {
    return record && typeof record === 'object' && typeof record.id === 'string';
  }

  function setRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function updateSaveStatus(message = '自動保存済み') {
    if (el.saveStatus) el.saveStatus.textContent = message;
  }

  function getWatchMethods() {
    return [...document.querySelectorAll('input[name="watchMethod"]:checked')].map((input) => input.value);
  }

  function setWatchMethods(values = []) {
    const selected = new Set(Array.isArray(values) ? values : []);
    document.querySelectorAll('input[name="watchMethod"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function formatWatchMethods(methods) {
    if (!methods || methods.length === 0) return '未入力';
    if (methods.length === 1) return methods[0];
    return `複数（${methods.join('・')}）`;
  }

  function normalizeText(value) {
    return String(value || '').replace(/\r\n/g, '\n').trim();
  }

  function oneLine(value) {
    return normalizeText(value).replace(/\n+/g, ' / ').replace(/\t/g, ' ');
  }

  function normalizeArticleType(value) {
    const migrated = ARTICLE_TYPE_MIGRATION[value] || value;
    return ARTICLE_TYPES.includes(migrated) ? migrated : '1試合の観戦メモ';
  }

  function getFieldValues() {
    return {
      targetTeam: normalizeText(el.targetTeam.value) || '巨人',
      stadium: normalizeText(el.stadium.value),
      players: normalizeText(el.players.value),
      goodPoints: normalizeText(el.goodPoints.value),
      concerns: normalizeText(el.concerns.value),
      usageNotes: normalizeText(el.usageNotes.value),
      teamNotes: normalizeText(el.teamNotes.value),
      playerLensChecks: normalizeText(el.playerLensChecks.value),
      nextPoints: [el.nextPoint1, el.nextPoint2, el.nextPoint3].map((input) => normalizeText(input.value)),
      publish: {
        published: el.publishDate.value,
        slug: normalizeText(el.publishSlug.value).toLowerCase(),
        title: normalizeText(el.publishTitle.value),
        description: normalizeText(el.publishDescription.value),
        listDescription: normalizeText(el.publishListDescription.value),
        bodyMarkdown: normalizeText(el.publishMarkdown.value),
        approved: el.publishApproved.checked
      }
    };
  }

  function setFieldValues(data = {}) {
    setInputValue(el.targetTeam, resolveTargetTeam(data), '巨人');
    el.stadium.value = data.stadium || '';
    el.players.value = data.players || '';
    el.goodPoints.value = data.goodPoints || '';
    el.concerns.value = data.concerns || '';
    el.usageNotes.value = data.usageNotes || '';
    el.teamNotes.value = data.teamNotes || '';
    el.playerLensChecks.value = data.playerLensChecks || '';
    const nextPoints = Array.isArray(data.nextPoints) ? data.nextPoints : [];
    el.nextPoint1.value = nextPoints[0] || '';
    el.nextPoint2.value = nextPoints[1] || '';
    el.nextPoint3.value = nextPoints[2] || '';
    const publish = data.publish || {};
    el.publishDate.value = publish.published || data.gameDate || getTodayLocal();
    el.publishSlug.value = publish.slug || '';
    el.publishTitle.value = publish.title || '';
    el.publishDescription.value = publish.description || '';
    el.publishListDescription.value = publish.listDescription || '';
    el.publishMarkdown.value = publish.bodyMarkdown || '';
    el.publishApproved.checked = Boolean(publish.approved);
  }

  function currentData() {
    return {
      id: currentRecordId,
      createdAt,
      updatedAt: new Date().toISOString(),
      gameDate: el.gameDate.value,
      gameTitle: normalizeText(el.gameTitle.value),
      articleType: normalizeArticleType(el.articleType.value),
      watchMethods: getWatchMethods(),
      mainPoint: normalizeText(el.mainPoint.value),
      ...getFieldValues(),
      memos: memos.map((memo) => ({ id: memo.id, text: normalizeText(memo.text) })).filter((memo) => memo.text),
      avoidContent: el.avoidContent.value,
      articleTone: el.articleTone.value,
      articleLength: el.articleLength.value
    };
  }

  function hasMeaningfulContent(data) {
    const fields = ['gameTitle', 'mainPoint', 'stadium', 'players', 'goodPoints', 'concerns', 'usageNotes', 'teamNotes', 'playerLensChecks'];
    return data.memos.length > 0 || (Array.isArray(data.nextPoints) && data.nextPoints.some(Boolean)) || fields.some((field) => Boolean(normalizeText(data[field])));
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCurrent, 160);
  }

  function saveCurrent() {
    const data = currentData();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    updateSaveStatus(hasMeaningfulContent(data) ? '自動保存済み' : '新しい記録');

    if (!hasMeaningfulContent(data)) return;

    const records = getRecords();
    const index = records.findIndex((record) => record.id === data.id);
    if (index >= 0) {
      data.createdAt = records[index].createdAt || data.createdAt;
      records[index] = data;
    } else {
      records.push(data);
    }
    setRecords(records);
  }

  function setInputValue(select, value, fallback) {
    const next = value || fallback;
    const found = [...select.options].some((option) => option.value === next);
    select.value = found ? next : fallback;
  }

  function hydrate(data) {
    currentRecordId = data.id || createId();
    createdAt = data.createdAt || new Date().toISOString();
    el.gameDate.value = data.gameDate || getTodayLocal();
    el.gameTitle.value = data.gameTitle || '';
    el.stadium.value = data.stadium || '';
    setInputValue(el.articleType, normalizeArticleType(data.articleType), '1試合の観戦メモ');
    setWatchMethods(data.watchMethods || []);
    el.mainPoint.value = data.mainPoint || '';
    setFieldValues(data);
    memos = Array.isArray(data.memos)
      ? data.memos.filter((memo) => memo && typeof memo.text === 'string' && memo.text.trim()).map((memo) => ({ id: memo.id || createId(), text: memo.text }))
      : [];
    setInputValue(el.avoidContent, data.avoidContent, 'ネガティブな表現');
    setInputValue(el.articleTone, data.articleTone, '落ち着いた感想');
    setInputValue(el.articleLength, data.articleLength, 'しっかり');
    el.newMemo.value = '';
    currentArticleKit = null;
    renderMemos();
  }

  function newBlankData() {
    return {
      id: createId(),
      createdAt: new Date().toISOString(),
      gameDate: getTodayLocal(),
      gameTitle: '',
      targetTeam: '巨人',
      stadium: '',
      articleType: '1試合の観戦メモ',
      watchMethods: [],
      mainPoint: '',
      players: '',
      goodPoints: '',
      concerns: '',
      usageNotes: '',
      teamNotes: '',
      playerLensChecks: '',
      nextPoints: ['', '', ''],
      publish: {
        published: getTodayLocal(),
        slug: '',
        title: '',
        description: '',
        listDescription: '',
        bodyMarkdown: '',
        approved: false
      },
      memos: [],
      avoidContent: 'ネガティブな表現',
      articleTone: '落ち着いた感想',
      articleLength: 'しっかり'
    };
  }

  function renderMemos() {
    el.memoList.replaceChildren();
    el.memoEmpty.hidden = memos.length > 0;
    el.memoCount.textContent = `${memos.length}件`;

    memos.forEach((memo, index) => {
      const item = document.createElement('li');
      item.className = 'memo-item';
      item.dataset.id = memo.id;

      const number = document.createElement('span');
      number.className = 'memo-number';
      number.textContent = String(index + 1);

      const content = document.createElement('div');
      content.className = 'memo-content';
      content.textContent = memo.text;

      const actions = document.createElement('div');
      actions.className = 'memo-actions';

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'icon-text-button';
      edit.textContent = '編集';
      edit.addEventListener('click', () => startMemoEdit(memo.id));

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-text-button delete';
      remove.textContent = '削除';
      remove.addEventListener('click', () => {
        memos = memos.filter((current) => current.id !== memo.id);
        renderMemos();
        saveCurrent();
      });

      actions.append(edit, remove);
      item.append(number, content, actions);
      el.memoList.append(item);
    });
  }

  function startMemoEdit(memoId) {
    const memo = memos.find((item) => item.id === memoId);
    const item = el.memoList.querySelector(`[data-id="${CSS.escape(memoId)}"]`);
    if (!memo || !item) return;

    item.replaceChildren();
    const number = document.createElement('span');
    number.className = 'memo-number';
    number.textContent = String(memos.findIndex((entry) => entry.id === memoId) + 1);

    const editor = document.createElement('textarea');
    editor.className = 'memo-edit';
    editor.value = memo.text;
    editor.setAttribute('aria-label', 'メモを編集');

    const actions = document.createElement('div');
    actions.className = 'memo-actions';
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'icon-text-button';
    save.textContent = '保存';
    save.addEventListener('click', () => {
      const text = normalizeText(editor.value);
      if (!text) {
        showToast('空のメモは保存できません。');
        editor.focus();
        return;
      }
      memo.text = text;
      renderMemos();
      saveCurrent();
    });
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'icon-text-button';
    cancel.textContent = '戻す';
    cancel.addEventListener('click', renderMemos);
    actions.append(save, cancel);
    item.append(number, editor, actions);
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
  }

  function addMemo() {
    const text = normalizeText(el.newMemo.value);
    if (!text) {
      showToast('メモを入力してから追加してください。');
      el.newMemo.focus();
      return;
    }
    memos.push({ id: createId(), text });
    el.newMemo.value = '';
    renderMemos();
    saveCurrent();
    el.newMemo.focus();
  }

  function listLines(value, emptyText = '') {
    const lines = normalizeText(value).split('\n').map((line) => line.trim()).filter(Boolean);
    return lines.length ? lines.map((line) => `- ${line}`).join('\n') : emptyText;
  }

  function getTeamTags(value) {
    const input = normalizeText(value);
    const result = [];
    TEAM_NAMES.forEach(([name, shortName]) => {
      if (input.includes(name) && !result.includes(shortName)) result.push(shortName);
    });
    return result;
  }

  function resolveTargetTeam(data = {}) {
    const selected = normalizeText(data.targetTeam);
    if (TARGET_TEAMS.includes(selected)) return selected;

    // 旧データには対象球団がないため、従来の「対象の試合・期間」から可能な範囲で引き継ぐ。
    const detected = getTeamTags(data.gameTitle);
    if (detected.includes('巨人')) return '巨人';
    if (detected.length === 1) return detected[0];
    if (detected.length > 1) return '複数球団・その他';

    // 新規作成時の既定は、サイト運用の中心である巨人。
    return '巨人';
  }

  function splitPeople(value) {
    return normalizeText(value)
      .split(/[、,，／/｜|\n]+/)
      .map((entry) => entry.trim().replace(/選手$/u, ''))
      .filter((entry) => entry && entry.length <= 24);
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function articleTypeTag(articleType) {
    const map = {
      '1試合の観戦メモ': '試合観戦',
      '3連戦・カードの振り返り': 'カード振り返り',
      '選手について感じたこと': '選手',
      'チーム・起用・戦い方について感じたこと': 'チーム',
      '期間・シーズンの総括': '期間総括'
    };
    return map[articleType] || '観戦メモ';
  }

  function buildTags(data) {
    const targetTeam = resolveTargetTeam(data);
    const tags = [
      '観戦メモ',
      articleTypeTag(data.articleType),
      targetTeam !== '複数球団・その他' ? targetTeam : '',
      ...getTeamTags(data.gameTitle),
      ...splitPeople(data.players)
    ];
    return unique(tags).slice(0, 6);
  }

  function shorten(value, maxLength = 30) {
    const text = normalizeText(value).replace(/\n+/g, ' ').replace(/[。！？!?].*$/u, '').trim();
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
  }

  function primaryTopic(data) {
    const player = splitPeople(data.players)[0];
    if (player) return player;
    const conclusion = shorten(data.mainPoint, 26);
    if (conclusion) return conclusion;
    const defaults = {
      '1試合の観戦メモ': '試合で印象に残ったこと',
      '3連戦・カードの振り返り': 'カードを通して見えたこと',
      '選手について感じたこと': '気になった選手',
      'チーム・起用・戦い方について感じたこと': '起用とチームの変化',
      '期間・シーズンの総括': '期間を通して印象に残ったこと'
    };
    return defaults[data.articleType] || '観戦メモ';
  }

  function buildTitleSuggestions(data) {
    const game = data.gameTitle || 'プロ野球観戦';
    const topic = primaryTopic(data);
    const templates = {
      '1試合の観戦メモ': [
        `【観戦メモ】${game}で印象に残った${topic}`,
        `${game}を見て感じた${topic}のこと`,
        `${game}の観戦メモ｜${topic}`
      ],
      '3連戦・カードの振り返り': [
        `【カード振り返り】${game}を見て感じたこと`,
        `${game}で印象に残った${topic}`,
        `${game}を通して見えた${topic}`
      ],
      '選手について感じたこと': [
        `${topic}を見て感じたこと｜${game}`,
        `【観戦メモ】${game}で気になった${topic}`,
        `${topic}のプレーから考えたこと`
      ],
      'チーム・起用・戦い方について感じたこと': [
        `【観戦メモ】${game}で見えたチームの変化`,
        `${game}を見て考えた起用とチームのこと`,
        `${topic}から見えた${game}の印象`
      ],
      '期間・シーズンの総括': [
        `【期間総括】${game}を見て感じたこと`,
        `${game}で印象に残った${topic}`,
        `${game}を通して見えた変化と次に見たいこと`
      ]
    };
    return unique((templates[data.articleType] || templates['1試合の観戦メモ']).map((title) => shorten(title, 62)));
  }

  function headingPlan(articleType) {
    const plans = {
      '1試合の観戦メモ': ['この試合で印象に残ったこと', '良かった点と気になった点', '次に見たいこと'],
      '3連戦・カードの振り返り': ['カードを通して見えたこと', '良かった点と気になった点', '次に見たいこと'],
      '選手について感じたこと': ['この選手に注目した理由', '試合で見えたこと', '次に見たいこと'],
      'チーム・起用・戦い方について感じたこと': ['起用とチーム全体を見て感じたこと', '良かった点と気になった点', '次に見たいこと'],
      '期間・シーズンの総括': ['期間を通して印象に残ったこと', '良かった点と気になった点', '次の期間で見たいこと']
    };
    return plans[articleType] || plans['1試合の観戦メモ'];
  }

  function sectionBullets(data, headingIndex) {
    const sources = [
      [data.mainPoint, data.goodPoints],
      [data.concerns, data.usageNotes, data.teamNotes],
      [data.playerLensChecks]
    ];
    const entries = sources[headingIndex] || [];
    const joined = entries.filter(Boolean).map((value) => listLines(value)).filter(Boolean).join('\n');
    return joined || '- （本文で扱う内容をここに整理）';
  }

  function buildOutline(data, titles, tags) {
    const title = titles[0] || `${data.gameTitle}の観戦メモ`;
    const headings = headingPlan(data.articleType);
    const facts = [
      `- 日付：${data.gameDate || '（確認）'}`,
      `- 対象：${data.gameTitle || '（確認）'}`,
      data.stadium ? `- 球場：${data.stadium}` : '',
      data.watchMethods?.length ? `- 観戦方法：${formatWatchMethods(data.watchMethods)}` : ''
    ].filter(Boolean).join('\n');

    const nextPoints = data.nextPoints
      .map((point, index) => `${index + 1}. **${NEXT_POINT_LABELS[index]}**：${point || '（入力）'}`)
      .join('\n');

    return `---
title: "${title.replace(/"/g, '＂')}"
date: "${data.gameDate || ''}"
category: "観戦メモ"
tags: [${tags.map((tag) => `"${tag}"`).join(', ')}]
---

# ${title}

## 試合・期間のメモ
${facts}

## ${headings[0]}
${sectionBullets(data, 0)}

## ${headings[1]}
${sectionBullets(data, 1)}

## 次カードで見たい3つ
${nextPoints}`;
  }

  function buildMemoText(data) {
    return data.memos.length
      ? data.memos.map((memo) => `- ${memo.text.replace(/\n/g, '\n  ')}`).join('\n')
      : '- （自由メモ未入力）';
  }

  function buildStructuredInput(data) {
    const rows = [
      ['記事の結論・一番伝えたいこと', data.mainPoint],
      ['気になった選手', data.players],
      ['良かった点', data.goodPoints],
      ['気になった点', data.concerns],
      ['起用・継投・打順について', data.usageNotes],
      ['チーム全体について', data.teamNotes],
      ['Player Lensで確認したいデータ', data.playerLensChecks]
    ];
    return rows
      .filter(([, value]) => normalizeText(value))
      .map(([label, value]) => `【${label}】\n${listLines(value)}`)
      .join('\n\n') || '（構造化メモは未入力）';
  }

  function buildPrompt(data, articleKit) {
    const memoText = buildMemoText(data);
    const tagsText = articleKit.tags.length ? articleKit.tags.join('、') : '観戦メモ';

    return `観戦メモの記事原稿を作成してください。
以下の内容をもとに、ブログ掲載前の Markdown 原稿を作成してください。

【記事の種類】
${data.articleType}

【対象の試合・期間】
${data.gameTitle || '（未入力）'}

【日付・球場・観戦方法】
- 日付：${data.gameDate || '（未入力）'}
- 対象球団：${resolveTargetTeam(data)}
- 球場：${data.stadium || '（未入力）'}
- 観戦方法：${formatWatchMethods(data.watchMethods)}

【カテゴリー】
観戦メモ

【候補タグ】
${tagsText}

【タイトル案の土台】
1. ${articleKit.titles[0]}
2. ${articleKit.titles[1]}
3. ${articleKit.titles[2]}

【記事に残したい内容】
${buildStructuredInput(data)}

【自由メモ（記事の主観・方向性の材料）】
${memoText}

【次カードで見たい3つ】
1. ${NEXT_POINT_LABELS[0]}：${data.nextPoints[0] || '（未入力）'}
2. ${NEXT_POINT_LABELS[1]}：${data.nextPoints[1] || '（未入力）'}
3. ${NEXT_POINT_LABELS[2]}：${data.nextPoints[2] || '（未入力）'}

【Markdown原稿の骨組み】
${articleKit.outline}

【入れたくない内容・避けたい表現】
- ${data.avoidContent}

【記事の雰囲気】
${data.articleTone}

【記事の長さ】
${data.articleLength}

【原稿作成時の条件】
- 入力欄と自由メモは、ユーザーが実際に感じたこと・記事に残したい方向性として扱う。ユーザーが書いていない主観的な評価、選手の心理、首脳陣の意図などは勝手に作らない。
- 原稿を書く前に、対象の試合・期間についてNPB公式、球団公式などの一次情報を必ず確認する。試合結果だけでなく、入力内容に関係する打席結果（安打・四球・本塁打・三振など）、投球内容、出場・登録・抹消なども必要に応じて調べる。
- 入力が「期待できた」「状態が気になる」「降格が心配」など短い感想だけの場合でも、その感想に直接関係する試合内容を公式情報で確認し、確認できた客観的事実を使って「なぜそう感じたのか」が読者に伝わる観戦メモにする。
- 入力欄に明記されていない事実でも、対象試合・期間の公式情報で確認でき、入力された感想を自然に説明するために直接必要な事実は補足してよい。ただし、そこから別の評価や背景を推測して付け足さない。
- 速報や試合途中の数字ではなく、原則として試合終了後の最終記録・最新の公示を確認する。
- 入力内容と公式情報が食い違う、または記事の核になる事実を確認できない場合は、黙って削除したり勝手に直したりせず、原稿作成前に「公式情報では○○と確認できました。○○として反映してよいですか？」のように具体的に確認する。
- 制作上のルールを本文に書かない。「メモに書かれていないため」「推測はせず」「入力された範囲では」など、読者に不要な制作過程の説明は記事本文へ入れない。
- 推測、移籍の噂、人格批判、断定的な批判は入れない。
- 「現地で見た」は、観戦方法に「現地」と書かれている場合だけ使う。
- 本文は、この試合・この期間を見た観戦メモとして自然に読める文章にする。
- 最初にタイトル案を3つ提示し、その後に最も合う1案を使ったMarkdown原稿を完成させる。
- 見出しはMarkdown原稿の骨組みを基本にし、入力がない項目は無理に膨らませない。
- 記事末に「次カードで見たい3つ」の見出しを設け、「${NEXT_POINT_LABELS[0]}」「${NEXT_POINT_LABELS[1]}」「${NEXT_POINT_LABELS[2]}」の項目名と入力内容をセットで掲載する。
- 原稿末には、確認した主な事実と公式情報を短くまとめる。未確認のまま「事実確認が必要」とだけ書いて終わらせない。`;
  }

  function buildArticleKit(data = currentData()) {
    const titles = buildTitleSuggestions(data);
    const tags = buildTags(data);
    const outline = buildOutline(data, titles, tags);
    const articleKit = {
      category: '観戦メモ',
      tags,
      titles,
      outline: '',
      prompt: ''
    };
    articleKit.outline = outline;
    articleKit.prompt = buildPrompt(data, articleKit);
    return articleKit;
  }

  function validateForArticleKit() {
    if (!normalizeText(el.gameTitle.value)) {
      showToast('「対象の試合・期間」を入力してください。');
      el.gameTitle.focus();
      return false;
    }
    const data = currentData();
    const hasMaterial = data.memos.length > 0 || [data.mainPoint, data.players, data.goodPoints, data.concerns, data.usageNotes, data.teamNotes].some((value) => normalizeText(value));
    if (!hasMaterial) {
      showToast('記事に残したいこと、または自由メモを1件以上入力してください。');
      el.mainPoint.focus();
      return false;
    }
    const missingNextPoint = [el.nextPoint1, el.nextPoint2, el.nextPoint3].find((input) => !normalizeText(input.value));
    if (missingNextPoint) {
      showToast('「次カードで見たい3つ」をすべて入力してください。');
      missingNextPoint.focus();
      return false;
    }
    return true;
  }

  function renderArticleKit(articleKit) {
    el.articleMetaOutput.replaceChildren();
    const category = document.createElement('span');
    category.className = 'meta-chip category';
    category.textContent = `カテゴリー：${articleKit.category}`;
    el.articleMetaOutput.append(category);

    articleKit.tags.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'meta-chip';
      chip.textContent = `#${tag}`;
      el.articleMetaOutput.append(chip);
    });

    el.titleSuggestionsOutput.replaceChildren();
    articleKit.titles.forEach((title) => {
      const item = document.createElement('li');
      item.textContent = title;
      el.titleSuggestionsOutput.append(item);
    });

    el.outlineOutput.value = articleKit.outline;
    el.promptOutput.value = articleKit.prompt;
  }

  function showArticleKit() {
    if (!validateForArticleKit()) return;
    saveCurrent();
    currentArticleKit = buildArticleKit();
    renderArticleKit(currentArticleKit);
    el.outputDialog.showModal();
    setTimeout(() => el.promptOutput.focus(), 50);
  }

  function buildArticleKitText() {
    if (!currentArticleKit) currentArticleKit = buildArticleKit();
    return `【カテゴリー】\n${currentArticleKit.category}\n\n【候補タグ】\n${currentArticleKit.tags.map((tag) => `#${tag}`).join(' ')}\n\n【タイトル案】\n${currentArticleKit.titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}\n\n【Markdown原稿の骨組み】\n${el.outlineOutput.value || currentArticleKit.outline}\n\n【記事用プロンプト】\n${el.promptOutput.value || currentArticleKit.prompt}`;
  }

  async function copyText(text, successMessage) {
    if (!text) {
      showToast('コピーする内容がありません。');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      const temporary = document.createElement('textarea');
      temporary.value = text;
      temporary.style.position = 'fixed';
      temporary.style.opacity = '0';
      document.body.append(temporary);
      temporary.select();
      document.execCommand('copy');
      temporary.remove();
      showToast(successMessage);
    }
  }

  function buildSheetRow(data = currentData()) {
    const headers = [
      '日付', '対象の試合・期間', '対象球団', '球場', '観戦方法', '記事の種類', '記事の結論',
      '気になった選手', '良かった点', '気になった点', '起用・継投・打順',
      'チーム全体', 'Player Lensで確認したいデータ', '自由メモ', '候補タグ',
      '避けたい表現', '記事の雰囲気', '記事の長さ'
    ];
    const row = [
      data.gameDate || '',
      oneLine(data.gameTitle),
      resolveTargetTeam(data),
      oneLine(data.stadium),
      formatWatchMethods(data.watchMethods),
      data.articleType,
      oneLine(data.mainPoint),
      oneLine(data.players),
      oneLine(data.goodPoints),
      oneLine(data.concerns),
      oneLine(data.usageNotes),
      oneLine(data.teamNotes),
      oneLine(data.playerLensChecks),
      data.memos.map((memo) => oneLine(memo.text)).join(' ／ '),
      buildTags(data).join('／'),
      data.avoidContent,
      data.articleTone,
      data.articleLength
    ];
    return `${headers.join('\t')}\n${row.join('\t')}`;
  }

  function buildMemoTable(data = currentData()) {
    const headers = ['日付', '対象の試合・期間', '対象球団', '球場', '観戦方法', '記事の種類', 'メモ番号', '自由メモ'];
    const rows = data.memos.length
      ? data.memos.map((memo, index) => [
          data.gameDate || '',
          oneLine(data.gameTitle),
          resolveTargetTeam(data),
          oneLine(data.stadium),
          formatWatchMethods(data.watchMethods),
          data.articleType,
          index + 1,
          oneLine(memo.text)
        ])
      : [[data.gameDate || '', oneLine(data.gameTitle), resolveTargetTeam(data), oneLine(data.stadium), formatWatchMethods(data.watchMethods), data.articleType, '', '']];
    return `${headers.join('\t')}\n${rows.map((row) => row.join('\t')).join('\n')}`;
  }

  function buildFilterTags(data) {
    const filterTags = [];
    if (resolveTargetTeam(data) === '巨人') filterTags.push('giants');
    else filterTags.push('other');
    if (data.articleType === '3連戦・カードの振り返り') filterTags.push('series');
    if (data.articleType === '期間・シーズンの総括') filterTags.push('season-review');
    if (data.players || data.usageNotes || data.articleType.includes('選手') || data.articleType.includes('起用')) {
      filterTags.push('player-usage');
    }
    return unique(filterTags);
  }

  function buildBadges(data) {
    const labels = {
      giants: '巨人戦',
      other: '他球団',
      series: '3連戦',
      'player-usage': '選手・起用',
      'season-review': '期間・総括'
    };
    return buildFilterTags(data).map((tag) => labels[tag]).filter(Boolean);
  }

  function buildAutoSlug(data) {
    const detectedTeams = getTeamTags(data.gameTitle);
    const targetTeam = resolveTargetTeam(data);
    const slugTeams = detectedTeams.length ? detectedTeams : (TEAM_SLUGS[targetTeam] ? [targetTeam] : []);
    const teamSlugs = slugTeams.map((team) => TEAM_SLUGS[team]).filter(Boolean);
    const teams = unique(teamSlugs).slice(0, 2);
    const prefix = teams.length ? teams.join('-') : 'watch-note';
    return `${prefix}-${data.gameDate || getTodayLocal()}`;
  }

  function articleBadge(articleType) {
    const labels = {
      '1試合の観戦メモ': '1試合についての観戦メモ',
      '3連戦・カードの振り返り': '3連戦についての観戦メモ',
      '選手について感じたこと': '選手についての観戦メモ',
      'チーム・起用・戦い方について感じたこと': 'チーム・起用についての観戦メモ',
      '期間・シーズンの総括': '期間・シーズンについての観戦メモ'
    };
    return labels[articleType] || 'プロ野球観戦メモ';
  }

  function fillPublishFields() {
    const data = currentData();
    const kit = currentArticleKit || buildArticleKit(data);
    if (!el.publishDate.value) el.publishDate.value = data.gameDate || getTodayLocal();
    if (!el.publishSlug.value) el.publishSlug.value = buildAutoSlug(data);
    if (!el.publishTitle.value) el.publishTitle.value = kit.titles[0] || '';
    if (!el.publishDescription.value && data.mainPoint) el.publishDescription.value = data.mainPoint;
    if (!el.publishListDescription.value && data.mainPoint) el.publishListDescription.value = shorten(data.mainPoint, 90);
    el.publishApproved.checked = false;
    saveCurrent();
    showToast('基本情報を引き継ぎました。説明と完成本文を確認してください。');
  }

  function validatePublishData(data) {
    const publish = data.publish;
    const required = [
      [publish.published, el.publishDate, '公開日'],
      [publish.slug, el.publishSlug, 'URL末尾'],
      [publish.title, el.publishTitle, '決定タイトル'],
      [publish.description, el.publishDescription, '検索・SNS用の説明'],
      [publish.listDescription, el.publishListDescription, '一覧用の短い説明'],
      [publish.bodyMarkdown, el.publishMarkdown, '完成したMarkdown本文']
    ];
    const missing = required.find(([value]) => !normalizeText(value));
    if (missing) {
      showToast(`${missing[2]}を入力してください。`);
      missing[1].focus();
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(publish.published)) {
      showToast('公開日を正しい形式で入力してください。');
      el.publishDate.focus();
      return false;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publish.slug)) {
      showToast('URL末尾は半角英数字とハイフンだけで入力してください。');
      el.publishSlug.focus();
      return false;
    }
    const missingNext = data.nextPoints.findIndex((point) => !normalizeText(point));
    if (missingNext >= 0) {
      showToast('「次カードで見たい3つ」をすべて入力してください。');
      [el.nextPoint1, el.nextPoint2, el.nextPoint3][missingNext].focus();
      return false;
    }
    if (!publish.approved) {
      showToast('公開内容を確認し、確認欄にチェックを入れてください。');
      el.publishApproved.focus();
      return false;
    }
    return true;
  }

  function downloadPublishFile() {
    const data = currentData();
    if (!validatePublishData(data)) return;
    const payload = {
      schemaVersion: 1,
      type: 'watch-note',
      title: data.publish.title,
      slug: data.publish.slug,
      description: data.publish.description,
      listDescription: data.publish.listDescription,
      published: data.publish.published,
      updated: data.publish.published,
      gameLabel: data.gameTitle,
      targetTeam: resolveTargetTeam(data),
      articleType: data.articleType,
      articleBadge: articleBadge(data.articleType),
      lead: data.publish.description,
      bodyMarkdown: data.publish.bodyMarkdown,
      nextPoints: data.nextPoints,
      nextPointLabels: [...NEXT_POINT_LABELS],
      keywords: unique(buildTags(data)),
      tags: buildFilterTags(data),
      badges: buildBadges(data)
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payload.slug}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    saveCurrent();
    showToast('公開用JSONをダウンロードしました。');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('show');
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2200);
  }

  function openRecords() {
    renderRecords();
    el.recordsDialog.showModal();
  }

  function renderRecords() {
    const records = getRecords().sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
    el.recordsList.replaceChildren();
    if (!records.length) {
      const paragraph = document.createElement('p');
      paragraph.className = 'record-empty';
      paragraph.textContent = '保存した記録はまだありません。';
      el.recordsList.append(paragraph);
      return;
    }

    records.forEach((record) => {
      const item = document.createElement('article');
      item.className = 'record-item';
      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = record.gameTitle || '名称未入力の記録';
      const meta = document.createElement('p');
      meta.className = 'record-meta';
      const parts = [
        record.gameDate || '日付未入力',
        normalizeArticleType(record.articleType),
        `${Array.isArray(record.memos) ? record.memos.length : 0}件のメモ`
      ].filter(Boolean);
      meta.textContent = parts.join(' ・ ');
      info.append(title, meta);

      const actions = document.createElement('div');
      actions.className = 'record-item-actions';
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'button button-secondary';
      load.textContent = '開く';
      load.addEventListener('click', () => {
        hydrate(record);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(currentData()));
        el.recordsDialog.close();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('記録を開きました。');
      });
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button button-secondary';
      remove.textContent = '削除';
      remove.addEventListener('click', () => {
        const name = record.gameTitle || 'この記録';
        if (!window.confirm(`「${name}」を削除しますか？`)) return;
        const nextRecords = getRecords().filter((entry) => entry.id !== record.id);
        setRecords(nextRecords);
        if (record.id === currentRecordId) {
          localStorage.removeItem(DRAFT_KEY);
          hydrate(newBlankData());
        }
        renderRecords();
        showToast('記録を削除しました。');
      });
      actions.append(load, remove);
      item.append(info, actions);
      el.recordsList.append(item);
    });
  }

  function createNewRecord() {
    const data = currentData();
    if (hasMeaningfulContent(data) && !window.confirm('今の記録は端末内に保存されたままです。新しい記録を作りますか？')) return;
    hydrate(newBlankData());
    localStorage.setItem(DRAFT_KEY, JSON.stringify(currentData()));
    updateSaveStatus('新しい記録');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('新しい記録を作成しました。');
  }

  function clearCurrentRecord() {
    const data = currentData();
    if (!hasMeaningfulContent(data)) {
      hydrate(newBlankData());
      return;
    }
    if (!window.confirm('今開いている記録を削除しますか？')) return;
    setRecords(getRecords().filter((record) => record.id !== currentRecordId));
    localStorage.removeItem(DRAFT_KEY);
    hydrate(newBlankData());
    showToast('今の記録を削除しました。');
  }

  function exportRecords() {
    const payload = {
      app: '観戦メモ',
      version: 2,
      exportedAt: new Date().toISOString(),
      records: getRecords()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = getTodayLocal().replaceAll('-', '');
    anchor.href = url;
    anchor.download = `kansen-log-backup-${date}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('全記録を書き出しました。');
  }

  function importRecords(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const payload = safeParse(reader.result, null);
      const imported = Array.isArray(payload) ? payload : payload?.records;
      if (!Array.isArray(imported)) {
        showToast('読み込める記録ファイルではありません。');
        return;
      }
      const valid = imported.filter(isRecordLike).map((record) => ({
        ...newBlankData(),
        ...record,
        id: record.id || createId(),
        articleType: normalizeArticleType(record.articleType),
        memos: Array.isArray(record.memos) ? record.memos.filter((memo) => memo && typeof memo.text === 'string') : []
      }));
      const map = new Map(getRecords().map((record) => [record.id, record]));
      valid.forEach((record) => map.set(record.id, record));
      setRecords([...map.values()]);
      showToast(`${valid.length}件の記録を読み込みました。`);
      if (el.recordsDialog.open) renderRecords();
    };
    reader.onerror = () => showToast('ファイルを読み込めませんでした。');
    reader.readAsText(file, 'utf-8');
  }

  function bindEvents() {
    el.form.addEventListener('input', scheduleSave);
    el.form.addEventListener('change', scheduleSave);
    el.addMemo.addEventListener('click', addMemo);
    el.newMemo.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        addMemo();
      }
    });
    el.generatePrompt.addEventListener('click', showArticleKit);
    el.closeDialog.addEventListener('click', () => el.outputDialog.close());
    el.copyArticleKit.addEventListener('click', () => copyText(buildArticleKitText(), '記事化セットをコピーしました。'));
    el.copyPrompt.addEventListener('click', () => copyText(el.promptOutput.value, '記事用プロンプトをコピーしました。'));
    el.copySheetRow.addEventListener('click', () => copyText(buildSheetRow(), 'スプレッドシート用の表をコピーしました。'));
    el.copyMemoTable.addEventListener('click', () => copyText(buildMemoTable(), 'メモ一覧を表でコピーしました。'));
    el.newRecord.addEventListener('click', createNewRecord);
    el.openRecords.addEventListener('click', openRecords);
    el.closeRecordsDialog.addEventListener('click', () => el.recordsDialog.close());
    el.exportData.addEventListener('click', exportRecords);
    el.importData.addEventListener('change', (event) => {
      importRecords(event.target.files?.[0]);
      event.target.value = '';
    });
    el.clearCurrent.addEventListener('click', clearCurrentRecord);
    [
      el.nextPoint1, el.nextPoint2, el.nextPoint3, el.publishDate, el.publishSlug,
      el.publishTitle, el.publishDescription, el.publishListDescription, el.publishMarkdown,
      el.publishApproved
    ].forEach((input) => {
      input.addEventListener('input', scheduleSave);
      input.addEventListener('change', scheduleSave);
    });
    el.fillPublishFields.addEventListener('click', fillPublishFields);
    el.downloadPublishFile.addEventListener('click', downloadPublishFile);
  }

  function init() {
    const draft = safeParse(localStorage.getItem(DRAFT_KEY), null);
    hydrate(isRecordLike(draft) ? draft : newBlankData());
    updateSaveStatus(isRecordLike(draft) && hasMeaningfulContent(draft) ? '自動保存済み' : '新しい記録');
    bindEvents();
    if (new URLSearchParams(window.location.search).get('records') === '1') {
      window.setTimeout(openRecords, 0);
    }
  }

  init();
})();
