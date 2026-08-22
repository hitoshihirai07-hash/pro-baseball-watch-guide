(function () {
  "use strict";

  if (window.__pbwgPlayerLensWatchNoteBridgeLoaded) return;
  window.__pbwgPlayerLensWatchNoteBridgeLoaded = true;

  const TEAM_INFO = {
    "巨人": { slug: "giants", aliases: ["巨人", "読売", "読売ジャイアンツ", "ジャイアンツ"] },
    "阪神": { slug: "tigers", aliases: ["阪神", "阪神タイガース", "タイガース"] },
    "DeNA": { slug: "baystars", aliases: ["DeNA", "横浜DeNA", "横浜DeNAベイスターズ", "ベイスターズ", "横浜"] },
    "広島": { slug: "carp", aliases: ["広島", "広島東洋", "広島東洋カープ", "広島カープ", "カープ"] },
    "ヤクルト": { slug: "swallows", aliases: ["ヤクルト", "東京ヤクルト", "東京ヤクルトスワローズ", "スワローズ"] },
    "中日": { slug: "dragons", aliases: ["中日", "中日ドラゴンズ", "ドラゴンズ"] },
    "オリックス": { slug: "buffaloes", aliases: ["オリックス", "オリックス・バファローズ", "オリックスバファローズ", "バファローズ"] },
    "ソフトバンク": { slug: "hawks", aliases: ["ソフトバンク", "福岡ソフトバンク", "福岡ソフトバンクホークス", "ホークス"] },
    "ロッテ": { slug: "marines", aliases: ["ロッテ", "千葉ロッテ", "千葉ロッテマリーンズ", "マリーンズ"] },
    "楽天": { slug: "eagles", aliases: ["楽天", "東北楽天", "東北楽天ゴールデンイーグルス", "楽天イーグルス", "イーグルス"] },
    "西武": { slug: "lions", aliases: ["西武", "埼玉西武", "埼玉西武ライオンズ", "ライオンズ"] },
    "日本ハム": { slug: "fighters", aliases: ["日本ハム", "北海道日本ハム", "北海道日本ハムファイターズ", "日ハム", "ファイターズ"] },
  };

  const ALIAS_TO_TEAM = new Map();
  const SLUG_TO_TEAM = new Map();
  Object.entries(TEAM_INFO).forEach(([team, info]) => {
    SLUG_TO_TEAM.set(info.slug, team);
    info.aliases.forEach((alias) => ALIAS_TO_TEAM.set(normalize(alias), team));
  });

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[\s\u3000・･?？!！。、，,.…「」『』()（）【】\[\]<>:：\-ー]/g, "");
  }

  function normalizePath(value) {
    const path = String(value || "").replace(/\.html$/i, "").replace(/\/$/, "");
    return path || "/";
  }

  function shortTeam(value) {
    const normalized = normalize(value);
    if (!normalized) return "";
    if (ALIAS_TO_TEAM.has(normalized)) return ALIAS_TO_TEAM.get(normalized);
    for (const [alias, team] of ALIAS_TO_TEAM.entries()) {
      if (normalized === alias) return team;
    }
    return "";
  }

  function fullTeamName(team) {
    return TEAM_INFO[team]?.aliases.find((alias) => alias.length >= 6) || team;
  }

  function teamFromEntry(entry) {
    const explicit = shortTeam(entry?.targetTeam || "");
    if (explicit) return explicit;
    for (const keyword of entry?.keywords || []) {
      const detected = shortTeam(keyword);
      if (detected) return detected;
    }
    return "";
  }

  function articleTeamMatches(entry, team) {
    if (!team) return false;
    if (teamFromEntry(entry) === team) return true;
    const info = TEAM_INFO[team];
    const haystack = normalize([
      entry?.title,
      entry?.description,
      entry?.listDescription,
      ...(entry?.keywords || []),
    ].filter(Boolean).join(" "));
    return info?.aliases.some((alias) => haystack.includes(normalize(alias))) || false;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function loadArticles() {
    const response = await fetchWithTimeout("/data/articles.json", { cache: "no-store" });
    const data = await response.json();
    return Array.isArray(data?.articles) ? data.articles.filter((item) => item?.type === "watch-note") : [];
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = String(text || "").replace(/^\uFEFF/, "");

    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      const next = source[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }

    const headers = rows.shift() || [];
    return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }

  async function loadPlayerMaster() {
    const response = await fetchWithTimeout("/player-lens/data/current_player_master.csv", { cache: "default" });
    return parseCsv(await response.text()).map((row) => ({
      name: String(row["投手"] || row["選手名"] || "").normalize("NFKC").trim().replace(/\s+/g, " "),
      team: shortTeam(row["球団名"] || row["チーム"] || ""),
      position: row["ポジション"] || "",
    })).filter((row) => row.name && row.team);
  }

  function playerType(player) {
    return player.position === "投手" ? "pitcher" : "batter";
  }

  function playerUrl(player) {
    const params = new URLSearchParams({ type: playerType(player), team: player.team, name: player.name });
    return `/player-lens/player?${params.toString()}`;
  }

  function teamUrl(team) {
    const slug = TEAM_INFO[team]?.slug;
    return slug ? `/player-lens/teams/${slug}` : `/player-lens/team?team=${encodeURIComponent(team)}`;
  }

  function uniqueSurname(players, player) {
    const surname = String(player.name).split(/\s+/)[0] || "";
    if (!surname) return false;
    const key = normalize(surname);
    return players.filter((item) => item.team === player.team && normalize(String(item.name).split(/\s+/)[0]) === key).length === 1;
  }

  function scorePlayerForArticle(player, entry, pool) {
    const full = normalize(player.name);
    const surname = normalize(String(player.name).split(/\s+/)[0] || "");
    const keywords = (entry?.keywords || []).map(normalize);
    const nextPoints = (entry?.nextPoints || []).map(normalize);
    const title = normalize(entry?.title || "");
    const descriptions = normalize(`${entry?.description || ""} ${entry?.listDescription || ""}`);
    let score = 0;

    if (keywords.includes(full)) score += 120;
    if (title.includes(full)) score += 100;
    if (descriptions.includes(full)) score += 80;
    if (nextPoints.some((value) => value.includes(full))) score += 60;

    if (surname && uniqueSurname(pool, player)) {
      if (keywords.includes(surname)) score += 80;
      if (nextPoints.some((value) => value === surname || value.includes(surname))) score += 50;
    }

    if (score > 0 && articleTeamMatches(entry, player.team)) score += 10;
    return score;
  }

  function scoreArticleForPlayer(entry, name, team) {
    const full = normalize(name);
    const surname = normalize(String(name || "").normalize("NFKC").trim().split(/\s+/)[0] || "");
    const keywords = (entry?.keywords || []).map(normalize);
    const nextPoints = (entry?.nextPoints || []).map(normalize);
    const title = normalize(entry?.title || "");
    const descriptions = normalize(`${entry?.description || ""} ${entry?.listDescription || ""}`);
    let score = 0;

    if (keywords.includes(full)) score += 130;
    if (title.includes(full)) score += 110;
    if (descriptions.includes(full)) score += 90;
    if (nextPoints.some((value) => value.includes(full))) score += 60;
    if (surname) {
      if (keywords.includes(surname)) score += 70;
      if (nextPoints.some((value) => value === surname || value.includes(surname))) score += 40;
    }
    if (score > 0 && team && articleTeamMatches(entry, team)) score += 20;
    return score;
  }

  function articleDate(entry) {
    return String(entry?.updated || entry?.published || "");
  }

  function relatedArticlesForPlayer(articles, name, team) {
    return articles
      .map((entry) => ({ entry, score: scoreArticleForPlayer(entry, name, team) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || articleDate(b.entry).localeCompare(articleDate(a.entry)))
      .slice(0, 4)
      .map((item) => item.entry);
  }

  function relatedArticlesForTeam(articles, team) {
    return articles
      .map((entry) => ({
        entry,
        score: teamFromEntry(entry) === team ? 100 : articleTeamMatches(entry, team) ? 50 : 0,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || articleDate(b.entry).localeCompare(articleDate(a.entry)))
      .slice(0, 4)
      .map((item) => item.entry);
  }

  function createPlayerLensRelatedSection(items, heading, lead) {
    const section = document.createElement("section");
    section.className = "content-card";
    section.dataset.pbwgWatchNotesRelated = "true";

    const headingWrap = document.createElement("div");
    headingWrap.className = "section-heading";
    const titleWrap = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Watch Notes";
    const h2 = document.createElement("h2");
    h2.textContent = heading;
    titleWrap.append(eyebrow, h2);
    const allLink = document.createElement("a");
    allLink.href = "/watch-notes/";
    allLink.textContent = "観戦メモ一覧";
    headingWrap.append(titleWrap, allLink);

    const description = document.createElement("p");
    description.className = "small-note";
    description.textContent = lead;

    const grid = document.createElement("div");
    grid.className = "resource-grid";
    items.forEach((entry) => {
      const link = document.createElement("a");
      link.href = entry.path;
      const title = document.createElement("strong");
      title.textContent = entry.listTitle || entry.title || "観戦メモ";
      const meta = document.createElement("small");
      const date = entry.published || entry.updated || "";
      meta.textContent = [date, entry.listDescription || ""].filter(Boolean).join(" / ");
      link.append(title, meta);
      grid.appendChild(link);
    });

    section.append(headingWrap, description, grid);
    return section;
  }

  function waitAndMountPlayerSection(sectionFactory) {
    const container = document.getElementById("playerContent");
    if (!container) return;
    const tryMount = () => {
      if (container.querySelector("[data-pbwg-watch-notes-related]")) return true;
      if (container.textContent.includes("データ読込中")) return false;
      const section = sectionFactory();
      if (!section) return false;
      container.appendChild(section);
      return true;
    };

    if (tryMount()) return;
    const observer = new MutationObserver(() => {
      if (tryMount()) observer.disconnect();
    });
    observer.observe(container, { childList: true, subtree: true });
    window.setTimeout(() => {
      tryMount();
      observer.disconnect();
    }, 10000);
  }

  function mountTeamSection(section) {
    const main = document.querySelector("main");
    if (!main || main.querySelector("[data-pbwg-watch-notes-related]")) return;
    main.appendChild(section);
  }

  async function enhancePlayerLensPage() {
    const path = normalizePath(location.pathname);
    if (!path.startsWith("/player-lens")) return;

    const params = new URLSearchParams(location.search);
    const articles = await loadArticles();
    if (!articles.length) return;

    if (path === "/player-lens/player") {
      const name = params.get("name") || "";
      const team = shortTeam(params.get("team") || "");
      if (!name) return;
      const items = relatedArticlesForPlayer(articles, name, team);
      if (!items.length) return;
      waitAndMountPlayerSection(() => createPlayerLensRelatedSection(
        items,
        `${name}の観戦メモ`,
        "数字だけでなく、実際に試合を見て感じたこともあわせて確認できます。",
      ));
      return;
    }

    let team = shortTeam(document.body?.dataset?.team || params.get("team") || "");
    const match = path.match(/^\/player-lens\/teams\/([^/]+)$/);
    if (!team && match) team = SLUG_TO_TEAM.get(match[1]) || "";
    if (!team && path !== "/player-lens/team") return;
    if (!team) return;

    const items = relatedArticlesForTeam(articles, team);
    if (!items.length) return;
    mountTeamSection(createPlayerLensRelatedSection(
      items,
      `${fullTeamName(team)}の観戦メモ`,
      "この球団について実際に試合を見て残した観戦メモです。データと記事を行き来できます。",
    ));
  }

  function findCurrentArticle(articles) {
    const current = normalizePath(location.pathname);
    return articles.find((entry) => normalizePath(entry.path) === current) || null;
  }

  function addContextLinks(box, article, players) {
    if (!box || box.querySelector("[data-pbwg-player-lens-context]")) return;
    const targetTeam = teamFromEntry(article);
    const candidates = players
      .filter((player) => !targetTeam || player.team === targetTeam)
      .map((player) => ({ player, score: scorePlayerForArticle(player, article, players) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name, "ja"))
      .slice(0, 4)
      .map((item) => item.player);

    if (!targetTeam && !candidates.length) return;

    const wrap = document.createElement("div");
    wrap.dataset.pbwgPlayerLensContext = "true";
    const h3 = document.createElement("h3");
    h3.textContent = "この記事から見るデータ";
    const buttons = document.createElement("div");
    buttons.className = "link-buttons";

    if (targetTeam) {
      const teamLink = document.createElement("a");
      teamLink.className = "button ghost";
      teamLink.href = teamUrl(targetTeam);
      teamLink.textContent = `${fullTeamName(targetTeam)}のデータ`;
      buttons.appendChild(teamLink);
    }

    candidates.forEach((player) => {
      const link = document.createElement("a");
      link.className = "button ghost";
      link.href = playerUrl(player);
      link.textContent = `${player.name}のデータ`;
      buttons.appendChild(link);
    });

    wrap.append(h3, buttons);
    const firstButtons = box.querySelector(".link-buttons");
    if (firstButtons) box.insertBefore(wrap, firstButtons);
    else box.appendChild(wrap);
  }

  async function enhanceWatchNotePage() {
    const box = document.querySelector(".player-lens-box");
    if (!box || !normalizePath(location.pathname).startsWith("/watch-notes/")) return;

    const [articles, players] = await Promise.all([loadArticles(), loadPlayerMaster()]);
    const article = findCurrentArticle(articles);
    if (!article) return;
    addContextLinks(box, article, players);
  }

  async function boot() {
    try {
      if (normalizePath(location.pathname).startsWith("/player-lens")) {
        await enhancePlayerLensPage();
      } else if (normalizePath(location.pathname).startsWith("/watch-notes/")) {
        await enhanceWatchNotePage();
      }
    } catch (error) {
      console.warn("Player Lens / 観戦メモ 関連リンクを追加できませんでした:", error);
      // Existing page content and generic navigation remain usable.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
