// 管理コンソール：認証・タブ・CRUD・保存

const adminState = {
  data: null,
  tab: 'projects',
  dirty: false
};

/* ---------- 状態更新 ---------- */

function setData(next, markDirty = true) {
  adminState.data = next;
  if (markDirty) {
    adminState.dirty = true;
    localStorage.setItem(CONFIG.storageKeys.draft, JSON.stringify(next));
  }
  document.getElementById('dirtyDot').classList.toggle('on', adminState.dirty);
  renderAdmin();
}

function newId(prefix, list) {
  const nums = list.map((item) => parseInt(String(item.id).replace(/\D/g, ''), 10) || 0);
  return `${prefix}${Math.max(0, ...nums) + 1}`;
}

/* ---------- タブ描画 ---------- */

function renderAdmin() {
  const app = document.getElementById('adminApp');
  const data = adminState.data;
  if (!data) return;
  const renderers = { projects: renderProjectTab, tasks: renderTaskTab, members: renderMemberTab };
  app.innerHTML = renderers[adminState.tab](data);
}

function renderProjectTab(data) {
  const rows = data.projects.map((p) => {
    const prog = projectProgress(data, p.id);
    const names = p.memberIds.map((id) => {
      const m = memberById(data, id);
      return m ? m.name : '？';
    }).join('、');
    return `
      <tr>
        <td><strong>${escapeHtml(p.name)}</strong><br><span style="font-size:11px;color:var(--ink-faint)">${escapeHtml(p.client || '—')}</span></td>
        <td>${statusBadge(p.status)}</td>
        <td style="font-size:12px">${formatDate(p.start)} 〜 ${formatDate(p.end)}</td>
        <td style="font-size:12px">${escapeHtml(names || '—')}</td>
        <td>${prog.done}/${prog.total}</td>
        <td class="ops">
          <button class="btn btn--sm" data-edit-project="${escapeHtml(p.id)}">編集</button>
          <button class="btn btn--sm btn--danger" data-del-project="${escapeHtml(p.id)}">削除</button>
        </td>
      </tr>`;
  }).join('');
  return `
    <div class="edit-head">
      <span class="hint">プロジェクトの追加・編集・削除。削除すると紐づくタスクも削除されます。</span>
      <button class="btn btn--primary btn--sm" data-add="project">＋ 案件を追加</button>
    </div>
    <table class="edit-table">
      <thead><tr><th>案件名／取引先</th><th>状態</th><th>期間</th><th>担当</th><th>進捗</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6"><div class="empty-note">プロジェクトがありません</div></td></tr>'}</tbody>
    </table>`;
}

function renderTaskTab(data) {
  const rows = [...data.tasks].sort((a, b) => a.due.localeCompare(b.due)).map((t) => {
    const p = projectById(data, t.projectId);
    const m = memberById(data, t.assigneeId);
    return `
      <tr class="${t.status === '完了' ? 'is-done' : ''}">
        <td>${priorityMark(t.priority)}</td>
        <td>${escapeHtml(t.title)}</td>
        <td style="font-size:12px;color:var(--ink-faint)">${escapeHtml(p ? p.name : '—')}</td>
        <td style="font-size:12px">${escapeHtml(m ? m.name : '未割当')}</td>
        <td>${dueLabel(t)}</td>
        <td>${statusBadge(t.status)}</td>
        <td class="ops">
          <button class="btn btn--sm" data-edit-task="${escapeHtml(t.id)}">編集</button>
          <button class="btn btn--sm btn--danger" data-del-task="${escapeHtml(t.id)}">削除</button>
        </td>
      </tr>`;
  }).join('');
  return `
    <div class="edit-head">
      <span class="hint">タスクの追加・編集・削除。期限順に表示しています。</span>
      <span>
        <button class="btn btn--sm" data-add="template">テンプレートから選んで追加</button>
        <button class="btn btn--primary btn--sm" data-add="task">＋ タスクを追加</button>
      </span>
    </div>
    <table class="edit-table">
      <thead><tr><th>優先</th><th>タスク</th><th>案件</th><th>担当</th><th>期限</th><th>状態</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7"><div class="empty-note">タスクがありません</div></td></tr>'}</tbody>
    </table>`;
}

function renderMemberTab(data) {
  const rows = data.members.map((m) => {
    const open = data.tasks.filter((t) => t.assigneeId === m.id && t.status !== '完了').length;
    return `
      <tr>
        <td>${avatarHtml(m)}</td>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td>${escapeHtml(m.role)}</td>
        <td>${open} 件</td>
        <td class="ops">
          <button class="btn btn--sm" data-edit-member="${escapeHtml(m.id)}">編集</button>
          <button class="btn btn--sm btn--danger" data-del-member="${escapeHtml(m.id)}">削除</button>
        </td>
      </tr>`;
  }).join('');
  return `
    <div class="edit-head">
      <span class="hint">メンバーの追加・編集・削除。削除してもタスクは残ります（担当が未割当になります）。</span>
      <button class="btn btn--primary btn--sm" data-add="member">＋ メンバーを追加</button>
    </div>
    <table class="edit-table">
      <thead><tr><th></th><th>氏名</th><th>役割</th><th>残タスク</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5"><div class="empty-note">メンバーがいません</div></td></tr>'}</tbody>
    </table>`;
}

/* ---------- モーダル ---------- */

function openModal(html) {
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalWrap').classList.add('open');
}

function closeModal() {
  document.getElementById('modalWrap').classList.remove('open');
}

function selectOptions(values, selected) {
  return values.map((v) => `<option value="${escapeHtml(v)}" ${v === selected ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
}

function projectForm(project) {
  const p = project || { id: '', name: '', client: '', status: '進行中', start: '', end: '', memberIds: [], description: '' };
  const checks = adminState.data.members.map((m) => `
    <label><input type="checkbox" name="memberIds" value="${escapeHtml(m.id)}" ${p.memberIds.includes(m.id) ? 'checked' : ''}>${escapeHtml(m.name)}</label>`).join('');
  openModal(`
    <h3>${project ? '案件を編集' : '案件を追加'}</h3>
    <form id="modalForm" data-kind="project" data-id="${escapeHtml(p.id)}">
      <div class="field"><label>案件名 *</label><input type="text" name="name" required value="${escapeHtml(p.name)}"></div>
      <div class="field"><label>取引先</label><input type="text" name="client" value="${escapeHtml(p.client)}"></div>
      <div class="field-row">
        <div class="field"><label>状態</label><select name="status">${selectOptions(CONFIG.projectStatuses, p.status)}</select></div>
        <div></div>
      </div>
      <div class="field-row">
        <div class="field"><label>開始日</label><input type="date" name="start" value="${escapeHtml(p.start)}"></div>
        <div class="field"><label>終了予定日</label><input type="date" name="end" value="${escapeHtml(p.end)}"></div>
      </div>
      <div class="field"><label>担当メンバー</label><div class="member-checks">${checks || '<span class="hint">先にメンバーを登録してください</span>'}</div></div>
      <div class="field"><label>概要</label><textarea name="description">${escapeHtml(p.description)}</textarea></div>
      <div class="modal-foot">
        <button type="button" class="btn btn--ghost" data-close>キャンセル</button>
        <button type="submit" class="btn btn--primary">保存</button>
      </div>
    </form>`);
}

function taskForm(task) {
  const t = task || { id: '', projectId: adminState.data.projects[0]?.id || '', title: '', assigneeId: '', due: '', status: '未着手', priority: '中' };
  const projectOpts = adminState.data.projects.map((p) => `<option value="${escapeHtml(p.id)}" ${p.id === t.projectId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
  const memberOpts = adminState.data.members.map((m) => `<option value="${escapeHtml(m.id)}" ${m.id === t.assigneeId ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('');
  openModal(`
    <h3>${task ? 'タスクを編集' : 'タスクを追加'}</h3>
    <form id="modalForm" data-kind="task" data-id="${escapeHtml(t.id)}">
      <div class="field"><label>タスク名 *</label><input type="text" name="title" required value="${escapeHtml(t.title)}"></div>
      <div class="field-row">
        <div class="field"><label>案件 *</label><select name="projectId" required>${projectOpts}</select></div>
        <div class="field"><label>担当</label><select name="assigneeId"><option value="">未割当</option>${memberOpts}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>期限 *</label><input type="date" name="due" required value="${escapeHtml(t.due)}"></div>
        <div class="field"><label>優先度</label><select name="priority">${selectOptions(CONFIG.priorities, t.priority)}</select></div>
      </div>
      <div class="field"><label>状態</label><select name="status">${selectOptions(CONFIG.taskStatuses, t.status)}</select></div>
      <div class="modal-foot">
        <button type="button" class="btn btn--ghost" data-close>キャンセル</button>
        <button type="submit" class="btn btn--primary">保存</button>
      </div>
    </form>`);
}

function memberForm(member) {
  const m = member || { id: '', name: '', role: '', color: '#b5452f' };
  openModal(`
    <h3>${member ? 'メンバーを編集' : 'メンバーを追加'}</h3>
    <form id="modalForm" data-kind="member" data-id="${escapeHtml(m.id)}">
      <div class="field"><label>氏名 *</label><input type="text" name="name" required value="${escapeHtml(m.name)}"></div>
      <div class="field"><label>役割</label><input type="text" name="role" value="${escapeHtml(m.role)}"></div>
      <div class="field"><label>表示色</label><input type="color" name="color" value="${escapeHtml(m.color)}"></div>
      <div class="modal-foot">
        <button type="button" class="btn btn--ghost" data-close>キャンセル</button>
        <button type="submit" class="btn btn--primary">保存</button>
      </div>
    </form>`);
}

/* ---------- タスクテンプレート ---------- */

function ymdString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(ymd, days) {
  const d = toDate(ymd);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return ymdString(next);
}

function templateChecklistHtml(catIndex, baseYmd) {
  const cat = TASK_TEMPLATES[catIndex];
  return cat.tasks.map((t, i) => `
    <label class="tpl-item">
      <input type="checkbox" name="tplTask" value="${i}" checked>
      <span class="tpl-title">${escapeHtml(t.title)}</span>
      <span class="tpl-due">期限 ${formatDate(addDays(baseYmd, t.offset))}</span>
      ${priorityMark(t.priority)}
    </label>`).join('');
}

function templateForm() {
  if (adminState.data.projects.length === 0) {
    showToast('先に案件を追加してください', 'error');
    return;
  }
  const base = ymdString(new Date());
  const projectOpts = adminState.data.projects
    .filter((p) => p.status !== '完了')
    .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  const memberOpts = adminState.data.members
    .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('');
  const catOpts = TASK_TEMPLATES
    .map((c, i) => `<option value="${i}">${escapeHtml(c.category)}</option>`).join('');
  openModal(`
    <h3>テンプレートからタスクを追加</h3>
    <form id="modalForm" data-kind="template">
      <div class="field-row">
        <div class="field"><label>追加先の案件 *</label><select name="projectId" required>${projectOpts}</select></div>
        <div class="field"><label>担当（まとめて設定）</label><select name="assigneeId"><option value="">未割当</option>${memberOpts}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label>仕事の種類</label><select name="catIndex" id="tplCat">${catOpts}</select></div>
        <div class="field"><label>開始日（期限を自動計算）</label><input type="date" name="base" id="tplBase" value="${base}"></div>
      </div>
      <div class="field">
        <label>追加するタスク（チェックを外すと追加されません）</label>
        <div class="tpl-list" id="tplList">${templateChecklistHtml(0, base)}</div>
        <p class="note">期限は開始日からの目安で自動設定されます。追加後に個別に編集できます。</p>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn--ghost" id="tplToggle">全選択／解除</button>
        <button type="button" class="btn btn--ghost" data-close>キャンセル</button>
        <button type="submit" class="btn btn--primary">選んだタスクを追加</button>
      </div>
    </form>`);
  const refreshList = () => {
    const catIndex = Number(document.getElementById('tplCat').value);
    const baseYmd = document.getElementById('tplBase').value || base;
    document.getElementById('tplList').innerHTML = templateChecklistHtml(catIndex, baseYmd);
  };
  document.getElementById('tplCat').addEventListener('change', refreshList);
  document.getElementById('tplBase').addEventListener('change', refreshList);
  document.getElementById('tplToggle').addEventListener('click', () => {
    const boxes = [...document.querySelectorAll('#tplList input[name="tplTask"]')];
    const allChecked = boxes.every((b) => b.checked);
    boxes.forEach((b) => { b.checked = !allChecked; });
  });
}

function applyTemplateForm(form) {
  const projectId = form.projectId.value;
  const assigneeId = form.assigneeId.value;
  const baseYmd = form.base.value || ymdString(new Date());
  const cat = TASK_TEMPLATES[Number(form.catIndex.value)];
  const indices = [...form.querySelectorAll('input[name="tplTask"]:checked')].map((c) => Number(c.value));
  if (indices.length === 0) {
    showToast('タスクが1つも選ばれていません', 'error');
    return;
  }
  const data = adminState.data;
  const nums = data.tasks.map((t) => parseInt(String(t.id).replace(/\D/g, ''), 10) || 0);
  const startNum = Math.max(0, ...nums) + 1;
  const newTasks = indices.map((idx, i) => ({
    id: `t${startNum + i}`,
    projectId,
    title: cat.tasks[idx].title,
    assigneeId,
    due: addDays(baseYmd, cat.tasks[idx].offset),
    status: '未着手',
    priority: cat.tasks[idx].priority
  }));
  setData({ ...data, tasks: [...data.tasks, ...newTasks] });
  showToast(`${newTasks.length}件のタスクを追加しました`, 'success');
}

function tokenForm() {
  const has = Boolean(getToken());
  openModal(`
    <h3>GitHubトークン設定</h3>
    <div class="field">
      <label>Personal Access Token</label>
      <input type="password" id="tokenInput" placeholder="${has ? '設定済み（変更する場合のみ入力）' : 'github_pat_… または ghp_…'}" autocomplete="off">
      <p class="note">
        保存にはこのリポジトリ（${escapeHtml(CONFIG.github.owner)}/${escapeHtml(CONFIG.github.repo)}）の
        Contents 書き込み権限を持つ Fine-grained PAT が必要です。<br>
        GitHub → Settings → Developer settings → Fine-grained tokens で発行できます。
        トークンはこのブラウザにのみ保存されます。
      </p>
      <p class="token-status ${has ? 'ok' : 'ng'}">${has ? '● トークン設定済み' : '● 未設定（保存できません）'}</p>
    </div>
    <div class="modal-foot">
      ${has ? '<button type="button" class="btn btn--danger" id="tokenClear">削除</button>' : ''}
      <button type="button" class="btn btn--ghost" data-close>閉じる</button>
      <button type="button" class="btn btn--primary" id="tokenSave">保存</button>
    </div>`);
  document.getElementById('tokenSave').addEventListener('click', () => {
    const v = document.getElementById('tokenInput').value.trim();
    if (v) setToken(v);
    closeModal();
    showToast('トークンを保存しました', 'success');
  });
  const clearBtn = document.getElementById('tokenClear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    setToken('');
    closeModal();
    showToast('トークンを削除しました');
  });
}

/* ---------- フォーム保存 ---------- */

function readForm(form) {
  const fd = new FormData(form);
  const obj = {};
  fd.forEach((value, key) => {
    if (key === 'memberIds') return;
    obj[key] = String(value).trim();
  });
  obj.memberIds = [...form.querySelectorAll('input[name="memberIds"]:checked')].map((c) => c.value);
  return obj;
}

function applyForm(kind, id, values) {
  const data = adminState.data;
  if (kind === 'project') {
    const entry = {
      id: id || newId('p', data.projects),
      name: values.name, client: values.client, status: values.status,
      start: values.start, end: values.end, memberIds: values.memberIds,
      description: values.description
    };
    const projects = id
      ? data.projects.map((p) => (p.id === id ? entry : p))
      : [...data.projects, entry];
    setData({ ...data, projects });
  }
  if (kind === 'task') {
    const entry = {
      id: id || newId('t', data.tasks),
      projectId: values.projectId, title: values.title, assigneeId: values.assigneeId,
      due: values.due, status: values.status, priority: values.priority
    };
    const tasks = id
      ? data.tasks.map((t) => (t.id === id ? entry : t))
      : [...data.tasks, entry];
    setData({ ...data, tasks });
  }
  if (kind === 'member') {
    const entry = { id: id || newId('m', data.members), name: values.name, role: values.role, color: safeColor(values.color) };
    const members = id
      ? data.members.map((m) => (m.id === id ? entry : m))
      : [...data.members, entry];
    setData({ ...data, members });
  }
}

/* ---------- 削除 ---------- */

function deleteEntity(kind, id) {
  const data = adminState.data;
  if (kind === 'project') {
    const target = projectById(data, id);
    const related = tasksOfProject(data, id).length;
    if (!confirm(`案件「${target?.name}」を削除しますか？\n紐づくタスク ${related} 件も削除されます。`)) return;
    setData({
      ...data,
      projects: data.projects.filter((p) => p.id !== id),
      tasks: data.tasks.filter((t) => t.projectId !== id)
    });
  }
  if (kind === 'task') {
    const target = data.tasks.find((t) => t.id === id);
    if (!confirm(`タスク「${target?.title}」を削除しますか？`)) return;
    setData({ ...data, tasks: data.tasks.filter((t) => t.id !== id) });
  }
  if (kind === 'member') {
    const target = memberById(data, id);
    if (!confirm(`メンバー「${target?.name}」を削除しますか？\n担当タスクは未割当になります。`)) return;
    setData({
      ...data,
      members: data.members.filter((m) => m.id !== id),
      tasks: data.tasks.map((t) => (t.assigneeId === id ? { ...t, assigneeId: '' } : t)),
      projects: data.projects.map((p) => ({ ...p, memberIds: p.memberIds.filter((mid) => mid !== id) }))
    });
  }
}

/* ---------- 保存・入出力 ---------- */

async function handleSave() {
  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.textContent = '保存中…';
  try {
    const saved = await saveDataToGitHub(adminState.data);
    adminState.data = saved;
    adminState.dirty = false;
    localStorage.removeItem(CONFIG.storageKeys.draft);
    document.getElementById('dirtyDot').classList.remove('on');
    showToast('GitHubに保存しました。閲覧画面に反映されます。', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'GitHubに保存';
  }
}

function handleExport() {
  const blob = new Blob([JSON.stringify(adminState.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `tundeinc-data-${new Date().toISOString().slice(0, 10)}.json` });
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(String(reader.result));
      if (!isValidData(json)) {
        throw new Error('形式が不正です');
      }
      const sanitized = {
        ...json,
        members: json.members.map((m) => ({ ...m, color: safeColor(m.color) }))
      };
      setData(sanitized);
      showToast('JSONを読み込みました。「GitHubに保存」で反映されます。', 'success');
    } catch (error) {
      showToast(`読み込み失敗：${error.message}`, 'error');
    }
  };
  reader.readAsText(file);
}

/* ---------- イベント ---------- */

function bindAdminEvents() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('on'));
      tab.classList.add('on');
      adminState.tab = tab.dataset.tab;
      renderAdmin();
    });
  });

  document.getElementById('adminApp').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.add === 'project') projectForm(null);
    if (btn.dataset.add === 'task') taskForm(null);
    if (btn.dataset.add === 'member') memberForm(null);
    if (btn.dataset.add === 'template') templateForm();
    if (btn.dataset.editProject) projectForm(projectById(adminState.data, btn.dataset.editProject));
    if (btn.dataset.editTask) taskForm(adminState.data.tasks.find((t) => t.id === btn.dataset.editTask));
    if (btn.dataset.editMember) memberForm(memberById(adminState.data, btn.dataset.editMember));
    if (btn.dataset.delProject) deleteEntity('project', btn.dataset.delProject);
    if (btn.dataset.delTask) deleteEntity('task', btn.dataset.delTask);
    if (btn.dataset.delMember) deleteEntity('member', btn.dataset.delMember);
  });

  document.getElementById('modalWrap').addEventListener('click', (e) => {
    if (e.target.id === 'modalWrap' || e.target.closest('[data-close]')) {
      closeModal();
      return;
    }
  });

  document.getElementById('modalBody').addEventListener('submit', (e) => {
    const form = e.target.closest('#modalForm');
    if (!form) return;
    e.preventDefault();
    if (form.dataset.kind === 'template') {
      applyTemplateForm(form);
    } else {
      applyForm(form.dataset.kind, form.dataset.id, readForm(form));
    }
    closeModal();
  });

  document.getElementById('btnSave').addEventListener('click', handleSave);
  document.getElementById('btnToken').addEventListener('click', tokenForm);
  document.getElementById('btnExport').addEventListener('click', handleExport);
  document.getElementById('btnImport').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) handleImport(e.target.files[0]);
    e.target.value = '';
  });

  window.addEventListener('beforeunload', (e) => {
    if (adminState.dirty) e.preventDefault();
  });
}

/* ---------- 初期化 ---------- */

async function initAdmin() {
  bindAdminEvents();
  try {
    const remote = await loadData();
    const draftRaw = localStorage.getItem(CONFIG.storageKeys.draft);
    if (draftRaw && confirm('保存されていない下書きがあります。復元しますか？\n（キャンセルすると下書きは破棄され最新データを表示します）')) {
      adminState.data = JSON.parse(draftRaw);
      adminState.dirty = true;
      document.getElementById('dirtyDot').classList.add('on');
      renderAdmin();
    } else {
      localStorage.removeItem(CONFIG.storageKeys.draft);
      setData(remote, false);
    }
  } catch (error) {
    document.getElementById('adminApp').innerHTML = '<div class="empty-note">データの読み込みに失敗しました。再読み込みしてください。</div>';
  }
}

initAdmin();
