moduleRenderHooks.push(async () => {
  let progress = [];
  try {
    progress = await api(`/api/courses/${courseId}/progress`);
  } catch (e) { return; /* e.g. not enrolled yet: modules stay as rendered */ }

  const staff = isStaffUser();
  for (const p of progress) {
    const box = document.getElementById(`module-${p.module_id}`);
    if (!box) continue;
    const header = box.querySelector('.row.between .row');
    const slot = box.querySelector(`[data-module-extras="${p.module_id}"]`);

    if (staff) {
      header?.insertAdjacentHTML('beforeend', '<span class="badge pill-ok">staff: always open</span>');
      if (slot) renderOverridePanel(slot, p.module_id);
      continue;
    }

    if (!p.unlocked) {
      box.classList.add('locked');
      header?.insertAdjacentHTML('beforeend', '<span class="badge pill-lock">locked</span>');
      if (slot) {
        slot.innerHTML = `<div class="msg error" style="display:block">${esc(p.reason)}</div>`;
        (p.prerequisites || []).filter((d) => !d.mastered).forEach((d) => {
          slot.insertAdjacentHTML('beforeend', progressBar(`${d.title}: lessons ${d.lessons_completed}/${d.lessons_total}`,
            d.lessons_total ? (d.lessons_completed / d.lessons_total) * 100 : 100));
          slot.insertAdjacentHTML('beforeend', progressBar(`${d.title}: quiz ${d.latest_score ?? 0}% / ${d.minimum_score}% needed`,
            Math.min(100, ((d.latest_score ?? 0) / d.minimum_score) * 100)));
          (d.quizzes || []).forEach((q) => {
            if (q.attempt_limit) {
              slot.insertAdjacentHTML('beforeend', `<div class="muted" style="margin-top:4px"><small>${esc(q.title)}: attempts used ${q.attempts_used}/${q.attempt_limit}${q.attempts_exhausted ? ` - last score ${q.final_score ?? 0}% is final` : ''}</small></div>`);
            }
          });
        });
      }
    } else {
      header?.insertAdjacentHTML('beforeend', '<span class="badge pill-ok">unlocked</span>');
      if (p.override) {
        header?.insertAdjacentHTML('beforeend', '<span class="badge">unlocked by instructor</span>');
        slot?.insertAdjacentHTML('afterbegin', `<div class="muted"><small>${esc(p.reason)}</small></div>`);
      } else if (p.mastered) header?.insertAdjacentHTML('beforeend', '<span class="badge pill-ok">mastered</span>');
      else if (p.lessons_total !== null && slot) {
        slot.insertAdjacentHTML('afterbegin', progressBar(
          `Your progress: lessons ${p.lessons_completed}/${p.lessons_total}` +
          (p.latest_score !== null ? `, quiz ${p.latest_score}% (need ${p.passing_score}%)` : `, quiz not passed yet (need ${p.passing_score}%)`),
          p.lessons_total ? (p.lessons_completed / p.lessons_total) * 100 : 0));
      }
    }
  }
});

function progressBar(label, percent) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return `<div style="margin-top:8px"><small class="muted">${esc(label)}</small>
    <div style="background:#e9ecef;border-radius:999px;height:8px;overflow:hidden">
      <div style="width:${pct}%;background:linear-gradient(90deg,var(--primary),var(--accent));height:8px"></div></div></div>`;
}

async function renderOverridePanel(slot, moduleId) {
  let candidates = [], unlocks = [];
  try {
    [candidates, unlocks] = await Promise.all([
      api(`/api/modules/${moduleId}/unlock-candidates`),
      api(`/api/modules/${moduleId}/unlocks`),
    ]);
  } catch (e) { return; /* not this course's instructor */ }
  if (!candidates.length && !unlocks.length) return;

  slot.insertAdjacentHTML('beforeend', `
    <div class="card" style="margin:10px 0 0;background:#fffbea" data-override-panel="${moduleId}">
      <strong>Instructor unlock</strong>
      <div class="muted"><small>Students who used every attempt and still scored below the required score.
        Their last attempt is their final score; you may open this module for them anyway.</small></div>
      ${candidates.map((c) => `
        <div class="notif" style="align-items:flex-start">
          <div>${esc(c.student_name)}
            <small>${c.blocked_by.map((b) => `${esc(b.title)}: final ${b.final_score ?? 0}% (needs ${b.minimum_score}%)`).join('; ')}</small>
          </div>
          <div class="row">
            <input data-unlock-reason="${moduleId}-${c.student_id}" placeholder="Reason (required)" style="width:200px">
            <button class="small" data-unlock="${moduleId}" data-student="${c.student_id}">Unlock</button>
          </div>
        </div>`).join('')}
      ${unlocks.length ? `<div style="margin-top:8px"><strong>Unlocked by instructor</strong>
        ${unlocks.map((u) => `
        <div class="notif"><div>${esc(u.student_name)}<small>${esc(u.reason)} - by ${esc(u.unlocked_by_name)}</small></div>
          <button class="small secondary" data-revoke="${moduleId}" data-student="${u.student_id}">Revoke</button></div>`).join('')}
      </div>` : ''}
    </div>`);
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  const msg = document.getElementById('msg');
  try {
    if (t.dataset.unlock) {
      const reason = document.querySelector(`[data-unlock-reason="${t.dataset.unlock}-${t.dataset.student}"]`).value.trim();
      if (reason.length < 3) { showMessage(msg, 'Please type a reason for the unlock (at least 3 characters).'); return; }
      await api(`/api/modules/${t.dataset.unlock}/unlocks`, { method: 'POST', body: { student_id: Number(t.dataset.student), reason } });
      showMessage(msg, 'Module unlocked for the student.', 'ok');
      loadModules();
    } else if (t.dataset.revoke) {
      if (!confirm('Remove this unlock? The module will lock again unless the student has passed.')) return;
      await api(`/api/modules/${t.dataset.revoke}/unlocks/${t.dataset.student}`, { method: 'DELETE' });
      showMessage(msg, 'Unlock removed.', 'ok');
      loadModules();
    }
  } catch (err) { showMessage(msg, err.message); }
});
