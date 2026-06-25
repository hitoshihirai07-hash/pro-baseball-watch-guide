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


(function () {
  var articleSearchItems = [{"slug":"teams","category":"12球団","title":"12球団紹介","description":"プロ野球12球団の特徴、本拠地、観戦前に知っておきたいポイントをまとめる入口です。","keywords":"球団 球団名 セリーグ パリーグ 巨人 阪神 DeNA ベイスターズ ヤクルト 中日 広島 日本ハム ソフトバンク オリックス 西武 ロッテ 楽天 12球団 本拠地"},{"slug":"yomiuri-giants-guide","category":"12球団","title":"読売ジャイアンツとは？歴史・東京ドーム・観戦の楽しみ方","description":"巨人の基本情報、東京ドーム観戦、テレビ・配信での見方、注目選手の探し方をまとめます。","keywords":"巨人 読売 ジャイアンツ GIANTS 東京ドーム 兎 セリーグ 球団紹介 本拠地 観戦 配信"},{"slug":"hanshin-tigers-guide","category":"12球団","title":"阪神タイガースとは？歴史・甲子園観戦の楽しみ方","description":"阪神の基本情報、甲子園観戦、屋外球場の準備、テレビ・配信での見方をまとめます。","keywords":"阪神 タイガース Tigers 甲子園 阪神甲子園球場 セリーグ 球団紹介 本拠地 観戦 配信"},{"slug":"yokohama-dena-baystars-guide","category":"12球団","title":"横浜DeNAベイスターズとは？横浜スタジアム観戦の楽しみ方","description":"DeNAの基本情報、横浜スタジアムとのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"DeNA 横浜 ベイスターズ BayStars ハマスタ 横浜スタジアム セリーグ 球団紹介 本拠地 観戦"},{"slug":"tokyo-yakult-swallows-guide","category":"12球団","title":"東京ヤクルトスワローズとは？神宮観戦の楽しみ方","description":"ヤクルトの基本情報、明治神宮野球場とのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"ヤクルト スワローズ Swallows 神宮 明治神宮野球場 セリーグ 球団紹介 本拠地 観戦"},{"slug":"hiroshima-toyo-carp-guide","category":"12球団","title":"広島東洋カープとは？マツダスタジアム観戦の楽しみ方","description":"カープの基本情報、マツダスタジアムとのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"広島 カープ Carp マツダスタジアム MAZDA Zoom-Zoom セリーグ 球団紹介 本拠地 観戦"},{"slug":"chunichi-dragons-guide","category":"12球団","title":"中日ドラゴンズとは？バンテリンドーム ナゴヤ観戦の楽しみ方","description":"中日の基本情報、バンテリンドーム ナゴヤとのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"中日 ドラゴンズ Dragons バンテリンドーム ナゴヤ ナゴヤドーム バンテリン セリーグ 球団紹介 本拠地 観戦"},{"slug":"hokkaido-nippon-ham-fighters-guide","category":"12球団","title":"北海道日本ハムファイターズとは？エスコンフィールド観戦の楽しみ方","description":"ファイターズの基本情報、エスコンフィールドHOKKAIDO、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"日本ハム 日ハム ファイターズ Fighters 北海道 エスコン エスコンフィールド HOKKAIDO パリーグ 球団紹介 本拠地 観戦"},{"slug":"fukuoka-softbank-hawks-guide","category":"12球団","title":"福岡ソフトバンクホークスとは？PayPayドーム観戦の楽しみ方","description":"ソフトバンクの基本情報、みずほPayPayドーム福岡、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"ソフトバンク ホークス Hawks 福岡 PayPayドーム みずほPayPayドーム パリーグ 球団紹介 本拠地 観戦"},{"slug":"orix-buffaloes-guide","category":"12球団","title":"オリックス・バファローズとは？京セラドーム大阪観戦の楽しみ方","description":"オリックスの基本情報、京セラドーム大阪、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"オリックス バファローズ Buffaloes 京セラ 京セラドーム 大阪 パリーグ 球団紹介 本拠地 観戦"},{"slug":"seibu-lions-guide","category":"12球団","title":"埼玉西武ライオンズとは？ベルーナドーム観戦の楽しみ方","description":"西武の基本情報、ベルーナドーム、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"西武 ライオンズ Lions 埼玉 ベルーナドーム 西武球場前 パリーグ 球団紹介 本拠地 観戦"},{"slug":"chiba-lotte-marines-guide","category":"12球団","title":"千葉ロッテマリーンズとは？ZOZOマリンスタジアム観戦の楽しみ方","description":"ロッテの基本情報、ZOZOマリンスタジアム、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"ロッテ マリーンズ Marines 千葉 ZOZOマリン ZOZOマリンスタジアム 海浜幕張 パリーグ 球団紹介 本拠地 観戦"},{"slug":"tohoku-rakuten-golden-eagles-guide","category":"12球団","title":"東北楽天ゴールデンイーグルスとは？楽天モバイルパーク観戦の楽しみ方","description":"楽天の基本情報、楽天モバイル 最強パーク宮城、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"楽天 イーグルス Eagles 東北 楽天モバイルパーク 楽天モバイル 最強パーク 宮城 仙台 パリーグ 球団紹介 本拠地 観戦"},{"slug":"npb-12-stadiums-guide","category":"球場まとめ","title":"プロ野球12球団の本拠地球場まとめ","description":"12球団の本拠地を一覧で比較し、アクセス、特徴、観戦しやすさを確認できます。","keywords":"球場 本拠地 12球団 比較 アクセス ドーム 屋外 遠征 東京ドーム 甲子園 横浜スタジアム 神宮 マツダ バンテリンドーム ナゴヤ ナゴヤドーム エスコン PayPay 京セラ ベルーナ ZOZO 楽天モバイル"},{"slug":"tokyo-dome-travel","category":"遠征・球場","title":"東京ドーム遠征ガイド｜ホテルエリア・アクセス・ナイター後の動き方","description":"東京ドーム遠征で失敗しにくいホテルエリア、最寄り駅、ナイター後の帰り方、持ち物をまとめます。","keywords":"東京ドーム 巨人 遠征 ホテル 水道橋 後楽園 ナイター アクセス 持ち物 帰り方 ドーム球場"},{"slug":"koshien-stadium-guide","category":"球場ガイド","title":"甲子園球場観戦ガイド","description":"阪神甲子園球場で初めて観戦する人向けに、アクセス、持ち物、天候対策、ナイター後の動き方をまとめます。","keywords":"甲子園 阪神甲子園球場 阪神 タイガース 球場ガイド 屋外 雨 暑さ ナイター アクセス 持ち物"},{"slug":"yokohama-stadium-guide","category":"球場ガイド","title":"横浜スタジアム観戦ガイド","description":"横浜スタジアムで初めて観戦する人向けに、アクセス、持ち物、屋外観戦の注意点、ナイター後の動き方をまとめます。","keywords":"横浜スタジアム ハマスタ DeNA ベイスターズ 横浜 球場ガイド 屋外 雨 暑さ アクセス 持ち物"},{"slug":"meiji-jingu-stadium-guide","category":"球場ガイド","title":"明治神宮野球場ガイド","description":"明治神宮野球場で初めて観戦する人向けに、アクセス、持ち物、屋外観戦の注意点、ナイター後の動き方をまとめます。","keywords":"神宮 明治神宮野球場 ヤクルト スワローズ 球場ガイド 屋外 雨 暑さ アクセス 持ち物"},{"slug":"mazda-stadium-guide","category":"球場ガイド","title":"マツダスタジアムガイド","description":"マツダスタジアムで初めて観戦する人向けに、アクセス、持ち物、屋外観戦の注意点、ナイター後の動き方をまとめます。","keywords":"マツダスタジアム MAZDA Zoom-Zoom 広島 カープ 球場ガイド 屋外 雨 暑さ アクセス 持ち物"},{"slug":"nagoya-dome-guide","category":"球場ガイド","title":"バンテリンドーム ナゴヤ観戦ガイド","description":"バンテリンドーム ナゴヤで初めて観戦する人向けに、アクセス、持ち物、ドーム観戦の注意点、ナイター後の動き方をまとめます。","keywords":"バンテリンドーム ナゴヤ ナゴヤドーム バンテリン 中日 ドラゴンズ 球場ガイド ドーム アクセス 持ち物"},{"slug":"es-con-field-guide","category":"球場ガイド","title":"エスコンフィールドHOKKAIDOガイド","description":"エスコンフィールドで初めて観戦する人向けに、アクセス、キャッシュレス、持ち物、ナイター後の動き方をまとめます。","keywords":"エスコン エスコンフィールド HOKKAIDO 日本ハム 日ハム ファイターズ 北海道 球場ガイド アクセス キャッシュレス 持ち物"},{"slug":"paypay-dome-guide","category":"球場ガイド","title":"みずほPayPayドーム福岡ガイド","description":"みずほPayPayドーム福岡で初めて観戦する人向けに、アクセス、持ち込みルール、持ち物、ナイター後の動き方をまとめます。","keywords":"PayPayドーム みずほPayPayドーム 福岡 ソフトバンク ホークス 球場ガイド ドーム アクセス 持ち物"},{"slug":"kyocera-dome-osaka-guide","category":"球場ガイド","title":"京セラドーム大阪ガイド","description":"京セラドーム大阪で初めて観戦する人向けに、アクセス、ドーム観戦の準備、持ち込みルール、ナイター後の動き方をまとめます。","keywords":"京セラ 京セラドーム 京セラドーム大阪 オリックス バファローズ 大阪 球場ガイド ドーム アクセス 持ち物"},{"slug":"belluna-dome-guide","category":"球場ガイド","title":"ベルーナドームガイド","description":"ベルーナドームで初めて観戦する人向けに、アクセス、屋根付き球場の服装、持ち物、ナイター後の動き方をまとめます。","keywords":"ベルーナドーム 西武 ライオンズ 西武球場前 球場ガイド 屋根付き 暑さ 寒さ アクセス 持ち物"},{"slug":"zozo-marine-stadium-guide","category":"球場ガイド","title":"ZOZOマリンスタジアムガイド","description":"ZOZOマリンで初めて観戦する人向けに、海浜幕張からのアクセス、屋外観戦の服装、持ち物、ナイター後の動き方をまとめます。","keywords":"ZOZOマリン ZOZOマリンスタジアム ロッテ マリーンズ 千葉 海浜幕張 球場ガイド 屋外 風 雨 暑さ アクセス 持ち物"},{"slug":"rakuten-mobile-saikyo-park-miyagi-guide","category":"球場ガイド","title":"楽天モバイル 最強パーク宮城ガイド","description":"楽天モバイル 最強パーク宮城で初めて観戦する人向けに、アクセス、完全キャッシュレス、持ち物、ナイター後の動き方をまとめます。","keywords":"楽天モバイルパーク 楽天モバイル 最強パーク 宮城 楽天 イーグルス 仙台 球場ガイド 屋外 キャッシュレス アクセス 持ち物"},{"slug":"baseball-streaming-services","category":"中継・配信","title":"プロ野球中継はどこで見る？球団別におすすめ配信サービスを比較","description":"プロ野球中継をどこで見るべきか、主要サービスの違いと失敗しない選び方を整理します。","keywords":"配信 中継 テレビ 視聴 DAZN パリーグTV スカパー DMM TV J SPORTS Amazon Prime 球団別 見る方法"},{"slug":"watch-baseball-on-tv","category":"テレビ","title":"プロ野球をテレビで見る方法","description":"プロ野球中継をテレビの大画面で見たい人向けに、Fire TV、HDMI、スマートテレビ、Wi-Fi環境を整理します。","keywords":"テレビ 大画面 Fire TV HDMI スマートテレビ Wi-Fi 配信 中継 視聴 家で見る"},{"slug":"baseball-game-watch-guide","category":"試合の見方","title":"プロ野球観戦がもっと楽しくなる試合の見方","description":"先発投手、打順、得点機、継投、守備から、初心者が試合の流れを追うポイントを整理します。","keywords":"試合の見方 観戦 先発投手 打順 継投 守備 得点圏 代打 代走 守備交代 野球 初心者 テレビ 配信 球場"},{"slug":"npb-all-star-game-2026-guide","category":"オールスター","title":"プロ野球オールスターゲーム2026とは？日程・開催球場・観戦前に見たいポイント","description":"2026年の開催日程、東京ドーム・富山市民球場の特徴、チケットと観戦前の確認ポイントをまとめます。","keywords":"オールスター オールスターゲーム マイナビ 2026 東京ドーム 富山市民球場 アルペンスタジアム セリーグ パリーグ 日程 チケット ホームランダービー 12球団"},{"slug":"baseball-ticket-seat-guide","category":"チケット・席種","title":"プロ野球観戦チケットの取り方と席種の選び方","description":"チケットを取る前に決めること、内野席・外野席・応援席・ビジター席の違いを整理します。","keywords":"チケット 席種 内野席 外野席 応援席 ビジター席 初観戦 購入 取り方 席選び"},{"slug":"first-baseball-game-flow","category":"初観戦","title":"初めてプロ野球観戦に行く日の流れ","description":"出発前、入場、売店、試合中、試合後の帰り方まで当日の流れを整理します。","keywords":"初観戦 初めて 当日 流れ 入場 売店 試合中 帰宅 ナイター 観戦準備"},{"slug":"baseball-cheering-visitor-seat-guide","category":"応援席","title":"プロ野球の応援席・ビジター席とは？","description":"応援席、外野席、ビジター応援席の違いを初心者向けに整理します。","keywords":"応援席 ビジター席 外野席 ホーム ユニフォーム 応援グッズ 初観戦 席種"},{"slug":"baseball-game-items","category":"観戦準備","title":"初めてのプロ野球観戦に必要な持ち物リスト","description":"初めて球場へ行く人が困らないように、必須アイテム、季節別の持ち物、注意点を整理します。","keywords":"持ち物 観戦準備 チケット スマホ タオル 雨具 バッグ モバイルバッテリー 双眼鏡 初観戦"},{"slug":"baseball-game-clothing-guide","category":"服装ガイド","title":"プロ野球観戦の服装ガイド｜春・夏・秋・雨の日・ナイター別に解説","description":"球場タイプ、季節、デーゲーム・ナイター別に、動きやすく調整しやすい服装を整理します。","keywords":"服装 観戦服 野球観戦 春 夏 秋 冬 雨 ナイター デーゲーム 上着 パーカー 帽子 レインポンチョ ドーム 屋外 ベルーナ ZOZOマリン 甲子園 横浜 神宮"},{"slug":"rainy-baseball-game-items","category":"雨対策","title":"雨の日のプロ野球観戦に必要なもの","description":"レインポンチョ、防水バッグ、タオル、靴、スマホ対策、中止確認まで整理します。","keywords":"雨 雨の日 雨対策 屋外球場 レインポンチョ 防水バッグ タオル 靴 スマホ 中止 持ち物"},{"slug":"summer-baseball-heat-goods","category":"暑さ対策","title":"夏の野球観戦の暑さ対策グッズ","description":"冷感タオル、ハンディファン、モバイルバッテリー、帽子、保冷ボトルなどの準備を整理します。","keywords":"暑さ 夏 暑さ対策 熱中症 冷感タオル ハンディファン モバイルバッテリー 帽子 保冷ボトル 持ち物"},{"slug":"baseball-fan-gifts","category":"ギフト","title":"野球ファンに喜ばれるプレゼント特集","description":"野球好きの家族・友人に贈りやすいプレゼントを、価格帯別・相手別・観戦スタイル別に整理します。","keywords":"プレゼント ギフト 野球ファン グッズ 誕生日 家族 友人 観戦グッズ 価格帯"},{"slug":"player-lens-guide","category":"データ","title":"プロ野球の成績をもっと見やすく｜Player Lensで注目選手を探す楽しみ方","description":"Player Lensを使って、打者・投手・若手・左右別・守備・交流戦などを見比べる楽しみ方を紹介します。","keywords":"データ 成績 Player Lens 注目選手 ランキング 打者 投手 若手 左右別 守備 交流戦"},{"slug":"player-lens-batter-guide","category":"データ・打者","title":"打率だけではわからない打者の見方","description":"出塁、長打、三振、打席数、左右別、打順の見方をPlayer Lensとあわせて紹介します。","keywords":"打者 打率 出塁率 長打率 OPS 三振 打席 打順 左右別 Player Lens データ 成績"},{"slug":"player-lens-pitcher-guide","category":"データ・投手","title":"防御率だけではわからない投手の見方","description":"防御率、投球回、奪三振、四球、先発・リリーフの役割、左右別の見方を紹介します。","keywords":"投手 防御率 投球回 奪三振 四球 K/BB WHIP 先発 リリーフ 左右別 Player Lens データ 成績"},{"slug":"baseball-sns-post-start-guide","category":"SNS投稿","title":"プロ野球SNS投稿の始め方","description":"試合前・試合中・試合後に書きやすい内容、続けるための型、投稿時の注意点を整理します。","keywords":"SNS 投稿 X Twitter Bluesky ブルースカイ 試合前 試合中 試合後 感想 テンプレ 野球投稿"},{"slug":"baseball-game-preview-post-template","category":"SNS投稿","title":"プロ野球の試合前投稿テンプレ","description":"先発投手、打順、3連戦、球場、天候などから試合前投稿を作るテンプレと考え方を整理します。","keywords":"SNS 投稿 試合前 テンプレ 先発 打順 3連戦 見どころ 球場 天候 X Bluesky"},{"slug":"baseball-game-recap-post-template","category":"SNS投稿","title":"プロ野球の試合後投稿テンプレ","description":"勝った日、負けた日、引き分けの日で書きやすい内容と投稿テンプレを整理します。","keywords":"SNS 投稿 試合後 テンプレ 勝った日 負けた日 引き分け 感想 振り返り X Bluesky"},{"slug":"baseball-series-recap-post-template","category":"SNS投稿","title":"プロ野球の3連戦振り返りテンプレ","description":"カード勝ち越し、負け越し、1勝1敗1分などの書き方とテンプレを整理します。","keywords":"SNS 投稿 3連戦 カード 勝ち越し 負け越し 引き分け 振り返り テンプレ X Bluesky"},{"slug":"baseball-stadium-report-post-template","category":"SNS投稿","title":"プロ野球の現地観戦レポートの書き方","description":"写真が多くなくても、席・球場の雰囲気・試合後メモから観戦レポートを作る方法を整理します。","keywords":"SNS 投稿 現地観戦 レポート 観戦記 写真なし 感想 メモ 席 球場 ブログ note X Bluesky"},{"slug":"baseball-blog-post-start-guide","category":"SNS投稿","title":"プロ野球ブログの始め方","description":"SNS投稿を観戦メモとして使い、ブログやnoteの記事へ広げる流れをまとめます。","keywords":"ブログ note SNS 投稿 観戦メモ 試合感想 記事 書き方 始め方 X Bluesky"},{"slug":"admin-profile","category":"このサイトについて","title":"管理者プロフィール","description":"巨人ファンとして、配信・観戦・遠征・打撃や選手メモを初心者にもわかりやすくまとめていく方針を紹介します。","keywords":"管理者 プロフィール 運営者 巨人ファン 個人ブログ このサイトについて"}];

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); })
      .replace(/[\s　・･ー\-＿_／/｜|（）()［］\[\]「」『』【】.,，、。:：]/g, '');
  }

  function createResultUrl(slug) {
    var inArticles = /\/articles\/?/.test(window.location.pathname);
    return inArticles ? slug : 'articles/' + slug;
  }

  function scoreItem(item, rawQuery) {
    var query = normalizeSearchText(rawQuery);
    if (!query) return 0;
    var title = normalizeSearchText(item.title);
    var category = normalizeSearchText(item.category);
    var description = normalizeSearchText(item.description);
    var keywords = normalizeSearchText(item.keywords);
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
      status.textContent = 'キーワードを入れると記事候補が表示されます。';
      return;
    }
    var matched = articleSearchItems
      .map(function (item) { return { item: item, score: scoreItem(item, trimmed) }; })
      .filter(function (entry) { return entry.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.item.title.localeCompare(b.item.title, 'ja'); })
      .slice(0, 8);

    if (!matched.length) {
      status.textContent = '「' + trimmed + '」に近い記事が見つかりませんでした。別の言葉でも試せます。';
      var empty = document.createElement('div');
      empty.className = 'article-search-empty';
      empty.innerHTML = '例：巨人、東京ドーム、甲子園、配信、持ち物、服装、雨、暑さ、SNS、試合後、ブログ';
      results.appendChild(empty);
      return;
    }

    status.textContent = '「' + trimmed + '」の候補：' + matched.length + '件表示しています。';
    matched.forEach(function (entry) {
      var item = entry.item;
      var link = document.createElement('a');
      link.className = 'article-search-result';
      link.href = createResultUrl(item.slug);
      link.innerHTML = '<span class="badge"></span><strong></strong><span></span>';
      link.querySelector('.badge').textContent = item.category;
      link.querySelector('strong').textContent = item.title;
      link.querySelector('span:last-child').textContent = item.description;
      results.appendChild(link);
    });
  }

  function setupArticleSearch() {
    document.querySelectorAll('[data-article-search]').forEach(function (box) {
      var input = box.querySelector('[data-article-search-input]');
      var clear = box.querySelector('[data-article-search-clear]');
      if (!input) return;
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupArticleSearch);
  } else {
    setupArticleSearch();
  }
})();


(function () {
  function setupWatchNoteFilters() {
    document.querySelectorAll('[data-watch-note-section]').forEach(function (section) {
      var filters = section.querySelector('[data-watch-note-filters]');
      var items = Array.prototype.slice.call(section.querySelectorAll('[data-watch-note-item]'));
      var status = section.querySelector('[data-watch-note-status]');
      var empty = section.querySelector('[data-watch-note-empty]');
      if (!filters || !items.length) return;

      function applyFilter(value, label) {
        var shown = 0;
        items.forEach(function (item) {
          var tags = (item.getAttribute('data-watch-note-tags') || '').split(/\s+/);
          var matches = value === 'all' || tags.indexOf(value) !== -1;
          item.hidden = !matches;
          if (matches) shown += 1;
        });
        filters.querySelectorAll('[data-watch-note-filter-value]').forEach(function (button) {
          var active = button.getAttribute('data-watch-note-filter-value') === value;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        if (empty) empty.hidden = shown !== 0;
        if (status) {
          status.textContent = shown
            ? (value === 'all' ? 'すべての観戦メモを表示しています。' : label + 'の観戦メモを表示しています。')
            : label + 'の観戦メモは、まだありません。';
        }
      }

      filters.querySelectorAll('[data-watch-note-filter-value]').forEach(function (button) {
        button.addEventListener('click', function () {
          applyFilter(button.getAttribute('data-watch-note-filter-value') || 'all', button.textContent.trim());
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupWatchNoteFilters);
  } else {
    setupWatchNoteFilters();
  }
})();
