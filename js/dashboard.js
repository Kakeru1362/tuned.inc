// 閲覧ダッシュボードの描画

const dashboardState = { data: null, filters: { project: '', member: '', status: '' } };

function renderStats(data) {
  const s = computeStats(data);
  const cell = (num, unit, label, alert) => `
    <div class="stat ${alert ? 'stat--alert' : ''} rise">
      <div class="num">${num}<span class="unit">${unit}</span></div>
      <div class="label">${label}</div>
    </div>`;
  return `
    <div class="stats">
      ${cell(s.active, '件', '進行中プロジェクト', false)}
      ${cell(s.dueSoon, '件', `期限${CONFIG.dueSoonDays}日以内タスク`, false)}
      ${cell(s.overdue, '件', '期限超過タスク', s.overdue > 0)}
      ${cell(s.doneRate, '%', '全タスク完了率', false)}
    </div>`;
}

function renderProjects(data) {
  const order = { '進行中': 0, '計画中': 1, '保留': 2, '完了': 3 };
  const sorted = [...data.projects].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  const cards = sorted.map((p) => {
    const prog = projectProgress(data, p.id);
    const avatars = p.memberIds.map((id) => avatarHtml(memberById(data, id))).join('');
    const cls = p.status === '進行中' ? 'pcard--active' : p.status === '完了' ? 'pcard--done' : '';
    return `
      <article class="pcard ${cls} rise" data-project="${escapeHtml(p.id)}">
        <div class="pcard-head">
          <div>
            <h3>${escapeHtml(p.name)}</h3>
            <div class="client">${escapeHtml(p.client || '—')}</div>
          </div>
          ${statusBadge(p.status)}
        </div>
        <p class="desc">${escapeHtml(p.description || '')}</p>
        <div class="progress">
          <div class="progress-bar"><i style="--pct:${prog.percent}%"></i></div>
          <span class="pct">${prog.percent}%</span>
          <span class="cnt">${prog.done}/${prog.total}</span>
        </div>
        <div class="pcard-foot">
          <span class="avatar-stack">${avatars}</span>
          <span class="term">${formatDate(p.start)} 〜 ${formatDate(p.end)}</span>
        </div>
      </article>`;
  }).join('');
  return `
    <section class="section" id="projects">
      <h2 class="section-label">案件一覧<span class="en">PROJECTS</span></h2>
      <p class="grid-hint">カードをクリックすると、その案件のタスクだけを下の一覧に表示します（もう一度クリックで解除）</p>
      <div class="project-grid">${cards || '<div class="empty-note">プロジェクトがありません</div>'}</div>
    </section>`;
}

function renderDeadlines(data) {
  const upcoming = data.tasks
    .filter((t) => t.status !== '完了')
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 8);
  const rows = upcoming.map((t) => {
    const p = projectById(data, t.projectId);
    const m = memberById(data, t.assigneeId);
    return `
      <div class="dl-row ${isOverdue(t) ? 'dl-row--over' : ''} rise">
        ${dueLabel(t)}
        ${priorityMark(t.priority)}
        <span class="title">${escapeHtml(t.title)}</span>
        <span class="proj">${escapeHtml(p ? p.name : '—')}</span>
        <span class="assignee">${avatarHtml(m, 'avatar--sm')}${escapeHtml(m ? m.name : '未割当')}</span>
      </div>`;
  }).join('');
  return `
    <section class="section" id="deadlines">
      <h2 class="section-label">直近の期限<span class="en">UPCOMING DEADLINES</span></h2>
      <div class="deadline-list">${rows || '<div class="empty-note">未完了のタスクはありません</div>'}</div>
    </section>`;
}

function filteredTasks(data) {
  const f = dashboardState.filters;
  return data.tasks.filter((t) =>
    (!f.project || t.projectId === f.project) &&
    (!f.member || t.assigneeId === f.member) &&
    (!f.status || t.status === f.status)
  );
}

function renderTaskRows(data) {
  const tasks = filteredTasks(data).sort((a, b) => a.due.localeCompare(b.due));
  if (tasks.length === 0) return '<tr><td colspan="6"><div class="empty-note">該当するタスクがありません</div></td></tr>';
  return tasks.map((t) => {
    const p = projectById(data, t.projectId);
    const m = memberById(data, t.assigneeId);
    return `
      <tr class="${t.status === '完了' ? 'is-done' : ''}">
        <td>${priorityMark(t.priority)}</td>
        <td>${escapeHtml(t.title)}</td>
        <td class="t-proj">${escapeHtml(p ? p.name : '—')}</td>
        <td><span class="t-assignee">${avatarHtml(m, 'avatar--sm')}${escapeHtml(m ? m.name : '未割当')}</span></td>
        <td>${dueLabel(t)}</td>
        <td>${statusBadge(t.status)}</td>
      </tr>`;
  }).join('');
}

function renderTasks(data) {
  const opts = (items, labelFn) => items.map((i) => `<option value="${escapeHtml(i.id ?? i)}">${escapeHtml(labelFn ? labelFn(i) : i)}</option>`).join('');
  return `
    <section class="section" id="tasks">
      <h2 class="section-label">全タスク<span class="en">ALL TASKS</span></h2>
      <div class="filters">
        <select id="fProject"><option value="">すべての案件</option>${opts(data.projects, (p) => p.name)}</select>
        <select id="fMember"><option value="">すべての担当</option>${opts(data.members, (m) => m.name)}</select>
        <select id="fStatus"><option value="">すべての状態</option>${opts(CONFIG.taskStatuses)}</select>
        <span class="count" id="taskCount"></span>
      </div>
      <table class="task-table">
        <thead><tr>
          <th>優先</th><th>タスク</th><th>案件</th><th>担当</th><th>期限</th><th>状態</th>
        </tr></thead>
        <tbody id="taskBody"></tbody>
      </table>
    </section>`;
}

function renderMembers(data) {
  const cards = data.members.map((m) => {
    const open = data.tasks.filter((t) => t.assigneeId === m.id && t.status !== '完了');
    const over = open.filter(isOverdue).length;
    return `
      <div class="mcard rise">
        ${avatarHtml(m)}
        <div class="info">
          <div class="name">${escapeHtml(m.name)}</div>
          <div class="role">${escapeHtml(m.role)}</div>
        </div>
        <div class="load">
          <div class="n ${over > 0 ? 'has-over' : ''}">${open.length}</div>
          <div class="l">残タスク${over > 0 ? ` ／ 超過${over}` : ''}</div>
        </div>
      </div>`;
  }).join('');
  return `
    <section class="section" id="members">
      <h2 class="section-label">メンバー<span class="en">MEMBERS</span></h2>
      <div class="member-grid">${cards}</div>
    </section>`;
}

function refreshTaskTable() {
  const body = document.getElementById('taskBody');
  const count = document.getElementById('taskCount');
  if (!body) return;
  body.innerHTML = renderTaskRows(dashboardState.data);
  count.textContent = `${filteredTasks(dashboardState.data).length} 件`;
}

function setProjectFilter(projectId, scroll) {
  dashboardState.filters = { ...dashboardState.filters, project: projectId };
  const select = document.getElementById('fProject');
  if (select) select.value = projectId;
  document.querySelectorAll('.pcard').forEach((card) => {
    card.classList.toggle('pcard--selected', Boolean(projectId) && card.dataset.project === projectId);
  });
  refreshTaskTable();
  if (scroll && projectId) {
    document.getElementById('tasks').scrollIntoView({ behavior: 'smooth' });
  }
}

function bindFilters() {
  [['fProject', 'project'], ['fMember', 'member'], ['fStatus', 'status']].forEach(([elId, key]) => {
    const select = document.getElementById(elId);
    select.addEventListener('change', () => {
      if (key === 'project') {
        setProjectFilter(select.value, false);
        return;
      }
      dashboardState.filters = { ...dashboardState.filters, [key]: select.value };
      refreshTaskTable();
    });
  });
}

function bindProjectCards() {
  document.querySelectorAll('.pcard[data-project]').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.project;
      setProjectFilter(dashboardState.filters.project === id ? '' : id, true);
    });
  });
}

function renderHeader(data) {
  const now = new Date();
  const week = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
  document.getElementById('todayLabel').textContent =
    `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${week}）`;
  const updated = data.updatedAt ? new Date(data.updatedAt) : null;
  document.getElementById('updatedLabel').textContent = updated
    ? `最終更新：${updated.getMonth() + 1}/${updated.getDate()} ${String(updated.getHours()).padStart(2, '0')}:${String(updated.getMinutes()).padStart(2, '0')}`
    : '最終更新：—';
}

async function initDashboard() {
  const app = document.getElementById('app');
  try {
    const data = await loadData();
    dashboardState.data = data;
    renderHeader(data);
    app.innerHTML = renderStats(data) + renderProjects(data) + renderDeadlines(data) + renderTasks(data) + renderMembers(data);
    bindFilters();
    bindProjectCards();
    refreshTaskTable();
  } catch (error) {
    app.innerHTML = '<div class="empty-note">データの読み込みに失敗しました。時間をおいて再読み込みしてください。</div>';
  }
}

initDashboard();
