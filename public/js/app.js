const TOKEN_KEY = 'lms_token';
const USER_KEY = 'lms_user';

const getToken = () => localStorage.getItem(TOKEN_KEY);

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
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
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;

  try {
    json = await res.json();
  } catch {

  }


  if (
    res.status === 401 &&
    !path.startsWith('/api/auth/login')
  ) {
    clearSession();

    location.href = 'login.html';

    throw new Error(
      'Session expired. Please log in again.'
    );
  }

  if (
    res.status === 403 &&
    json?.message?.includes('Password change required')
  ) {
    location.replace('change-password.html');

    throw new Error(json.message);
  }

  if (
    !res.ok ||
    !json ||
    json.success === false
  ) {
    throw new Error(
      json?.message || `Request failed (${res.status})`
    );
  }

  return json.data;
}


function requireLogin() {
  if (!getToken()) {
    location.href = 'login.html';
    return;
  }

  if (
    getUser()?.must_change_password &&
    !location.pathname.endsWith('/change-password.html')
  ) {
    location.replace('change-password.html');
  }
}

function requireLearningRole() {
  if ((getUser() || {}).role === 'admin') {
    location.replace('dashboard.html');
    return false;
  }

  return true;
}

function showMessage(el, text, type = 'error') {
  if (!el) return;

  el.textContent = text;
  el.className = `msg ${type}`;
}

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const isStaffUser = () =>
  ['admin', 'instructor'].includes(
    (getUser() || {}).role
  );

const isInstructorUser = () =>
  (getUser() || {}).role === 'instructor';

const qs = name =>
  new URLSearchParams(location.search).get(name);

const statusBadge = s =>
  `<span class="badge">${esc(s)}</span>`;

const moduleRenderHooks = [];


function getActiveNavGroup() {
  const page =
    location.pathname.split('/').pop() || 'dashboard.html';

  if (page === 'manage.html') {
    return 'admin';
  }

  if (page === 'profile.html') {
    return 'profile';
  }

  if (page === 'change-password.html') {
    return 'password';
  }

  if (
    [
      'lesson.html',
      'quiz.html',
      'courses.html'
    ].includes(page)
  ) {
    return 'courses';
  }

  if (page === 'assignments.html') {
    return 'assignments';
  }

  if (page === 'discussions.html') {
    return 'discussions';
  }

  if (
    page === 'dashboard.html' &&
    location.hash === '#admin-tools'
  ) {
    return 'admin';
  }

  return 'dashboard';
}

function highlightActiveTab() {
  const group = getActiveNavGroup();

  document
    .querySelectorAll('#topbar a[data-nav]')
    .forEach(link => {
      const active = link.dataset.nav === group;

      link.classList.toggle('active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
}

function renderTopbar() {
  const el = document.getElementById('topbar');

  if (!el) return;

  const u = getUser() || {};

  const links = [
    [
      'dashboard',
      'Dashboard',
      'dashboard.html'
    ],
    [
      'courses',
      u.role === 'instructor'
        ? 'My Teaching Courses'
        : 'Courses',
      'courses.html'
    ]
  ];

  if (u.role !== 'admin') {
    links.push(
      [
        'assignments',
        'Assignments',
        'assignments.html'
      ],
      [
        'discussions',
        'Discussions',
        'discussions.html'
      ]
    );
  }

  if (u.role === 'admin') {
    links.push([
      'admin',
      'Manage',
      'manage.html'
    ]);
  }

  el.className = 'topbar';

  el.innerHTML = `
    <!-- SYSTEM BRAND -->
    <a
      class="brand"
      href="dashboard.html"
    >
      Learning Module System
    </a>

    <!-- MAIN NAVIGATION -->
    <nav aria-label="Main navigation">

      ${links.map(([id, label, url]) => `
        <a
          href="${url}"
          data-nav="${id}"
        >
          ${esc(label)}
        </a>
      `).join('')}

      <!-- CHANGE PASSWORD -->
      <a
        href="change-password.html"
        data-nav="password"
      >
        Change Password
      </a>

      <!-- NOTIFICATIONS -->
      <a
        href="dashboard.html#notifications-section"
        class="notification-nav"
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
          />
        </svg>

        <span
          id="nav-unread"
          class="nav-unread"
          hidden
        ></span>
      </a>

      <!-- USER ROLE BADGE -->
      <span class="badge">
        ${esc(u.role || 'guest')}
      </span>

      <!-- PROFILE LINK -->
      <a
        href="profile.html"
        data-nav="profile"
      >
        Profile
      </a>

      <!-- LOGOUT BUTTON -->
      <button
        class="secondary"
        id="logout-btn"
        type="button"
      >
        Log out
      </button>

    </nav>
  `;

  highlightActiveTab();

  const logoutButton =
    document.getElementById('logout-btn');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearSession();
      location.href = 'login.html';
    });
  }

  if (getToken()) {
    refreshNavNotifications();
  }
}

async function refreshNavNotifications() {
  const badge =
    document.getElementById('nav-unread');

  if (!badge) return;

  try {
    const notifications = await api(
      '/api/notifications?unread=true'
    );

    const count = notifications.length;

    badge.textContent =
      count > 99 ? '99+' : count;

    badge.hidden = count === 0;

  } catch {
    badge.hidden = true;
  }
}

window.addEventListener(
  'hashchange',
  highlightActiveTab
);

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    renderTopbar
  );
} else {
  renderTopbar();
}