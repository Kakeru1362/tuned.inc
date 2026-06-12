// 共通の描画ヘルパー

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.appendChild(child));
  return node;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function statusBadge(status) {
  const map = {
    '進行中': 'badge--active',
    '計画中': 'badge--plan',
    '保留': 'badge--hold',
    '完了': 'badge--done',
    '未着手': 'badge--todo'
  };
  return `<span class="badge ${map[status] || ''}">${escapeHtml(status)}</span>`;
}

function priorityMark(priority) {
  const map = { '高': 'prio--high', '中': 'prio--mid', '低': 'prio--low' };
  return `<span class="prio ${map[priority] || ''}">${escapeHtml(priority)}</span>`;
}

function avatarHtml(member, size = '') {
  if (!member) return `<span class="avatar avatar--empty ${size}">？</span>`;
  const initial = member.name.trim().charAt(0);
  return `<span class="avatar ${size}" style="--av:${member.color}" title="${escapeHtml(member.name)}">${escapeHtml(initial)}</span>`;
}

function dueLabel(task) {
  if (task.status === '完了') {
    return `<span class="due due--done">${formatDate(task.due)}</span>`;
  }
  const d = daysUntil(task.due);
  if (d < 0) return `<span class="due due--over">${formatDate(task.due)} ／ ${Math.abs(d)}日超過</span>`;
  if (d === 0) return `<span class="due due--today">${formatDate(task.due)} ／ 本日</span>`;
  if (d <= CONFIG.dueSoonDays) return `<span class="due due--soon">${formatDate(task.due)} ／ あと${d}日</span>`;
  return `<span class="due">${formatDate(task.due)} ／ あと${d}日</span>`;
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = el('div', { class: `toast toast--${type}`, text: message });
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast--show'), 10);
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 3600);
}
