function initCoursePageLessons() {
  moduleRenderHooks.push(async (modules) => {
    console.log('LESSON HOOK RUNNING:', modules.length);
    const staff = isStaffUser();
    const done = new Set();

    if (!staff) {
      try {
        const progress = await api('/api/progress/me');

        if (Array.isArray(progress)) {
          progress.forEach((p) => {
            if (p.status === 'completed') {
              done.add(Number(p.lesson_id));
            }
          });
        }
      } catch (err) {
        console.error('Unable to load lesson progress:', err);
      }
    }

    for (const module of modules) {
      const moduleId = Number(module.module_id);

      const slot = document.querySelector(
        `[data-module-extras="${moduleId}"]`
      );

      if (!slot) continue;

      let lessons = [];
      let loadError = false;

      try {
        lessons = await api(
          `/api/modules/${moduleId}/lessons`
        );

        if (!Array.isArray(lessons)) {
          lessons = [];
        }
      } catch (err) {
        loadError = true;
        console.error(
          `Unable to load lessons for module ${moduleId}:`,
          err
        );
      }

      const existing = slot.querySelector(
        '[data-lesson-section]'
      );

      if (existing) existing.remove();

      const lessonItems = lessons.map((lesson) => {
        const lessonId = Number(lesson.lesson_id);
        const completed = done.has(lessonId);

        const duration = lesson.estimated_minutes
          ? `<span class="muted">
               (${Number(lesson.estimated_minutes)} min)
             </span>`
          : '';

        const completedBadge = completed
          ? '<span class="badge pill-ok">completed</span>'
          : '';

        const staffBadge = staff
          ? statusBadge(lesson.status)
          : '';

        return `
          <li>
            <a href="lesson.html?id=${lessonId}">
              ${esc(lesson.title)}
            </a>
            ${duration}
            ${completedBadge}
            ${staffBadge}
          </li>
        `;
      }).join('');

      const lessonList = loadError
        ? '<p class="muted">Lessons are unavailable or this module is locked.</p>'
        : lessons.length
          ? `
            <ul style="margin:6px 0 0 18px;padding:0">
              ${lessonItems}
            </ul>
          `
          : '<p class="muted">No lessons yet.</p>';

      const createForm = staff
        ? `
          <form
            class="row"
            data-lesson-form="${moduleId}"
            style="margin-top:8px"
          >
            <input
              name="title"
              placeholder="New lesson title"
              required
              style="flex:2;min-width:160px"
            >

            <input
              name="minutes"
              type="number"
              min="0"
              placeholder="min"
              style="width:80px"
            >

            <select name="status" style="width:auto">
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>

            <button class="small" type="submit">
              Add lesson
            </button>
          </form>
        `
        : '';

      slot.insertAdjacentHTML('beforeend', `
        <div
          class="lessons"
          data-lesson-section
          style="margin-top:8px"
        >
          <strong>Lessons</strong>
          ${lessonList}
          ${createForm}
        </div>
      `);

      console.log('LESSON SECTION INSERTED: ',moduleId);
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target.closest(
      '[data-lesson-form]'
    );

    if (!form) return;

    event.preventDefault();

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      const formData = new FormData(form);
      const moduleId = Number(form.dataset.lessonForm);

      const title = String(
        formData.get('title') || ''
      ).trim();

      const minutes = formData.get('minutes');

      const status = String(
        formData.get('status') || 'published'
      );

      if (!title) {
        throw new Error('Lesson title is required.');
      }

      const body = {
        title,
        status,
        content: 'Write the lesson content here (edit on the lesson page).'
      };

      if (minutes !== '') {
        body.estimated_minutes = Number(minutes);
      }

      await api(
        `/api/modules/${moduleId}/lessons`,
        {
          method: 'POST',
          body
        }
      );

      showMessage(
        document.getElementById('msg'),
        'Lesson created successfully.',
        'ok'
      );

      await loadModules();

    } catch (err) {
      showMessage(
        document.getElementById('msg'),
        err.message
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
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

    $('title').textContent = lesson.title || 'Untitled Lesson';

    $('meta').textContent = lesson.estimated_minutes
      ? `About ${lesson.estimated_minutes} minutes`
      : '';

    $('content').textContent =
      lesson.content || 'No content yet.';

    const module = await api(
      `/api/modules/${lesson.module_id}`
    );

    $('back').href =
      `courses.html?id=${Number(module.course_id)}`;

    await loadResources();

    if (isStaffUser()) {
      $('resource-form').hidden = false;
      $('edit-card').hidden = false;

      $('e-title').value = lesson.title || '';
      $('e-content').value = lesson.content || '';
      $('e-status').value = lesson.status || 'draft';

    } else {
      $('progress-card').hidden = false;

      try {
        await api('/api/progress', {
          method: 'POST',
          body: {
            lesson_id: Number(lessonId),
            status: 'in_progress'
          }
        });
      } catch (err) {
        console.error(
          'Unable to record lesson opening:',
          err
        );
      }

      await loadProgress();
    }
  }

  async function loadResources() {
    const resources = await api(
      `/api/lessons/${lessonId}/resources`
    );

    const list = Array.isArray(resources)
      ? resources
      : [];

    $('resources').innerHTML = list.length
      ? `
        <ul style="margin:0;padding-left:18px">
          ${list.map((resource) => `
            <li>
              <a
                href="${esc(resource.resource_url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                ${esc(resource.title)}
              </a>

              ${statusBadge(resource.resource_type)}

              ${isStaffUser()
                ? `
                  <a
                    href="#"
                    data-del-resource="${Number(resource.resource_id)}"
                  >
                    remove
                  </a>
                `
                : ''}
            </li>
          `).join('')}
        </ul>
      `
      : '<p class="empty">No resources for this lesson.</p>';
  }

  async function loadProgress() {
    const progress = await api(
      `/api/lessons/${lessonId}/progress`
    );

    const completed =
      progress && progress.status === 'completed';

    $('progress-text').textContent = completed
      ? 'Completed. Nice work!'
      : 'Not completed yet.';

    $('complete-btn').hidden = Boolean(completed);
  }

  $('complete-btn').addEventListener('click', async () => {
    const button = $('complete-btn');

    button.disabled = true;

    try {
      await api('/api/progress', {
        method: 'POST',
        body: {
          lesson_id: Number(lessonId),
          status: 'completed'
        }
      });

      await loadProgress();

      showMessage(
        msgEl,
        'Lesson completed successfully!',
        'ok'
      );

      if (typeof window.afterLessonCompleted === 'function') {
        await window.afterLessonCompleted();
      }

    } catch (err) {
      showMessage(msgEl, err.message);
    } finally {
      button.disabled = false;
    }
  });

  $('resources').addEventListener('click', async (event) => {
    const removeLink = event.target.closest(
      '[data-del-resource]'
    );

    if (!removeLink) return;

    event.preventDefault();

    if (!isStaffUser()) return;

    const resourceId = Number(
      removeLink.dataset.delResource
    );

    if (!confirm('Remove this resource?')) return;

    try {
      await api(
        `/api/resources/${resourceId}`,
        { method: 'DELETE' }
      );

      await loadResources();

      showMessage(
        msgEl,
        'Resource removed successfully.',
        'ok'
      );

    } catch (err) {
      showMessage(msgEl, err.message);
    }
  });

  $('resource-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      const formData = new FormData(form);

      const title = String(
        formData.get('title') || ''
      ).trim();

      const resourceType = formData.get('type');
      const resourceUrl = String(
        formData.get('url') || ''
      ).trim();

      if (!title || !resourceUrl) {
        throw new Error(
          'Resource title and URL are required.'
        );
      }

      await api(
        `/api/lessons/${lessonId}/resources`,
        {
          method: 'POST',
          body: {
            title,
            resource_type: resourceType,
            resource_url: resourceUrl
          }
        }
      );

      form.reset();

      await loadResources();

      showMessage(
        msgEl,
        'Resource added successfully.',
        'ok'
      );

    } catch (err) {
      showMessage(msgEl, err.message);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  $('edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      await api(
        `/api/lessons/${lessonId}`,
        {
          method: 'PUT',
          body: {
            title: $('e-title').value.trim(),
            content: $('e-content').value,
            status: $('e-status').value
          }
        }
      );

      showMessage(
        msgEl,
        'Lesson saved successfully.',
        'ok'
      );

      await load();

    } catch (err) {
      showMessage(msgEl, err.message);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  $('delete-lesson').addEventListener('click', async () => {
    if (!isStaffUser()) return;

    if (!confirm('Delete this lesson?')) return;

    try {
      await api(
        `/api/lessons/${lessonId}`,
        { method: 'DELETE' }
      );

      window.location.href = $('back').href;

    } catch (err) {
      showMessage(msgEl, err.message);
    }
  });

  if (!lessonId) {
    window.location.href = 'courses.html';
  } else {
    load().catch((err) => {
      showMessage(msgEl, err.message);
    });
  }
}


if (document.getElementById('modules')) {
  initCoursePageLessons();
}

if (document.getElementById('resource-form')) {
  initLessonPage();
}