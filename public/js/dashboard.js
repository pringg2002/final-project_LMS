requireLogin();

const $ = id => document.getElementById(id);
const me = getUser() || {};
const role = me.role;

const fmt = x => esc(x ?? '');

function stat(label, value) {
  return `
    <div class="stat">
      <span class="stat-value">${fmt(value)}</span>
      <span class="stat-label">${fmt(label)}</span>
    </div>
  `;
}

function actions(items) {
  $('quick-actions').innerHTML = items
    .map(([name, url]) => `
      <a href="${url}">${esc(name)}</a>
    `)
    .join('');
}

function displayCourses(courses) {
  $('dashboard-courses').innerHTML = courses.length
    ? courses.map(c => `
        <div class="dashboard-course">
          <a href="courses.html?id=${Number(c.course_id)}">
            <strong>
              ${esc(c.course_code)} —
              ${esc(c.course_name)}
            </strong>
          </a>

          <div class="muted">
            Instructor:
            ${esc(c.instructor_name || 'Not assigned')}
            · ${esc(c.status)}
          </div>
        </div>
      `).join('')
    : '<p class="empty">No courses to show yet.</p>';
}

async function loadDashboard() {
  const profile = await api('/api/auth/me');

  $('name').textContent =
    profile.first_name || 'User';

  $('role').textContent = profile.role;

  $('portal-label').textContent =
    role === 'student'
      ? 'Student Learning Portal'
      : role === 'instructor'
        ? 'Instructor Teaching Portal'
        : 'Administration Portal';

  $('subtitle').textContent =
    role === 'student'
      ? 'Your enrolled courses and learning activities'
      : role === 'instructor'
        ? 'Your courses, students and class activities'
        : 'Manage courses, instructors and enrollments';

  const [courses, enrollments] = await Promise.all([
    api('/api/courses'),
    api('/api/enrollments')
  ]);

  displayCourses(courses);

  if (role === 'student') {
    $('courses-title').textContent =
      'My Enrolled Courses';

    $('dashboard-stats').innerHTML =
      stat('Enrolled Courses', courses.length) +
      stat(
        'My Enrollments',
        enrollments.filter(e => e.status !== 'dropped').length
      ) +
      stat('Learning', 'In progress');

    actions([
      ['My Courses', 'courses.html'],
      ['My Assignments', 'assignments.html'],
      ['Class Discussions', 'discussions.html']
    ]);

  } else if (role === 'instructor') {
    $('courses-title').textContent =
      'Courses I Handle';

    const active = enrollments.filter(
      e => e.status !== 'dropped'
    );

    $('dashboard-stats').innerHTML =
      stat('Teaching Courses', courses.length) +
      stat(
        'Enrolled Students',
        new Set(active.map(e => e.student_id)).size
      ) +
      stat('Active Enrollments', active.length);

    actions([
      ['My Teaching Courses', 'courses.html'],
      ['Create Announcements', 'courses.html'],
      ['Assignments and Grading', 'assignments.html'],
      ['Class Discussions', 'discussions.html']
    ]);

    $('class-section').hidden = false;

    $('class-list').innerHTML = active.length
      ? `
        <table class="list">
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Status</th>
          </tr>

          ${active.map(e => `
            <tr>
              <td>${fmt(e.student_name)}</td>
              <td>
                ${fmt(e.course_code)} —
                ${fmt(e.course_name)}
              </td>
              <td>${fmt(e.status)}</td>
            </tr>
          `).join('')}
        </table>
      `
      : '<p class="empty">No enrolled students yet.</p>';

  } else if (role === 'admin') {
    $('courses-title').textContent =
      'All Courses';

    const users = await api('/api/users');

    $('dashboard-stats').innerHTML =
      stat('Users', users.length) +
      stat(
        'Instructors',
        users.filter(u => u.role === 'instructor').length
      ) +
      stat('Courses', courses.length);

    actions([
      ['Manage Users', '#admin-tools'],
      ['Create Course', '#admin-tools'],
      ['Enroll Students', '#admin-tools'],
      ['View Courses', 'courses.html']
    ]);

    $('admin-tools').hidden = false;

    initializeAdmin(users, courses, enrollments);
  }
}

async function loadNotifications() {
  const list = await api('/api/notifications');

  const unread = list.filter(
    n => !Number(n.is_read)
  ).length;

  $('unread-count').textContent = unread;

  $('notifications').innerHTML = list.length
    ? list.map(n => `
        <div class="notif ${Number(n.is_read) ? '' : 'unread'}">
          <div>
            <strong>${fmt(n.title)}</strong>

            <small>
              ${fmt(n.message)}
              · ${new Date(n.created_at).toLocaleString()}
            </small>
          </div>

          <div class="row">
            ${Number(n.is_read)
              ? ''
              : `
                <button
                  class="secondary small"
                  data-read="${Number(n.notification_id)}"
                >
                  Read
                </button>
              `
            }

            <button
              class="secondary small"
              data-del="${Number(n.notification_id)}"
            >
              Delete
            </button>
          </div>
        </div>
      `).join('')
    : '<p class="empty">No notifications yet.</p>';

  if (typeof refreshNavNotifications === 'function') {
    refreshNavNotifications();
  }
}

$('notifications').addEventListener('click', async e => {
  const button = e.target.closest('button');
  if (!button) return;

  try {
    if (button.dataset.read) {
      await api(
        `/api/notifications/${button.dataset.read}/read`,
        { method: 'PUT' }
      );
    }

    if (button.dataset.del) {
      await api(
        `/api/notifications/${button.dataset.del}`,
        { method: 'DELETE' }
      );
    }

    await loadNotifications();
  } catch (error) {
    alert(error.message);
  }
});

$('read-all').addEventListener('click', async () => {
  try {
    await api('/api/notifications/read-all', {
      method: 'PUT'
    });

    await loadNotifications();
  } catch (error) {
    alert(error.message);
  }
});

function initializeAdmin(users, courses, enrollments) {
  const instructors = users.filter(
    u => u.role === 'instructor' &&
      u.status === 'active'
  );

  const students = users.filter(
    u => u.role === 'student' &&
      u.status === 'active'
  );

  const option = (id, label) => `
    <option value="${Number(id)}">
      ${fmt(label)}
    </option>
  `;

  $('reset-user-select').innerHTML = users
    .filter(u => u.user_id !== me.user_id)
    .map(u =>
      option(
        u.user_id,
        `${u.first_name} ${u.last_name} (${u.role})`
      )
    )
    .join('');

  $('change-role-user-select').innerHTML = users
    .filter(
      u => u.role === 'student' ||
        u.role === 'instructor'
    )
    .map(u =>
      option(
        u.user_id,
        `${u.first_name} ${u.last_name} (${u.role})`
      )
    )
    .join('');

  $('instructor-select').innerHTML = instructors
    .map(u =>
      option(
        u.user_id,
        `${u.first_name} ${u.last_name}`
      )
    )
    .join('');

  $('student-select').innerHTML = students
    .map(u =>
      option(
        u.user_id,
        `${u.first_name} ${u.last_name}`
      )
    )
    .join('');

  $('course-select').innerHTML = courses
    .map(c =>
      option(
        c.course_id,
        `${c.course_code} — ${c.course_name}`
      )
    )
    .join('');

  $('admin-course-list').innerHTML = courses.length
    ? `
      <table class="list">
        <tr>
          <th>Course</th>
          <th>Instructor</th>
          <th>Change Instructor</th>
        </tr>

        ${courses.map(c => `
          <tr>
            <td>
              ${fmt(c.course_code)} —
              ${fmt(c.course_name)}
            </td>

            <td>${fmt(c.instructor_name)}</td>

            <td>
              <form
                data-reassign="${Number(c.course_id)}"
                class="row"
              >
                <select
                  name="instructor_id"
                  style="max-width:230px"
                >
                  ${instructors.map(u => `
                    <option
                      value="${Number(u.user_id)}"
                      ${Number(u.user_id) === Number(c.instructor_id)
                        ? 'selected'
                        : ''}
                    >
                      ${fmt(u.first_name)}
                      ${fmt(u.last_name)}
                    </option>
                  `).join('')}
                </select>

                <button class="small">
                  Save
                </button>
              </form>
            </td>
          </tr>
        `).join('')}
      </table>
    `
    : '<p class="empty">No courses.</p>';

  $('admin-enrollments').innerHTML = enrollments.length
    ? `
      <table class="list">
        <tr>
          <th>Student</th>
          <th>Course</th>
          <th>Status</th>
          <th>Action</th>
        </tr>

        ${enrollments.map(e => `
          <tr>
            <td>${fmt(e.student_name)}</td>
            <td>${fmt(e.course_code)}</td>
            <td>${fmt(e.status)}</td>

            <td>
              <button
                class="small secondary"
                data-drop-enrollment="${Number(e.enrollment_id)}"
              >
                ${e.status === 'dropped'
                  ? 'Dropped'
                  : 'Drop'}
              </button>
            </td>
          </tr>
        `).join('')}
      </table>
    `
    : '<p class="empty">No enrollments.</p>';
}

async function adminRequest(path, method, body, message) {
  try {
    await api(path, { method, body });

    showMessage(
      $('admin-message'),
      message,
      'ok'
    );

    await loadDashboard();
  } catch (error) {
    showMessage(
      $('admin-message'),
      error.message
    );
  }
}

$('create-user-form').addEventListener('submit', async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const resultBox = $('generated-password-result');

  resultBox.hidden = true;

  try {
    const created = await api('/api/users', {
      method: 'POST',
      body: Object.fromEntries(new FormData(form))
    });

    if (!created?.temporary_password) {
      throw new Error(
        'Account created, but no temporary password was returned. Contact your developer.'
      );
    }

    $('generated-password-text').textContent =
      created.temporary_password;

    resultBox.hidden = false;

    showMessage(
      $('admin-message'),
      'User created. Copy the temporary password before leaving this page.',
      'ok'
    );

    form.reset();
    await loadDashboard();

  } catch (error) {
    showMessage(
      $('admin-message'),
      error.message
    );
  }
});

$('copy-generated-password').addEventListener(
  'click',
  async () => {
    try {
      await navigator.clipboard.writeText(
        $('generated-password-text').textContent
      );
    } catch {
      alert(
        'Copy manually from the password displayed above.'
      );
    }
  }
);

$('change-role-form').addEventListener('submit', async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));

  if (!confirm(
    'Change this user’s role? Their existing course or enrollment records may need review.'
  )) {
    return;
  }

  await adminRequest(
    `/api/users/${Number(data.user_id)}`,
    'PUT',
    { role: data.role },
    'User role updated. Existing sessions have been invalidated.'
  );
});

$('reset-password-form').addEventListener('submit', async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));

  await adminRequest(
    `/api/users/${Number(data.user_id)}/reset-password`,
    'POST',
    { password: data.password },
    'Temporary password assigned. User must change it at next login.'
  );

  form.reset();
});

$('create-course-form').addEventListener('submit', async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));

  data.instructor_id = Number(data.instructor_id);

  await adminRequest(
    '/api/courses',
    'POST',
    data,
    'Course created.'
  );
});

$('enroll-student-form').addEventListener('submit', async e => {
  e.preventDefault();

  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));

  await adminRequest(
    '/api/enrollments',
    'POST',
    {
      student_id: Number(data.student_id),
      course_id: Number(data.course_id)
    },
    'Student enrolled.'
  );
});

$('admin-course-list').addEventListener('submit', async e => {
  const form = e.target.closest('form[data-reassign]');
  if (!form) return;

  e.preventDefault();

  await adminRequest(
    `/api/courses/${form.dataset.reassign}`,
    'PUT',
    {
      instructor_id: Number(
        new FormData(form).get('instructor_id')
      )
    },
    'Instructor assigned.'
  );
});

$('admin-enrollments').addEventListener('click', async e => {
  const button = e.target.closest(
    '[data-drop-enrollment]'
  );

  if (!button) return;

  if (!confirm('Drop this enrollment?')) {
    return;
  }

  await adminRequest(
    `/api/enrollments/${button.dataset.dropEnrollment}`,
    'PUT',
    { status: 'dropped' },
    'Enrollment dropped.'
  );
});

loadDashboard().catch(error => {
  $('dashboard-courses').textContent = error.message;
});

loadNotifications().catch(error => {
  $('notifications').textContent = error.message;
});