# 管理画面・Google API接続設定

Cloudflare Pagesの環境変数・シークレットで設定します。**秘密鍵やOAuthトークンはGitHubに保存しないでください。**

## Search Console

1. Google CloudでSearch Console APIを有効化する。
2. GA4で使用中のサービスアカウントのメールアドレスを、Search Consoleの該当プロパティに閲覧ユーザーとして追加する。
3. Cloudflare Pagesに環境変数 `GSC_SITE_URL` を設定する。実際のプロパティ文字列と完全一致させる：`https://pro-baseball-watch-guide.com/` または `sc-domain:pro-baseball-watch-guide.com`。
4. 既存のGA4サービスアカウントSecret（`GA4_SERVICE_ACCOUNT_JSON`、または `GA4_SERVICE_ACCOUNT_EMAIL` / `GA4_PRIVATE_KEY`）を再利用する。

## AdSense

AdSense Management API v2をGoogle Cloudで有効にする。サービスアカウントはAdSenseに使えないため、Google OAuth 2.0を利用し、AdSense閲覧専用スコープ `https://www.googleapis.com/auth/adsense.readonly` で本人が同意したリフレッシュトークンを発行する。

Cloudflare Pagesに以下を設定：
- `ADSENSE_ACCOUNT_ID`: `accounts/pub-...` 形式のAdSenseアカウント
- `ADSENSE_OAUTH_CLIENT_ID`: OAuthクライアントID
- `ADSENSE_OAUTH_CLIENT_SECRET`: OAuthクライアントシークレット（Secret）
- `ADSENSE_REFRESH_TOKEN`: 閲覧専用OAuthのリフレッシュトークン（Secret）

**AdSenseは必ずOWNED_SITE_DOMAIN_NAME==pro-baseball-watch-guide.comでフィルター**する。他サイトの収益と混在させない。未接続や取得失敗は0円ではなくエラーを表示する。通貨はAdSenseレスポンスから取得する。

Cloudflareのシークレット設定後に再デプロイして管理画面で接続状態を確認する。CSVコピーや定期自動化は不要。

参考：https://developers.google.com/webmaster-tools/v1/searchanalytics/query

参考：https://developers.google.com/adsense/management/reference/rest/v2/accounts.reports/generate
