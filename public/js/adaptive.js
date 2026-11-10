moduleRenderHooks.push(async () => {
  let progress = [];
  try {
    progress = await api(
      `/api/courses/${courseId}/progress`
    );

  } catch (error) {
    console.error(
      '[adaptive] Progress loading failed:',
      error.message
    );

    return;
  }

  const staff = isStaffUser();
  for (const p of progress) {
    const box = document.getElementById(
      `module-${p.module_id}`
    );

    if (!box) {
      continue;
    }

    const header = box.querySelector(
      '.row.between .row'
    );

    const slot = box.querySelector(
      `[data-module-extras="${p.module_id}"]`
    );

    if (staff) {
      header?.insertAdjacentHTML(
        'beforeend',
        '<span class="badge pill-ok">Staff: Always Open</span>'
      );

      if (slot) {
        await renderOverridePanel(
          slot,
          p.module_id
        );
      }

      continue;
    }

    if (!p.unlocked) {
      box.classList.add('locked');

      header?.insertAdjacentHTML(
        'beforeend',
        '<span class="badge pill-lock">Locked</span>'
      );

      if (slot) {
        slot.innerHTML = `
          <div
            class="msg error"
            style="display:block"
          >
            ${esc(p.reason)}
          </div>
        `;

        const unmetPrerequisites = (
          p.prerequisites || []
        ).filter(d => !d.mastered);

        unmetPrerequisites.forEach(d => {
          slot.insertAdjacentHTML(
            'beforeend',
            progressBar(
              `${d.title}: lessons ${d.lessons_completed}/${d.lessons_total}`,
              d.lessons_total
                ? (
                    d.lessons_completed /
                    d.lessons_total
                  ) * 100
                : 100
            )
          );

          slot.insertAdjacentHTML(
            'beforeend',
            progressBar(
              `${d.title}: quiz ${d.latest_score ?? 0}% / ${d.minimum_score}% needed`,
              d.minimum_score > 0
                ? Math.min(
                    100,
                    (
                      (d.latest_score ?? 0) /
                      d.minimum_score
                    ) * 100
                  )
                : 100
            )
          );

          (d.quizzes || []).forEach(q => {
            if (!q.attempt_limit) {
              return;
            }

            slot.insertAdjacentHTML(
              'beforeend',
              `
                <div
                  class="muted"
                  style="margin-top:4px"
                >
                  <small>
                    ${esc(q.title)}:
                    attempts used
                    ${Number(q.attempts_used)}/
                    ${Number(q.attempt_limit)}

                    ${q.attempts_exhausted
                      ? `
                        — last score
                        ${Number(q.final_score ?? 0)}%
                        is final
                      `
                      : ''}
                  </small>
                </div>
              `
            );
          });
        });
      }

      continue;
    }

    header?.insertAdjacentHTML(
      'beforeend',
      '<span class="badge pill-ok">Unlocked</span>'
    );

    if (p.override) {
      header?.insertAdjacentHTML(
        'beforeend',
        '<span class="badge">Unlocked by instructor</span>'
      );

      slot?.insertAdjacentHTML(
        'afterbegin',
        `
          <div class="muted">
            <small>${esc(p.reason)}</small>
          </div>
        `
      );

    } else if (p.mastered) {
      header?.insertAdjacentHTML(
        'beforeend',
        '<span class="badge pill-ok">Mastered</span>'
      );

    } else if (
      p.lessons_total !== null &&
      slot
    ) {
      slot.insertAdjacentHTML(
        'afterbegin',
        progressBar(
          `Your progress: lessons ${p.lessons_completed}/${p.lessons_total}` +
          (
            p.latest_score !== null
              ? `, quiz ${p.latest_score}% (need ${p.passing_score}%)`
              : `, quiz not passed yet (need ${p.passing_score}%)`
          ),
          p.lessons_total
            ? (
                p.lessons_completed /
                p.lessons_total
              ) * 100
            : 0
        )
      );
    }
  }
});

function progressBar(label, percent) {
  const pct = Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(percent) || 0)
    )
  );

  return `
    <div style="margin-top:8px">
      <small class="muted">
        ${esc(label)}
      </small>

      <div
        style="
          background:#e9ecef;
          border-radius:999px;
          height:8px;
          overflow:hidden;
        "
      >
        <div
          style="
            width:${pct}%;
            background:linear-gradient(
              90deg,
              var(--primary),
              var(--accent)
            );
            height:8px;
          "
        ></div>
      </div>
    </div>
  `;
}

async function renderOverridePanel(slot, moduleId) {
  if (!slot) {
    return;
  }

  let candidates = [];
  let unlocks = [];

  slot.querySelector(
    '[data-override-panel]'
  )?.remove();

  const panel = document.createElement(
    'div'
  );

  panel.className = 'card';
  panel.dataset.overridePanel = moduleId;

  panel.style.margin = '10px 0 0';
  panel.style.background = '#fffbea';

  panel.innerHTML = `
    <strong>Instructor unlock</strong>

    <p class="muted">
      Loading unlock information...
    </p>
  `;

  slot.appendChild(panel);

  try {
    [candidates, unlocks] = await Promise.all([
      api(
        `/api/modules/${moduleId}/unlock-candidates`
      ),
      api(
        `/api/modules/${moduleId}/unlocks`
      )
    ]);

  } catch (error) {
    panel.innerHTML = `
      <strong>Instructor unlock</strong>

      <div
        class="msg error"
        style="display:block;margin-top:10px"
      >
        ${esc(error.message)}
      </div>
    `;

    return;
  }

  const unlockedIds = new Set(
    unlocks.map(
      u => Number(u.student_id)
    )
  );

  const eligibleCandidates =
    candidates.filter(
      c => !unlockedIds.has(
        Number(c.student_id)
      )
    );

  panel.innerHTML = `
    <strong>Instructor unlock</strong>

    <p class="muted">
      Select an enrolled student who has not
      completed the prerequisites for this module.
      Enter a reason to manually grant access.
    </p>

    <h4>Students eligible for unlock</h4>

    ${eligibleCandidates.length
      ? eligibleCandidates.map(c => `
          <div
            class="notif"
            style="align-items:flex-start"
          >
            <div>
              <strong>
                ${esc(c.student_name)}
              </strong>

              <small>
                ${(c.blocked_by || []).map(b => `
                  ${esc(b.title)}:
                  current score
                  ${Number(b.final_score ?? 0)}%
                  (needs
                  ${Number(b.minimum_score)}%)
                `).join('; ')}
              </small>
            </div>

            <div class="row">
              <input
                type="text"
                data-unlock-reason="${Number(moduleId)}-${Number(c.student_id)}"
                placeholder="Reason (required)"
                style="width:200px"
              >

              <button
                type="button"
                class="small"
                data-unlock="${Number(moduleId)}"
                data-student="${Number(c.student_id)}"
              >
                Unlock
              </button>
            </div>
          </div>
        `).join('')

      : `
          <p class="empty">
            No enrolled students currently
            require an instructor override
            for this module.
          </p>
        `
    }

    ${unlocks.length
      ? `
          <h4>Unlocked by instructor</h4>

          ${unlocks.map(u => `
            <div class="notif">
              <div>
                <strong>
                  ${esc(u.student_name)}
                </strong>

                <small>
                  ${esc(u.reason)}
                  — by
                  ${esc(u.unlocked_by_name)}
                </small>
              </div>

              <button
                type="button"
                class="small secondary"
                data-revoke="${Number(moduleId)}"
                data-student="${Number(u.student_id)}"
              >
                Revoke
              </button>
            </div>
          `).join('')}
        `
      : ''
    }
  `;
}

document.addEventListener('click', async e => {
  const button = e.target.closest(
    '[data-unlock], [data-revoke]'
  );

  if (!button) {
    return;
  }

  const msg = document.getElementById(
    'msg'
  );

  try {
    if (button.dataset.unlock) {
      const moduleId =
        button.dataset.unlock;

      const studentId =
        button.dataset.student;

      const reasonInput =
        document.querySelector(
          `[data-unlock-reason="${moduleId}-${studentId}"]`
        );

      if (!reasonInput) {
        showMessage(
          msg,
          'Unlock reason field was not found.'
        );

        return;
      }

      const reason =
        reasonInput.value.trim();

      if (reason.length < 3) {
        showMessage(
          msg,
          'Please type a reason for the unlock (at least 3 characters).'
        );

        return;
      }

      button.disabled = true;

      await api(
        `/api/modules/${moduleId}/unlocks`,
        {
          method: 'POST',
          body: {
            student_id: Number(studentId),
            reason
          }
        }
      );

      showMessage(
        msg,
        'Module unlocked for the student.',
        'ok'
      );

      await loadModules();

    } else if (button.dataset.revoke) {
      const moduleId =
        button.dataset.revoke;

      const studentId =
        button.dataset.student;

      if (!confirm(
        'Remove this unlock? The module will lock again unless the student has passed.'
      )) {
        return;
      }

      button.disabled = true;

      await api(
        `/api/modules/${moduleId}/unlocks/${studentId}`,
        {
          method: 'DELETE'
        }
      );

      showMessage(
        msg,
        'Unlock removed.',
        'ok'
      );

      await loadModules();
    }

  } catch (error) {
    button.disabled = false;

    showMessage(
      msg,
      error.message
    );
  }
});