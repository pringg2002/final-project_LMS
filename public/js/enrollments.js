let myEnrollments = [];

async function afterCoursesRendered(courses) {
  if (isStaffUser()) return;
  try { myEnrollments = await api('/api/enrollments'); } catch (e) { return; }
  for (const c of courses) {
    const slot = document.querySelector(`[data-enroll-slot="${c.course_id}"]`);
    if (!slot) continue;
    const e = myEnrollments.find((x) => x.course_id === c.course_id && x.status !== 'dropped');
    slot.innerHTML = e
      ? `<span class="badge pill-ok">${esc(e.status)}</span> <button class="small secondary" data-drop="${e.enrollment_id}">Drop</button>`
      : `<button class="small" data-enroll="${c.course_id}">Enroll</button>`;
  }
}

document.getElementById('courses').addEventListener('click', async (ev) => {
  const t = ev.target;
  try {
    if (t.dataset.enroll) await api('/api/enrollments', { method: 'POST', body: { course_id: Number(t.dataset.enroll) } });
    else if (t.dataset.drop) {
      if (!confirm('Drop this course?')) return;
      await api(`/api/enrollments/${t.dataset.drop}`, { method: 'PUT', body: { status: 'dropped' } });
    } else return;
    loadCourses();
  } catch (err) { showMessage(document.getElementById('msg'), err.message); }
});
