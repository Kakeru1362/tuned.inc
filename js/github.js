// GitHub Contents API 経由で data.json を読み書きする（管理画面用）

function getToken() {
  return localStorage.getItem(CONFIG.storageKeys.token) || '';
}

function setToken(token) {
  if (token) {
    localStorage.setItem(CONFIG.storageKeys.token, token.trim());
  } else {
    localStorage.removeItem(CONFIG.storageKeys.token);
  }
}

function encodeBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

async function fetchCurrentSha() {
  const { owner, repo, branch, dataPath } = CONFIG.github;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!res.ok) {
    throw new Error(`現在のデータ取得に失敗しました（HTTP ${res.status}）`);
  }
  const json = await res.json();
  return json.sha;
}

async function saveDataToGitHub(data) {
  const token = getToken();
  if (!token) {
    throw new Error('GitHubトークンが未設定です。「トークン設定」から登録してください。');
  }
  const { owner, repo, branch, dataPath } = CONFIG.github;
  const sha = await fetchCurrentSha();
  const payload = { ...data, updatedAt: new Date().toISOString() };
  const body = {
    message: `chore: update data via admin console (${new Date().toLocaleString('ja-JP')})`,
    content: encodeBase64Utf8(JSON.stringify(payload, null, 2)),
    sha,
    branch
  };
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const detail = res.status === 401 ? 'トークンが無効です' : res.status === 409 ? '他の更新と競合しました。再読込してやり直してください' : `HTTP ${res.status}`;
    throw new Error(`保存に失敗しました：${detail}`);
  }
  return payload;
}
