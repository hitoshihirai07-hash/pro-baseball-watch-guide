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
  var articleSearchItems = [{"path":"/watch-notes/giants-swallows-2026-07-14-16","category":"観戦メモ","title":"笹原操希の勝ち越し弾とダルベックの2本塁打｜ヤクルト対巨人3連戦","description":"7月14日から16日のヤクルト対巨人3連戦を、笹原操希、ダルベック、山﨑伊織、先発陣と救援陣から振り返ります。","keywords":"観戦メモ 巨人 ヤクルト スワローズ 3連戦 神宮 明治神宮野球場 笹原操希 ダルベック 山﨑伊織 西舘勇陽 マタ 赤星優志 船迫大雅 中川皓太 田中瑛斗 ライデル・マルティネス ホームラン 4番 先発 救援陣 カード振り返り"},{"path":"/watch-notes/giants-all-star-2026-urata-tanaka-eito","category":"観戦メモ","title":"浦田俊輔と田中瑛斗が初のオールスター選出","description":"オールスター監督選抜で初選出された浦田俊輔と田中瑛斗、大勢の今後についてまとめた観戦メモです。","keywords":"観戦メモ 巨人 オールスター 2026 監督選抜 浦田俊輔 田中瑛斗 大勢 ファン投票 初選出 球宴 選手"},{"path":"/watch-notes/giants-baystars-2026-07-10-12","category":"観戦メモ","title":"浦田俊輔の出塁と盗塁、救援陣の安定感｜DeNA対巨人3連戦","description":"7月10日から12日のDeNA対巨人3連戦を、浦田俊輔、中川皓太、ライデル・マルティネス、打線とリチャードの起用から振り返ります。","keywords":"観戦メモ 巨人 DeNA ベイスターズ 3連戦 横浜スタジアム 浦田俊輔 中川皓太 ライデル・マルティネス リチャード 盗塁 救援陣 カード振り返り"},{"path":"/watch-notes/giants-tigers-2026-07-07-09","category":"観戦メモ","title":"坂本勇人の頼もしさと若い投手の力｜巨人対阪神3連戦","description":"7月7日から9日の巨人対阪神3連戦を、坂本勇人、堀田賢慎、山田龍聖、先発投手陣から振り返ります。","keywords":"観戦メモ 巨人 阪神 3連戦 東京ドーム 坂本勇人 堀田賢慎 山田龍聖 則本昂大 戸郷翔征 西舘勇陽 カード振り返り"},{"path":"/watch-notes/giants-dragons-2026-07-03-05","category":"観戦メモ","title":"井上温大の安定感と笹原操希のプロ初本塁打","description":"巨人対中日3連戦を、井上温大、笹原操希、大野雄大、打線の変化から振り返ります。","keywords":"観戦メモ 巨人 中日 ドラゴンズ 3連戦 井上温大 笹原操希 大野雄大 知念大成 打線 支配下"},{"path":"/watch-notes/giants-ogasawara-richard-2026-06-27","category":"観戦メモ","title":"小笠原慎之介の日本復帰登板とリチャードの一発","description":"6月27日阪神対巨人を、投手と打線の印象から振り返ります。","keywords":"観戦メモ 巨人 阪神 小笠原慎之介 リチャード 日本復帰 登板 ホームラン 選手 起用"},{"path":"/watch-notes/softbank-kurihara-kondo-highlights","category":"観戦メモ","title":"栗原陵矢と近藤健介の一発が印象に残る","description":"ソフトバンクをハイライトで見て感じたことを残しています。","keywords":"観戦メモ ソフトバンク ホークス 栗原陵矢 近藤健介 大津亮介 ハイライト 選手 起用"},{"path":"/watch-notes/giants-dragons-2026-06-19-21","category":"観戦メモ","title":"ウィットリーの投球と捕手2人起用","description":"巨人対中日3連戦で印象に残った投球と起用を振り返ります。","keywords":"観戦メモ 巨人 中日 3連戦 ウィットリー 岸田 大城 捕手 起用 投球 選手"},{"slug":"teams","category":"12球団","title":"12球団紹介","description":"プロ野球12球団の特徴、本拠地、試合を見るときの入口をまとめています。","keywords":"球団 球団名 セリーグ パリーグ 巨人 阪神 DeNA ベイスターズ ヤクルト 中日 広島 日本ハム ソフトバンク オリックス 西武 ロッテ 楽天 12球団 本拠地"},{"slug":"yomiuri-giants-guide","category":"12球団","title":"読売ジャイアンツとは？歴史・東京ドーム・観戦の楽しみ方","description":"巨人の基本情報、東京ドーム観戦、テレビ・配信での見方、注目選手の探し方をまとめます。","keywords":"巨人 読売 ジャイアンツ GIANTS 東京ドーム 兎 セリーグ 球団紹介 本拠地 観戦 配信"},{"slug":"hanshin-tigers-guide","category":"12球団","title":"阪神タイガースとは？歴史・甲子園観戦の楽しみ方","description":"阪神の基本情報、甲子園観戦、屋外球場の準備、テレビ・配信での見方をまとめます。","keywords":"阪神 タイガース Tigers 甲子園 阪神甲子園球場 セリーグ 球団紹介 本拠地 観戦 配信"},{"slug":"yokohama-dena-baystars-guide","category":"12球団","title":"横浜DeNAベイスターズとは？横浜スタジアム観戦の楽しみ方","description":"DeNAの基本情報、横浜スタジアムとのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"DeNA 横浜 ベイスターズ BayStars ハマスタ 横浜スタジアム セリーグ 球団紹介 本拠地 観戦"},{"slug":"tokyo-yakult-swallows-guide","category":"12球団","title":"東京ヤクルトスワローズとは？神宮観戦の楽しみ方","description":"ヤクルトの基本情報、明治神宮野球場とのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"ヤクルト スワローズ Swallows 神宮 明治神宮野球場 セリーグ 球団紹介 本拠地 観戦"},{"slug":"hiroshima-toyo-carp-guide","category":"12球団","title":"広島東洋カープとは？マツダスタジアム観戦の楽しみ方","description":"カープの基本情報、マツダスタジアムとのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"広島 カープ Carp マツダスタジアム MAZDA Zoom-Zoom セリーグ 球団紹介 本拠地 観戦"},{"slug":"chunichi-dragons-guide","category":"12球団","title":"中日ドラゴンズとは？バンテリンドーム ナゴヤ観戦の楽しみ方","description":"中日の基本情報、バンテリンドーム ナゴヤとのつながり、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"中日 ドラゴンズ Dragons バンテリンドーム ナゴヤ ナゴヤドーム バンテリン セリーグ 球団紹介 本拠地 観戦"},{"slug":"hokkaido-nippon-ham-fighters-guide","category":"12球団","title":"北海道日本ハムファイターズとは？エスコンフィールド観戦の楽しみ方","description":"ファイターズの基本情報、エスコンフィールドHOKKAIDO、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"日本ハム 日ハム ファイターズ Fighters 北海道 エスコン エスコンフィールド HOKKAIDO パリーグ 球団紹介 本拠地 観戦"},{"slug":"fukuoka-softbank-hawks-guide","category":"12球団","title":"福岡ソフトバンクホークスとは？PayPayドーム観戦の楽しみ方","description":"ソフトバンクの基本情報、みずほPayPayドーム福岡、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"ソフトバンク ホークス Hawks 福岡 PayPayドーム みずほPayPayドーム パリーグ 球団紹介 本拠地 観戦"},{"slug":"orix-buffaloes-guide","category":"12球団","title":"オリックス・バファローズとは？京セラドーム大阪観戦の楽しみ方","description":"オリックスの基本情報、京セラドーム大阪、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"オリックス バファローズ Buffaloes 京セラ 京セラドーム 大阪 パリーグ 球団紹介 本拠地 観戦"},{"slug":"seibu-lions-guide","category":"12球団","title":"埼玉西武ライオンズとは？ベルーナドーム観戦の楽しみ方","description":"西武の基本情報、ベルーナドーム、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"西武 ライオンズ Lions 埼玉 ベルーナドーム 西武球場前 パリーグ 球団紹介 本拠地 観戦"},{"slug":"chiba-lotte-marines-guide","category":"12球団","title":"千葉ロッテマリーンズとは？ZOZOマリンスタジアム観戦の楽しみ方","description":"ロッテの基本情報、ZOZOマリンスタジアム、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"ロッテ マリーンズ Marines 千葉 ZOZOマリン ZOZOマリンスタジアム 海浜幕張 パリーグ 球団紹介 本拠地 観戦"},{"slug":"tohoku-rakuten-golden-eagles-guide","category":"12球団","title":"東北楽天ゴールデンイーグルスとは？楽天モバイルパーク観戦の楽しみ方","description":"楽天の基本情報、楽天モバイル 最強パーク宮城、初めて観戦する人向けの楽しみ方をまとめます。","keywords":"楽天 イーグルス Eagles 東北 楽天モバイルパーク 楽天モバイル 最強パーク 宮城 仙台 パリーグ 球団紹介 本拠地 観戦"},{"slug":"npb-12-stadiums-guide","category":"球場まとめ","title":"プロ野球12球団の本拠地球場まとめ","description":"12球団の本拠地球場を一覧で比較し、球場の特徴や本拠地球団を確認できます。","keywords":"球場 本拠地 12球団 比較 東京ドーム 甲子園 横浜スタジアム 神宮 マツダ バンテリンドーム ナゴヤ エスコン PayPay 京セラ ベルーナ ZOZO 楽天モバイル"},{"slug":"koshien-stadium-guide","category":"球場ガイド","title":"甲子園球場観戦ガイド","description":"阪神甲子園球場で球場の特徴や本拠地球団、天候対策、ナイター後の動き方をまとめます。","keywords":"甲子園 阪神甲子園球場 阪神 タイガース 球場ガイド 屋外   ナイター アクセス "},{"slug":"yokohama-stadium-guide","category":"球場ガイド","title":"横浜スタジアム観戦ガイド","description":"横浜スタジアムで球場の特徴や本拠地球団、屋外試合を見るときのポイントをまとめます。","keywords":"横浜スタジアム ハマスタ DeNA ベイスターズ 横浜 球場ガイド 屋外   アクセス "},{"slug":"meiji-jingu-stadium-guide","category":"球場ガイド","title":"明治神宮野球場ガイド","description":"明治神宮野球場で球場の特徴や本拠地球団、屋外試合を見るときのポイントをまとめます。","keywords":"神宮 明治神宮野球場 ヤクルト スワローズ 球場ガイド 屋外   アクセス "},{"slug":"mazda-stadium-guide","category":"球場ガイド","title":"マツダスタジアムガイド","description":"マツダスタジアムで球場の特徴や本拠地球団、屋外試合を見るときのポイントをまとめます。","keywords":"マツダスタジアム MAZDA Zoom-Zoom 広島 カープ 球場ガイド 屋外   アクセス "},{"slug":"nagoya-dome-guide","category":"球場ガイド","title":"バンテリンドーム ナゴヤ観戦ガイド","description":"バンテリンドーム ナゴヤで球場の特徴や本拠地球団、ドーム試合を見るときのポイントをまとめます。","keywords":"バンテリンドーム ナゴヤ ナゴヤドーム バンテリン 中日 ドラゴンズ 球場ガイド ドーム アクセス "},{"slug":"es-con-field-guide","category":"球場ガイド","title":"エスコンフィールドHOKKAIDOガイド","description":"エスコンフィールドで初めて観戦する人向けに、球場の特徴と本拠地球団、試合を見るときのポイントをまとめます。","keywords":"エスコン エスコンフィールド HOKKAIDO 日本ハム 日ハム ファイターズ 北海道 球場ガイド アクセス キャッシュレス "},{"slug":"paypay-dome-guide","category":"球場ガイド","title":"みずほPayPayドーム福岡ガイド","description":"みずほPayPayドーム福岡で初めて観戦する人向けに、球場の特徴と本拠地球団、試合を見るときのポイントをまとめます。","keywords":"PayPayドーム みずほPayPayドーム 福岡 ソフトバンク ホークス 球場ガイド ドーム アクセス "},{"slug":"kyocera-dome-osaka-guide","category":"球場ガイド","title":"京セラドーム大阪ガイド","description":"京セラドーム大阪で初めて観戦する人向けに、アクセス、ドーム観戦の準備、持ち込みルール、ナイター後の動き方をまとめます。","keywords":"京セラ 京セラドーム 京セラドーム大阪 オリックス バファローズ 大阪 球場ガイド ドーム アクセス "},{"slug":"belluna-dome-guide","category":"球場ガイド","title":"ベルーナドームガイド","description":"ベルーナドームで初めて観戦する人向けに、アクセス、屋根付き球場の服装、持ち物、ナイター後の動き方をまとめます。","keywords":"ベルーナドーム 西武 ライオンズ 西武球場前 球場ガイド 屋根付き  寒さ アクセス "},{"slug":"zozo-marine-stadium-guide","category":"球場ガイド","title":"ZOZOマリンスタジアムガイド","description":"ZOZOマリンで初めて観戦する人向けに、海浜幕張からのアクセス、屋外観戦の服装、持ち物、ナイター後の動き方をまとめます。","keywords":"ZOZOマリン ZOZOマリンスタジアム ロッテ マリーンズ 千葉 海浜幕張 球場ガイド 屋外 風   アクセス "},{"slug":"rakuten-mobile-saikyo-park-miyagi-guide","category":"球場ガイド","title":"楽天モバイル 最強パーク宮城ガイド","description":"楽天モバイル 最強パーク宮城で初めて観戦する人向けに、アクセス、完全キャッシュレス、持ち物、ナイター後の動き方をまとめます。","keywords":"楽天モバイルパーク 楽天モバイル 最強パーク 宮城 楽天 イーグルス 仙台 球場ガイド 屋外 キャッシュレス アクセス "},{"slug":"baseball-streaming-services","category":"中継・配信","title":"プロ野球中継・配信一覧｜主催球団別の主な視聴先","description":"主催球団ごとの主なネット配信・CS・BS・地域局と、公式放送予定の確認先を一覧で見られます。","keywords":"中継 配信 視聴先 主催球団 放送予定 巨人 阪神 DeNA 広島 ヤクルト 中日 ソフトバンク 日本ハム ロッテ 西武 楽天 オリックス DAZN GIANTS TV 虎テレ"},{"slug":"watch-baseball-on-tv","category":"中継・配信","title":"プロ野球をテレビで見る方法","description":"プロ野球中継をテレビの大画面で見たい人向けに、Fire TV、HDMI、スマートテレビ、Wi-Fi環境を整理します。","keywords":"テレビ 大画面 Fire TV HDMI スマートテレビ Wi-Fi 配信 中継 視聴 家で見る"},{"slug":"first-baseball-game-flow","category":"初観戦","title":"初めてプロ野球観戦に行く日の流れ","description":"チケット確認から球場到着、入場、試合後まで、初観戦の当日の流れを順番に整理します。","keywords":"初観戦 初めて プロ野球 観戦 当日 流れ 球場 入場 チケット 座席 持ち物 試合後 帰り方 初心者"},{"slug":"baseball-game-watch-guide","category":"試合の見方","title":"プロ野球観戦がもっと楽しくなる試合の見方","description":"先発投手、打順、得点機、継投、守備から、初心者が試合の流れを追うポイントを整理します。","keywords":"試合の見方 観戦 先発投手 打順 継投 守備 得点圏 代打 代走 守備交代 野球 初心者 テレビ 配信 球場"},{"slug":"npb-all-star-game-2026-guide","category":"オールスター","title":"プロ野球オールスターゲーム2026とは？日程・開催球場・観戦前に見たいポイント","description":"2026年の開催日程、東京ドーム・富山市民球場の特徴、チケットと観戦前の確認ポイントをまとめます。","keywords":"オールスター オールスターゲーム マイナビ 2026 東京ドーム 富山市民球場 アルペンスタジアム セリーグ パリーグ 日程 チケット ホームランダービー 12球団"},{"slug":"baseball-ticket-seat-guide","category":"チケット・席種","title":"プロ野球観戦チケットの取り方と席種の選び方","description":"チケットを取る前に決めること、内野席・外野席・応援席・ビジター席の違いを整理します。","keywords":"チケット 席種 内野席 外野席 応援席 ビジター席 初観戦 購入 取り方 席選び"},{"slug":"baseball-cheering-visitor-seat-guide","category":"応援席","title":"プロ野球の応援席・ビジター席とは？","description":"応援席、外野席、ビジター応援席の違いを初心者向けに整理します。","keywords":"応援席 ビジター席 外野席 ホーム ユニフォーム 応援グッズ 初観戦 席種"},{"slug":"player-lens-guide","category":"データ","title":"プロ野球の成績をもっと見やすく｜Player Lensで注目選手を探す楽しみ方","description":"Player Lensを使って、打者・投手・若手・左右別・守備・交流戦などを見比べる楽しみ方を紹介します。","keywords":"データ 成績 Player Lens 注目選手 ランキング 打者 投手 若手 左右別 守備 交流戦"},{"slug":"player-lens-batter-guide","category":"データ・打者","title":"打率だけではわからない打者の見方","description":"出塁、長打、三振、打席数、左右別、打順の見方をPlayer Lensとあわせて紹介します。","keywords":"打者 打率 出塁率 長打率 OPS 三振 打席 打順 左右別 Player Lens データ 成績"},{"slug":"player-lens-pitcher-guide","category":"データ・投手","title":"防御率だけではわからない投手の見方","description":"防御率、投球回、奪三振、四球、先発・リリーフの役割、左右別の見方を紹介します。","keywords":"投手 防御率 投球回 奪三振 四球 K/BB WHIP 先発 リリーフ 左右別 Player Lens データ 成績"},{"slug":"baseball-sns-post-start-guide","category":"SNS投稿","title":"プロ野球SNS投稿の始め方","description":"試合前・試合中・試合後に書きやすい内容、続けるための型、投稿時の注意点を整理します。","keywords":"SNS 投稿 X Twitter Bluesky ブルースカイ 試合前 試合中 試合後 感想 テンプレ 野球投稿"},{"slug":"baseball-game-preview-post-template","category":"SNS投稿","title":"プロ野球の試合前投稿テンプレ","description":"先発投手、打順、3連戦、球場、天候などから試合前投稿を作るテンプレと考え方を整理します。","keywords":"SNS 投稿 試合前 テンプレ 先発 打順 3連戦 見どころ 球場 天候 X Bluesky"},{"slug":"baseball-game-recap-post-template","category":"SNS投稿","title":"プロ野球の試合後投稿テンプレ","description":"勝った日、負けた日、引き分けの日で書きやすい内容と投稿テンプレを整理します。","keywords":"SNS 投稿 試合後 テンプレ 勝った日 負けた日 引き分け 感想 振り返り X Bluesky"},{"slug":"baseball-series-recap-post-template","category":"SNS投稿","title":"プロ野球の3連戦振り返りテンプレ","description":"カード勝ち越し、負け越し、1勝1敗1分などの書き方とテンプレを整理します。","keywords":"SNS 投稿 3連戦 カード 勝ち越し 負け越し 引き分け 振り返り テンプレ X Bluesky"},{"slug":"baseball-stadium-report-post-template","category":"SNS投稿","title":"プロ野球の現地観戦レポートの書き方","description":"写真が多くなくても、席・球場の雰囲気・試合後メモから観戦レポートを作る方法を整理します。","keywords":"SNS 投稿 現地観戦 レポート 観戦記 写真なし 感想 メモ 席 球場 ブログ note X Bluesky"},{"slug":"baseball-blog-post-start-guide","category":"SNS投稿","title":"プロ野球ブログの始め方","description":"SNS投稿を観戦メモとして使い、ブログやnoteの記事へ広げる流れをまとめます。","keywords":"ブログ note SNS 投稿 観戦メモ 試合感想 記事 書き方 始め方 X Bluesky"},{"slug":"admin-profile","category":"このサイトについて","title":"管理者プロフィール","description":"巨人ファンとして、試合・選手・チームを見ていく個人ブログの方針を紹介します。","keywords":"管理者 プロフィール 運営者 巨人ファン 個人ブログ 試合 選手 チーム 観戦メモ"}];

  function normalizeSearchText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); })
      .replace(/[\s　・･ー\-＿_／/｜|（）()［］\[\]「」『』【】.,，、。:：]/g, '');
  }

  function createResultUrl(item) {
    if (item && item.path) return item.path;
    var slug = item && item.slug ? item.slug : '';
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
      empty.innerHTML = '例：巨人、東京ドーム、甲子園、配信、打順、投手、SNS、試合後、ブログ';
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
