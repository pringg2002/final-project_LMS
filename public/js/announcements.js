function afterCourseLoaded(course) {
  const me = getUser() || {};
  const canManage = me.role === 'admin' || (me.role === 'instructor' && course.instructor_id === me.user_id);
  const box = document.getElementById('announcements');
  const form = document.getElementById('announcement-form');
  form.hidden = !canManage;

  async function load() {
    try {
      const list = await api(`/api/courses/${course.course_id}/announcements`);
      box.innerHTML = list.length
        ? list.map((a) => `
          <div class="notif"><div><strong>${esc(a.title)}</strong> ${canManage ? statusBadge(a.status) : ''}
            <small>${esc(a.author_name)} · ${new Date(a.published_at || a.created_at).toLocaleString()}</small>
            <div style="font-weight:400;margin-top:4px;white-space:pre-wrap">${esc(a.content)}</div></div>
            ${canManage ? `<button class="small danger" data-del-ann="${a.announcement_id}">Delete</button>` : ''}</div>`).join('')
        : '<p class="empty">No announcements.</p>';
    } catch (err) { box.innerHTML = `<p class="empty">${esc(err.message)}</p>`; }
  }

  box.onclick = async (e) => {
    const id = e.target.dataset.delAnn;
    if (!id) return;
    try { await api(`/api/announcements/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { showMessage(document.getElementById('msg'), err.message); }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/courses/${course.course_id}/announcements`, { method: 'POST', body: {
        title: form.title.value, content: form.content.value } });
      form.reset(); load();
    } catch (err) { showMessage(document.getElementById('msg'), err.message); }
  };
  load();
}
