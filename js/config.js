// アプリ全体の設定値
const CONFIG = Object.freeze({
  github: Object.freeze({
    owner: 'Kakeru1362',
    repo: 'tuned.inc',
    branch: 'main',
    dataPath: 'data.json'
  }),
  // 管理画面パスコード（SHA-256ハッシュ）。変更時は新パスコードのハッシュに差し替える
  adminPassHash: 'b0abb088f760138dc46f73702f68a341d89d3e7090fbd7c25d2b6138b72c9526',
  storageKeys: Object.freeze({
    token: 'tundeinc_gh_token',
    draft: 'tundeinc_draft',
    authed: 'tundeinc_admin_authed'
  }),
  projectStatuses: Object.freeze(['計画中', '進行中', '保留', '完了']),
  taskStatuses: Object.freeze(['未着手', '進行中', '完了']),
  priorities: Object.freeze(['高', '中', '低']),
  dueSoonDays: 7
});
