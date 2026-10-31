requireLogin();
renderTopbar();

const courseId = qs('id');
const msgEl = document.getElementById('msg');
const modulesEl = document.getElementById('modules');
let modules = [];

async function loadCourse() {
  const c = await api(`/api/courses/${courseId}`);
  document.getElementById('course-title').textContent = `${c.course_code} - ${c.course_name}`;
  document.getElementById('course-desc').textContent = c.description || '';
  document.getElementById('course-status').innerHTML = statusBadge(c.status);
  if (typeof afterCourseLoaded === 'function') afterCourseLoaded(c);
}

async function loadModules() {
  modules = await api(`/api/courses/${courseId}/modules`);
  const prereqs = await Promise.all(modules.map((m) => api(`/api/modules/${m.module_id}/prerequisites`)));
  modulesEl.innerHTML = modules.length
    ? modules.map((m, i) => renderModule(m, prereqs[i])).join('')
    : '<p class="empty">No modules yet.</p>';
  for (const hook of moduleRenderHooks) await hook(modules);
}

function renderModule(m, prereqs) {
  const staff = isStaffUser();
  const others = modules.filter((x) => x.module_id !== m.module_id && !prereqs.some((p) => p.prerequisite_module_id === x.module_id));
  return `
  <div class="module" id="module-${m.module_id}">
    <div class="row between">
      <h3>${m.module_order}. ${esc(m.title)}</h3>
      <div class="row">${statusBadge(m.status)}<span class="badge">pass ${Number(m.passing_score)}%</span></div>
    </div>
    <div class="muted">${esc(m.description || '')}</div>
    <div class="muted" style="margin-top:6px">${prereqs.length
      ? 'Requires: ' + prereqs.map((p) => `${esc(p.prerequisite_title)} (${Number(p.minimum_score)}%)${staff ? ` <a href="#" data-rm-prereq="${p.prerequisite_id}">remove</a>` : ''}`).join(', ')
      : 'No prerequisites'}</div>
    <div data-module-extras="${m.module_id}"></div>
    ${staff ? `
    <div class="row" style="margin-top:10px">
      ${others.length ? `<select data-prereq-select="${m.module_id}" style="width:auto">${others.map((o) => `<option value="${o.module_id}">${esc(o.title)}</option>`).join('')}</select>
      <input data-prereq-score="${m.module_id}" type="number" min="0" max="100" value="75" style="width:80px">
      <button class="small" data-add-prereq="${m.module_id}">Add prerequisite</button>` : ''}
      <button class="small secondary" data-toggle="${m.module_id}" data-status="${m.status === 'published' ? 'draft' : 'published'}">${m.status === 'published' ? 'Unpublish' : 'Publish'}</button>
      <button class="small danger" data-del-module="${m.module_id}">Delete</button>
    </div>` : ''}
  </div>`;
}

modulesEl.addEventListener('click', async (e) => {
  const t = e.target;
  try {
    if (t.dataset.addPrereq) {
      const id = t.dataset.addPrereq;
      await api(`/api/modules/${id}/prerequisites`, { method: 'POST', body: {
        prerequisite_module_id: Number(document.querySelector(`[data-prereq-select="${id}"]`).value),
        minimum_score: Number(document.querySelector(`[data-prereq-score="${id}"]`).value),
      } });
    } else if (t.dataset.rmPrereq) {
      e.preventDefault();
      await api(`/api/prerequisites/${t.dataset.rmPrereq}`, { method: 'DELETE' });
    } else if (t.dataset.toggle) {
      await api(`/api/modules/${t.dataset.toggle}`, { method: 'PUT', body: { status: t.dataset.status } });
    } else if (t.dataset.delModule) {
      if (!confirm('Delete this module and its content?')) return;
      await api(`/api/modules/${t.dataset.delModule}`, { method: 'DELETE' });
    } else return;
    loadModules();
  } catch (err) { showMessage(msgEl, err.message); }
});

if (isStaffUser()) {
  document.getElementById('add-module-card').hidden = false;
  document.getElementById('module-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api(`/api/courses/${courseId}/modules`, { method: 'POST', body: {
        title: document.getElementById('m-title').value,
        description: document.getElementById('m-desc').value,
        passing_score: Number(document.getElementById('m-score').value),
        status: document.getElementById('m-status').value,
      } });
      e.target.reset();
      loadModules();
    } catch (err) { showMessage(msgEl, err.message); }
  });
}

if (!courseId) window.location.href = 'courses.html';
else loadCourse().then(loadModules).catch((err) => showMessage(msgEl, err.message));
