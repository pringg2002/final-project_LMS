requireLogin();
if (getUser()?.role !== 'admin') {
  location.replace('dashboard.html');
} else {
  document.getElementById('admin-tools').hidden = false;
}
const $ = id => document.getElementById(id);
const me = getUser() || {};
const fmt = x => esc(x ?? '');

const middleNameInput = $('middle-name');
const noMiddleNameCheckbox = $('no-middle-name');

if (middleNameInput && noMiddleNameCheckbox) {
  noMiddleNameCheckbox.addEventListener('change', () => {
    if (noMiddleNameCheckbox.checked) {
      middleNameInput.value = '';
      middleNameInput.disabled = true;
    } else {
      middleNameInput.disabled = false;
    }
  });
}

async function loadManageData() {
  if (getUser()?.role !== 'admin') return;
  const [users, courses, enrollments] = await Promise.all([
    api('/api/users'), api('/api/courses'), api('/api/enrollments')
  ]);
  initializeAdmin(users, courses, enrollments);
}

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

    await loadManageData();
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
    const data = Object.fromEntries(new FormData(form));

    data.middle_name = noMiddleNameCheckbox?.checked
      ? null
      : String(data.middle_name || '').trim() || null;

    const created = await api('/api/users', {
      method: 'POST',
      body: data
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

    if (middleNameInput) {
      middleNameInput.disabled = false;
      middleNameInput.value = '';
    }

    await loadManageData();

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


if (getUser()?.role === 'admin') {
  loadManageData().catch(error => showMessage($('admin-message'), error.message));
}