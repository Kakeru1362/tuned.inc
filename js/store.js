// データの読み込みと集計（閲覧・管理共通）

async function fetchDataFromApi() {
  const { owner, repo, branch, dataPath } = CONFIG.github;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dataPath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.raw+json' }
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

async function fetchDataFromSite() {
  const res = await fetch(`data.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`data.json fetch error: ${res.status}`);
  }
  return res.json();
}

function isValidData(data) {
  return Boolean(data)
    && Array.isArray(data.projects)
    && Array.isArray(data.tasks)
    && Array.isArray(data.members);
}

// GitHub API（即時反映）を優先し、失敗時は同梱の data.json にフォールバック
async function loadData() {
  try {
    const data = await fetchDataFromApi();
    if (!isValidData(data)) {
      throw new Error('unexpected data shape');
    }
    return data;
  } catch (apiError) {
    return fetchDataFromSite();
  }
}

function toDate(ymd) {
  return new Date(`${ymd}T00:00:00+09:00`);
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysUntil(ymd) {
  const diff = toDate(ymd).getTime() - today().getTime();
  return Math.round(diff / 86400000);
}

function formatDate(ymd) {
  if (!ymd) return '—';
  const d = toDate(ymd);
  const week = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}（${week}）`;
}

function memberById(data, id) {
  return data.members.find((m) => m.id === id) || null;
}

function projectById(data, id) {
  return data.projects.find((p) => p.id === id) || null;
}

function tasksOfProject(data, projectId) {
  return data.tasks.filter((t) => t.projectId === projectId);
}

function projectProgress(data, projectId) {
  const tasks = tasksOfProject(data, projectId);
  if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
  const done = tasks.filter((t) => t.status === '完了').length;
  return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
}

function isOverdue(task) {
  return task.status !== '完了' && daysUntil(task.due) < 0;
}

function isDueSoon(task) {
  const d = daysUntil(task.due);
  return task.status !== '完了' && d >= 0 && d <= CONFIG.dueSoonDays;
}

function computeStats(data) {
  const active = data.projects.filter((p) => p.status === '進行中').length;
  const openTasks = data.tasks.filter((t) => t.status !== '完了');
  const overdue = data.tasks.filter(isOverdue).length;
  const dueSoon = data.tasks.filter(isDueSoon).length;
  const doneRate = data.tasks.length === 0
    ? 0
    : Math.round((data.tasks.filter((t) => t.status === '完了').length / data.tasks.length) * 100);
  return { active, open: openTasks.length, overdue, dueSoon, doneRate };
}
