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
  $('courses-title').textContent = 'All Courses';

  const users = await api('/api/users');

  $('dashboard-stats').innerHTML =
    stat('Users', users.length) +
    stat(
      'Instructors',
      users.filter(u => u.role === 'instructor').length
    ) +
    stat('Courses', courses.length);
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

loadDashboard().catch(error => {
  $('dashboard-courses').textContent = error.message;
});

loadNotifications().catch(error => {
  $('notifications').textContent = error.message;
});