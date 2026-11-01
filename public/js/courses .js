requireLogin();
renderTopbar();

const coursesEl = document.getElementById('courses');
const msgEl = document.getElementById('msg');
const me = getUser() || {};

async function loadCourses() {
  try {
    const courses = await api('/api/courses');
    coursesEl.innerHTML = courses.length
      ? courses.map((c) => `
        <div class="card">
          <div class="row between"><strong>${esc(c.course_code)}</strong>${statusBadge(c.status)}</div>
          <div>${esc(c.course_name)}</div>
          <div class="muted">${esc(c.description || '')}</div>
          <div class="muted">Instructor: ${esc(c.instructor_name)}</div>
          <div class="row">
            <a class="btn small" href="courses.html?id=${c.course_id}">Open</a>
            ${isStaffUser() && (me.role === 'admin' || c.instructor_id === me.user_id)
              ? `<button class="small danger" data-del="${c.course_id}">Delete</button>` : ''}
            <span data-enroll-slot="${c.course_id}"></span>
          </div>
        </div>`).join('')
      : '<p class="empty">No courses yet.</p>';
    if (typeof afterCoursesRendered === 'function') afterCoursesRendered(courses);
  } catch (err) { showMessage(msgEl, err.message); }
}

coursesEl.addEventListener('click', async (e) => {
  const id = e.target.dataset.del;
  if (!id || !confirm('Delete this course and everything inside it?')) return;
  try { await api(`/api/courses/${id}`, { method: 'DELETE' }); loadCourses(); }
  catch (err) { showMessage(msgEl, err.message); }
});

if (isStaffUser()) {
  document.getElementById('create-card').hidden = false;
  document.getElementById('course-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/courses', { method: 'POST', body: {
        course_code: document.getElementById('code').value,
        course_name: document.getElementById('name').value,
        description: document.getElementById('desc').value,
        status: document.getElementById('status').value,
      } });
      e.target.reset();
      showMessage(msgEl, 'Course created.', 'ok');
      loadCourses();
    } catch (err) { showMessage(msgEl, err.message); }
  });
}

loadCourses();
