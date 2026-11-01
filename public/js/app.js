const TOKEN_KEY = 'lms_token';
const USER_KEY = 'lms_user';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
};
const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;
  try { json = await res.json(); } catch { /* non-JSON response */ }

  if (res.status === 401 && !path.startsWith('/api/auth/login')) {
    clearSession();
    window.location.href = 'login.html';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok || !json || json.success === false) {
    throw new Error((json && json.message) || `Request failed (${res.status})`);
  }

  return json.data;
}

function requireLogin() {
  if (!getToken()) window.location.href = 'login.html';
}

function showMessage(el, text, type = 'error') {
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${type}`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const isStaffUser = () => ['admin', 'instructor'].includes((getUser() || {}).role);
const qs = (name) => new URLSearchParams(window.location.search).get(name);

function renderTopbar() {
  const el = document.getElementById('topbar');
  if (!el) return;

  const u = getUser() || {};
  el.className = 'topbar';
  el.innerHTML = `
    <a class="brand" href="dashboard.html">Learning Module System</a>
    <nav>
      <a href="dashboard.html">Dashboard</a>
      <a href="courses.html">Courses</a>
      <a href="assignments.html">Assignments</a>
      <a href="discussions.html">Discussions</a>
      <span class="badge">${esc(u.role || 'guest')}</span>
      <button class="secondary" id="logout-btn" type="button">Log out</button>
    </nav>`;

  const logout = document.getElementById('logout-btn');
  if (logout) logout.addEventListener('click', () => {
    clearSession();
    window.location.href = 'login.html';
  });
}

const statusBadge = (s) => `<span class="badge">${esc(s)}</span>`;
const moduleRenderHooks = [];

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderTopbar);
} else {
  renderTopbar();
}
