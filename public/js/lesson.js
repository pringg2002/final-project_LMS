function initCoursePageLessons() {
  moduleRenderHooks.push(async (modules) => {
    const staff = isStaffUser();
    const done = new Set();
    if (!staff) {
      try {
        (await api('/api/progress/me')).forEach((p) => p.status === 'completed' && done.add(p.lesson_id));
      } catch (e) { /* progress is optional here */ }
    }

    for (const m of modules) {
      const slot = document.querySelector(`[data-module-extras="${m.module_id}"]`);
      if (!slot) continue;
      let lessons = [];
      try { lessons = await api(`/api/modules/${m.module_id}/lessons`); } catch (e) { /* locked or hidden */ }

      slot.insertAdjacentHTML('beforeend', `
        <div class="lessons" style="margin-top:8px">
          <strong>Lessons</strong>
          ${lessons.length ? `<ul style="margin:6px 0 0 18px;padding:0">${lessons.map((l) => `
            <li><a href="lesson.html?id=${l.lesson_id}">${esc(l.title)}</a>
              ${l.estimated_minutes ? `<span class="muted">(${l.estimated_minutes} min)</span>` : ''}
              ${done.has(l.lesson_id) ? '<span class="badge pill-ok">completed</span>' : ''}
              ${staff ? statusBadge(l.status) : ''}</li>`).join('')}</ul>`
            : '<div class="muted">No lessons yet.</div>'}
          ${staff ? `
          <form class="row" data-lesson-form="${m.module_id}" style="margin-top:8px">
            <input name="title" placeholder="New lesson title" required style="flex:2;min-width:160px">
            <input name="minutes" type="number" min="0" placeholder="min" style="width:80px">
            <select name="status" style="width:auto"><option value="published">published</option><option value="draft">draft</option></select>
            <button class="small" type="submit">Add lesson</button>
          </form>` : ''}
        </div>`);
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-lesson-form]');
    if (!form) return;
    e.preventDefault();
    try {
      await api(`/api/modules/${form.dataset.lessonForm}/lessons`, { method: 'POST', body: {
        title: form.title.value,
        estimated_minutes: form.minutes.value === '' ? undefined : Number(form.minutes.value),
        status: form.status.value,
        content: 'Write the lesson content here (edit on the lesson page).',
      } });
      loadModules();
    } catch (err) { showMessage(document.getElementById('msg'), err.message); }
  });
}

function initLessonPage() {
  requireLogin();
  renderTopbar();

  const lessonId = qs('id');
  const $ = (id) => document.getElementById(id);
  const msgEl = $('msg');
  let lesson = null;

  async function load() {
    lesson = await api(`/api/lessons/${lessonId}`);
    $('title').textContent = lesson.title;
    $('meta').textContent = lesson.estimated_minutes ? `About ${lesson.estimated_minutes} minutes` : '';
    $('content').textContent = lesson.content || 'No content yet.';
    const mod = await api(`/api/modules/${lesson.module_id}`);
    $('back').href = `courses.html?id=${mod.course_id}`;
    loadResources();

    if (isStaffUser()) {
      $('resource-form').hidden = false;
      $('edit-card').hidden = false;
      $('e-title').value = lesson.title;
      $('e-content').value = lesson.content || '';
      $('e-status').value = lesson.status;
    } else {
      $('progress-card').hidden = false;
      loadProgress();
      api('/api/progress', { method: 'POST', body: { lesson_id: Number(lessonId), status: 'in_progress' } }).catch(() => {});
    }
  }

  async function loadResources() {
    const list = await api(`/api/lessons/${lessonId}/resources`);
    $('resources').innerHTML = list.length
      ? `<ul style="margin:0;padding-left:18px">${list.map((r) => `
          <li><a href="${esc(r.resource_url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>
            ${statusBadge(r.resource_type)}
            ${isStaffUser() ? `<a href="#" data-del-resource="${r.resource_id}">remove</a>` : ''}</li>`).join('')}</ul>`
      : '<p class="empty">No resources for this lesson.</p>';
  }

  async function loadProgress() {
    const p = await api(`/api/lessons/${lessonId}/progress`);
    const completed = p && p.status === 'completed';
    $('progress-text').textContent = completed ? 'Completed. Nice work!' : 'Not completed yet.';
    $('complete-btn').hidden = completed;
  }

  $('complete-btn').addEventListener('click', async () => {
    try {
      await api('/api/progress', { method: 'POST', body: { lesson_id: Number(lessonId), status: 'completed' } });
      await loadProgress();
      if (typeof afterLessonCompleted === 'function') afterLessonCompleted();
    } catch (err) { showMessage(msgEl, err.message); }
  });

  $('resources').addEventListener('click', async (e) => {
    const id = e.target.dataset.delResource;
    if (!id) return;
    e.preventDefault();
    try { await api(`/api/resources/${id}`, { method: 'DELETE' }); loadResources(); }
    catch (err) { showMessage(msgEl, err.message); }
  });

  $('resource-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api(`/api/lessons/${lessonId}/resources`, { method: 'POST', body: {
        title: f.title.value, resource_type: f.type.value, resource_url: f.url.value } });
      f.reset(); loadResources();
    } catch (err) { showMessage(msgEl, err.message); }
  });

  $('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api(`/api/lessons/${lessonId}`, { method: 'PUT', body: {
        title: $('e-title').value, content: $('e-content').value, status: $('e-status').value } });
      showMessage(msgEl, 'Lesson saved.', 'ok');
      load();
    } catch (err) { showMessage(msgEl, err.message); }
  });

  $('delete-lesson').addEventListener('click', async () => {
    if (!confirm('Delete this lesson?')) return;
    try { await api(`/api/lessons/${lessonId}`, { method: 'DELETE' }); window.location.href = $('back').href; }
    catch (err) { showMessage(msgEl, err.message); }
  });

  if (!lessonId) window.location.href = 'courses.html';
  else load().catch((err) => showMessage(msgEl, err.message));
}

if (document.getElementById('modules')) initCoursePageLessons();
if (document.getElementById('resource-form')) initLessonPage();
