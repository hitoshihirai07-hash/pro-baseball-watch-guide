# 観戦メモ公開データ

管理画面の /admin/watch-note/ でダウンロードした公開用JSONを、このフォルダへアップロードします。

main ブランチへ追加・更新すると、GitHub Actionsが次を自動生成します。

- watch-notes/<slug>.html
- data/articles.json
- トップ、記事一覧、観戦メモ一覧、巨人の今
- feed.xml
- sitemap.xml

公開前の自由メモや記事作成プロンプトは、このフォルダへ置きません。
