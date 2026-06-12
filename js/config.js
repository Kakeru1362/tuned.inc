// アプリ全体の設定値
const CONFIG = Object.freeze({
  github: Object.freeze({
    owner: 'Kakeru1362',
    repo: 'tuned.inc',
    branch: 'main',
    dataPath: 'data.json'
  }),
  storageKeys: Object.freeze({
    token: 'tundeinc_gh_token',
    draft: 'tundeinc_draft'
  }),
  projectStatuses: Object.freeze(['計画中', '進行中', '保留', '完了']),
  taskStatuses: Object.freeze(['未着手', '進行中', '完了']),
  priorities: Object.freeze(['高', '中', '低']),
  dueSoonDays: 7
});
