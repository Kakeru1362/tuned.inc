# TUNDE INC. プロジェクト管理板

会社のプロジェクト・メンバー・タスク・期限を一括管理するPC向けウェブアプリ。

## 画面

| 画面 | URL | 対象 |
|------|-----|------|
| 閲覧ダッシュボード | `index.html` | 全員（認証なし） |
| 管理コンソール | `admin.html` | 管理者（パスコード） |

## 仕組み

- データはリポジトリ直下の `data.json` 1ファイル。
- 閲覧画面は GitHub API 経由で最新の `data.json` を取得して表示（保存後すぐ反映）。
- 管理画面で編集 →「GitHubに保存」で `data.json` にコミット → 全員の閲覧画面に反映。

## 管理者の初期設定

1. `admin.html` を開き、パスコードを入力（初期値は管理者に確認）。
2. GitHub → Settings → Developer settings → **Fine-grained personal access tokens** でトークンを発行。
   - Repository access: このリポジトリのみ
   - Permissions: **Contents → Read and write**
3. 管理画面の「トークン設定」に貼り付け（ブラウザ内にのみ保存される）。

## パスコードの変更

`js/config.js` の `adminPassHash` を新しいパスコードの SHA-256 ハッシュに差し替える。

```
node -e "console.log(require('crypto').createHash('sha256').update('新パスコード').digest('hex'))"
```

## 注意事項

- パスコードはクライアントサイドの簡易ゲートであり、本格的な認証ではありません。
  実際の書き込み保護は GitHub トークン（管理者のブラウザにのみ保存）が担います。
- 公開リポジトリのため `data.json` は誰でも閲覧可能です。機密情報は載せないでください。
- 編集の競合時（409エラー）はページを再読み込みしてからやり直してください。
