# 記事一覧・サイトマップの更新

記事情報の基準は `data/articles.json` です。

- 記事を追加・更新したら、同じ内容を `data/articles.json` に追加・修正します。
- `npm run update-site` で、トップの新着、記事一覧、観戦メモ一覧、`sitemap.xml` を同期できます。
- GitHubでは `data/articles.json` が更新されると、Actionsが同じ処理を実行して生成ファイルを反映します。
- `source` に指定したHTMLが存在しない場合や、URLが重複している場合は処理を停止します。
