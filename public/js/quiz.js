function initCoursePageQuizzes() {
  moduleRenderHooks.push(async (modules) => {
    const staff = isStaffUser();
    for (const m of modules) {
      const slot = document.querySelector(
        `[data-module-extras="${m.module_id}"]`
      );

      if (!slot) continue;
      let quizzes = [];

      try {
        quizzes = await api(
          `/api/modules/${m.module_id}/quizzes`
        );
      } catch (error) {
      }

      slot.insertAdjacentHTML('beforeend', `
        <div style="margin-top:8px">
          <strong>Quizzes</strong>

          ${quizzes.length ? `
            <ul style="margin:6px 0 0 18px;padding:0">
              ${quizzes.map((q) => `
                <li style="margin-bottom:10px">
                  <a href="quiz.html?id=${Number(q.quiz_id)}">
                    ${esc(q.title)}
                  </a>

                  <span class="muted">
                    (${Number(q.question_count)} questions,
                    pass ${Number(q.passing_score)}%,
                    ${q.attempt_limit == null
                      ? 'unlimited attempts'
                      : `${Number(q.attempt_limit)} attempt(s)`})
                  </span>

                  ${staff ? statusBadge(q.status) : ''}

                  ${staff && q.status === 'draft' ? `
                    <button
                      type="button"
                      class="small danger"
                      data-delete-quiz="${Number(q.quiz_id)}"
                      data-quiz-title="${esc(q.title)}"
                    >
                      Delete
                    </button>
                  ` : ''}
                </li>
              `).join('')}
            </ul>
          ` : `
            <div class="muted">No quizzes yet.</div>
          `}

          ${staff ? `
            <form
              class="row"
              data-quiz-form="${m.module_id}"
              style="margin-top:8px;flex-wrap:wrap"
            >
              <input
                name="title"
                placeholder="New quiz title"
                required
                style="flex:2;min-width:160px"
              >

              <input
                name="score"
                type="number"
                min="0"
                max="100"
                placeholder="pass %"
                style="width:90px"
              >

              <label>
                Attempt limit

                <input
                  name="attempt_limit"
                  type="number"
                  min="1"
                  step="1"
                  value="1"
                  required
                  style="width:90px"
                >
              </label>

              <select name="status" style="width:auto">
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>

              <button class="small" type="submit">
                Add quiz
              </button>
            </form>
          ` : ''}
        </div>
      `);
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-quiz-form]');
    if (!form) return;
    e.preventDefault();

    const attemptLimit = Number(
      form.elements.namedItem('attempt_limit').value
    );

    if (
      !Number.isInteger(attemptLimit) ||
      attemptLimit < 1
    ) {
      showMessage(
        document.getElementById('msg'),
        'Attempt limit must be at least 1.'
      );
      return;
    }

    try {
      const body = {
        title: form.elements.namedItem('title').value.trim(),
        status: form.elements.namedItem('status').value,
        attempt_limit: attemptLimit
      };

      const score = form.elements.namedItem('score').value;

      if (score !== '') {
        body.passing_score = Number(score);
      }

      const quiz = await api(
        `/api/modules/${form.dataset.quizForm}/quizzes`,
        {
          method: 'POST',
          body
        }
      );

      window.location.href = `quiz.html?id=${quiz.quiz_id}`;

    } catch (error) {
      showMessage(
        document.getElementById('msg'),
        error.message
      );
    }
  });

  document.addEventListener('click', async (e) => {
    const button = e.target.closest(
      '[data-delete-quiz]'
    );

    if (!button || !isStaffUser()) return;

    const quizId = button.dataset.deleteQuiz;

    const confirmed = confirm(
      `Permanently delete draft quiz "${button.dataset.quizTitle}" and its questions?`
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
      await api(`/api/quizzes/${quizId}`, {
        method: 'DELETE'
      });

      showMessage(
        document.getElementById('msg'),
        'Draft quiz deleted successfully.',
        'ok'
      );

      await loadModules();

    } catch (error) {
      button.disabled = false;

      showMessage(
        document.getElementById('msg'),
        error.message
      );
    }
  });
}

function initQuizPage() {
  requireLogin();
  renderTopbar();

  const quizId = qs('id');
  const $ = (id) => document.getElementById(id);
  const msgEl = $('msg');
  let quiz = null;
  let currentAttempt = null;

  async function load() {
    quiz = await api(`/api/quizzes/${quizId}`);
    $('title').textContent = quiz.title;
    $('desc').textContent = quiz.description || '';
    $('meta').innerHTML = [
      `Pass: ${Number(quiz.passing_score)}%`,

      quiz.time_limit_minutes
        ? `Time limit: ${quiz.time_limit_minutes} min`
        : null,

      quiz.attempt_limit
        ? `Attempts allowed: ${quiz.attempt_limit}`
        : 'Unlimited attempts',

      `${quiz.question_count} questions`
    ]
      .filter(Boolean)
      .map((text) =>
        `<span class="badge">${esc(text)}</span>`
      )
      .join('');

    const mod = await api(
      `/api/modules/${quiz.module_id}`
    );

    $('back').href = `courses.html?id=${mod.course_id}`;

    if (isStaffUser()) {
      $('staff-card').hidden = false;

      renderQuizSettings();

      await loadQuestions();

    } else {
      $('take-card').hidden = false;
    }

    await loadAttempts();
  }

  function renderQuizSettings() {
    const staffCard = $('staff-card');

    let panel = $('quiz-settings-panel');

    if (!panel) {
      panel = document.createElement('section');

      panel.id = 'quiz-settings-panel';

      panel.style.marginBottom = '18px';

      staffCard.insertBefore(
        panel,
        staffCard.firstChild
      );
    }

    panel.innerHTML = `
      <h3>Edit Quiz Settings</h3>

      <form id="quiz-settings-form" class="stack">
        <label>
          Quiz title

          <input
            name="title"
            required
            value="${esc(quiz.title)}"
          >
        </label>

        <label>
          Description

          <textarea name="description">${esc(quiz.description || '')}</textarea>
        </label>

        <div class="row" style="flex-wrap:wrap">
          <label>
            Passing score (%)

            <input
              name="passing_score"
              type="number"
              min="0"
              max="100"
              required
              value="${Number(quiz.passing_score)}"
              style="width:110px"
            >
          </label>

          <label>
            Attempt limit

            <input
              name="attempt_limit"
              type="number"
              min="1"
              step="1"
              required
              value="${quiz.attempt_limit == null
                ? 1
                : Number(quiz.attempt_limit)}"
              style="width:110px"
            >
          </label>

          <label>
            Time limit (minutes, optional)

            <input
              name="time_limit_minutes"
              type="number"
              min="1"
              step="1"
              value="${quiz.time_limit_minutes == null
                ? ''
                : Number(quiz.time_limit_minutes)}"
              style="width:150px"
            >
          </label>

          <label>
            Status

            <select name="status">
              ${['draft', 'published', 'archived'].map(
                (status) => `
                  <option
                    value="${status}"
                    ${quiz.status === status
                      ? 'selected'
                      : ''}
                  >
                    ${status}
                  </option>
                `
              ).join('')}
            </select>
          </label>
        </div>

        <button type="submit">
          Save Quiz Settings
        </button>
      </form>

      <p class="muted">
        <small>
          Default attempt limit: 1.
          Existing student attempts are not reset
          when the limit changes.
        </small>
      </p>
    `;
  }

  $('staff-card').addEventListener(
    'submit',
    async (e) => {
      if (e.target.id !== 'quiz-settings-form') {
        return;
      }

      e.preventDefault();

      const form = e.target;

      const button = form.querySelector(
        'button[type="submit"]'
      );

      const attemptLimit = Number(
        form.elements.namedItem('attempt_limit').value
      );

      const passingScore = Number(
        form.elements.namedItem('passing_score').value
      );

      const timeValue = form.elements
        .namedItem('time_limit_minutes')
        .value.trim();

      if (
        !Number.isInteger(attemptLimit) ||
        attemptLimit < 1 ||
        !Number.isFinite(passingScore) ||
        passingScore < 0 ||
        passingScore > 100
      ) {
        showMessage(
          msgEl,
          'Enter a valid passing score and an attempt limit of at least 1.'
        );

        return;
      }

      if (
        timeValue !== '' &&
        (
          !Number.isInteger(Number(timeValue)) ||
          Number(timeValue) < 1
        )
      ) {
        showMessage(
          msgEl,
          'Time limit must be a positive whole number.'
        );

        return;
      }

      const body = {
        title: form.elements.namedItem('title').value.trim(),
        description: form.elements.namedItem('description').value.trim(),
        passing_score: passingScore,
        attempt_limit: attemptLimit,
        status: form.elements.namedItem('status').value
      };

      if (timeValue !== '') {
        body.time_limit_minutes = Number(timeValue);
      }

      button.disabled = true;

      try {
        await api(`/api/quizzes/${quizId}`, {
          method: 'PUT',
          body
        });

        await load();

        showMessage(
          msgEl,
          'Quiz settings saved successfully.',
          'ok'
        );

      } catch (error) {
        showMessage(msgEl, error.message);

      } finally {
        button.disabled = false;
      }
    }
  );

  async function loadAttempts() {
    const rows = await api(
      `/api/quizzes/${quizId}/attempts`
    );

    const staff = isStaffUser();

    if (!staff && quiz.attempt_limit) {
      const gradedAttempts = rows.filter(
        (a) => a.status === 'graded'
      );

      const used = gradedAttempts.length;

      const startBtn = $('start-btn');

      if (used >= quiz.attempt_limit && startBtn) {
        startBtn.hidden = true;

        const last = gradedAttempts[
          gradedAttempts.length - 1
        ];

        $('result').innerHTML = `
          <div
            class="msg error"
            style="display:block"
          >
            All ${quiz.attempt_limit} attempts are used.

            Your last attempt
            (${Number(last.score)}%)
            is your final score.
          </div>
        `;
      }
    }

    $('attempts').innerHTML = rows.length
      ? `
        <table class="list">
          <tr>
            ${staff ? '<th>Student</th>' : ''}
            <th>#</th>
            <th>Status</th>
            <th>Score</th>
            <th>Result</th>
            <th>Submitted</th>
          </tr>

          ${rows.map((a) => {
            const graded = a.status === 'graded';

            const passed =
              graded &&
              Number(a.score) >=
              Number(quiz.passing_score);

            return `
              <tr>
                ${staff ? `
                  <td>${esc(a.student_name)}</td>
                ` : ''}

                <td>${a.attempt_number}</td>

                <td>${esc(a.status)}</td>

                <td>
                  ${graded
                    ? Number(a.score) + '%'
                    : '-'}
                </td>

                <td>
                  ${graded ? `
                    <span
                      class="badge ${passed
                        ? 'pill-ok'
                        : 'pill-lock'}"
                    >
                      ${passed
                        ? 'passed'
                        : 'not passed'}
                    </span>
                  ` : '-'}
                </td>

                <td>
                  ${a.submitted_at
                    ? new Date(
                        a.submitted_at
                      ).toLocaleString()
                    : '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </table>
      `
      : '<p class="empty">No attempts yet.</p>';
  }

  $('start-btn').addEventListener(
    'click',
    async () => {
      try {
        currentAttempt = await api(
          `/api/quizzes/${quizId}/attempts`,
          { method: 'POST' }
        );

        const questions = await api(
          `/api/quizzes/${quizId}/questions`
        );

        $('result').innerHTML = '';

        renderQuizForm(questions);

        $('start-btn').hidden = true;

      } catch (error) {
        showMessage(msgEl, error.message);
      }
    }
  );

  function renderQuizForm(questions) {
    const form = $('quiz-form');

    form.hidden = false;

    form.innerHTML = questions.map((q, i) => {
      const questionId = Number(q.question_id);
      const questionType = q.question_type;

      let answerInputs = '';

      if (questionType === 'short_answer') {
        answerInputs = `
          <input
            type="text"
            name="q${questionId}"
            placeholder="Your answer"
            autocomplete="off"
          >
        `;

      } else if (questionType === 'true_false') {
        answerInputs = ['true', 'false'].map(
          (value) => `
            <label
              style="display:flex;gap:8px;align-items:center;margin:6px 0;color:inherit"
            >
              <input
                type="radio"
                name="q${questionId}"
                value="${value}"
                style="width:auto"
              >

              ${value === 'true' ? 'True' : 'False'}
            </label>
          `
        ).join('');

      } else if (questionType === 'multiple_choice') {
        const options = Array.isArray(q.options)
          ? q.options
          : [];

        answerInputs = options.map(
          (option) => `
            <label
              style="display:flex;gap:8px;align-items:center;margin:6px 0;color:inherit"
            >
              <input
                type="radio"
                name="q${questionId}"
                value="${esc(option)}"
                style="width:auto"
              >

              ${esc(option)}
            </label>
          `
        ).join('');
      }

      return `
        <fieldset
          style="border:1px solid var(--line);border-radius:10px;padding:12px"
        >
          <legend>
            <strong>${i + 1}.</strong>
            ${esc(q.question_text)}

            <span class="muted">
              (${Number(q.points)} pt)
            </span>
          </legend>

          ${answerInputs}
        </fieldset>
      `;
    }).join('') + `
      <button type="submit">
        Submit answers
      </button>
    `;

    form.dataset.questions = JSON.stringify(
      questions.map((q) => q.question_id)
    );
  }

  $('quiz-form').addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();

      const form = e.target;

      const ids = JSON.parse(
        form.dataset.questions
      );

      const answers = ids
        .map((id) => {
          const el =
            form.querySelector(
              `[name="q${id}"]:checked`
            ) ||
            form.querySelector(
              `input[type=text][name="q${id}"], input:not([type=radio])[name="q${id}"]`
            );

          return {
            question_id: id,
            answer_text: el ? el.value : ''
          };
        })
        .filter((a) => a.answer_text !== '');

      const submitButton = form.querySelector(
        'button[type=submit]'
      );

      submitButton.disabled = true;

      try {
        if (answers.length) {
          await api(
            `/api/attempts/${currentAttempt.attempt_id}/answers`,
            {
              method: 'POST',
              body: { answers }
            }
          );
        }

        const result = await api(
          `/api/attempts/${currentAttempt.attempt_id}/submit`,
          { method: 'POST' }
        );

        form.hidden = true;
        form.innerHTML = '';

        $('start-btn').hidden = false;
        $('start-btn').textContent = 'Try again';

        $('result').innerHTML = `
          <div
            class="msg ${result.passed ? 'ok' : 'error'}"
            style="display:block"
          >
            <strong>
              Score: ${Number(result.score)}%
            </strong>

            (${result.points_earned} /
            ${result.points_possible} points).

            ${result.passed
              ? 'You passed! The next module may now be unlocked.'
              : `You need ${Number(result.passing_score)}% to pass.`}

            ${result.final_attempt
              ? `
                <strong>
                  That was your last attempt -
                  ${Number(result.score)}%
                  is your final score.
                </strong>

                ${result.passed
                  ? ''
                  : 'If the next module stays locked, ask your instructor to review your result.'}
              `
              : (
                !result.passed &&
                result.attempts_left !== null
                  ? `Attempts left: ${result.attempts_left}.`
                  : ''
              )}
          </div>
        `;

        if (result.final_attempt) {
          $('start-btn').hidden = true;
        }

        await loadAttempts();

        if (
          typeof afterQuizSubmitted === 'function'
        ) {
          afterQuizSubmitted(result);
        }

      } catch (error) {
        submitButton.disabled = false;

        showMessage(msgEl, error.message);
      }
    }
  );

  async function loadQuestions() {
    const list = await api(
      `/api/quizzes/${quizId}/questions`
    );

    $('questions').innerHTML = list.length
      ? list.map((q, i) => `
        <div class="notif">
          <div>
            <strong>
              ${i + 1}. ${esc(q.question_text)}
            </strong>

            ${statusBadge(q.question_type)}

            <span class="muted">
              ${Number(q.points)} pt
            </span>

            <small>
              ${q.options
                ? 'Options: ' +
                  q.options.map(esc).join(' | ') +
                  '<br>'
                : ''}

              Answer:
              <strong>${esc(q.correct_answer)}</strong>
            </small>
          </div>

          <button
            class="small danger"
            data-del-q="${q.question_id}"
          >
            Delete
          </button>
        </div>
      `).join('')
      : '<p class="empty">No questions yet.</p>';
  }

  $('questions').addEventListener(
    'click',
    async (e) => {
      const button = e.target.closest('[data-del-q]');

      if (!button) return;

      try {
        await api(
          `/api/questions/${button.dataset.delQ}`,
          { method: 'DELETE' }
        );

        await loadQuestions();

      } catch (error) {
        showMessage(msgEl, error.message);
      }
    }
  );


  function syncQuestionForm() {
    const type = $('q-type').value;

    $('options-wrap').hidden =
      type !== 'multiple_choice';

    $('q-answer-hint').textContent = {
      multiple_choice: '(must match one option)',
      true_false: '(true or false)',
      short_answer:
        '(use | to allow several accepted answers)'
    }[type];
  }

  $('q-type').addEventListener(
    'change',
    syncQuestionForm
  );

  syncQuestionForm();

  $('question-form').addEventListener(
    'submit',
    async (e) => {
      e.preventDefault();

      const type = $('q-type').value;

      const body = {
        question_text: $('q-text').value,
        question_type: type,
        points: Number($('q-points').value),
        correct_answer: $('q-answer').value
      };

      if (type === 'multiple_choice') {
        body.options = $('q-options')
          .value
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      try {
        await api(
          `/api/quizzes/${quizId}/questions`,
          {
            method: 'POST',
            body
          }
        );

        e.target.reset();

        syncQuestionForm();

        await loadQuestions();

      } catch (error) {
        showMessage(msgEl, error.message);
      }
    }
  );

  if (!quizId) {
    window.location.href = 'courses.html';
  } else {
    load().catch(
      (error) => showMessage(msgEl, error.message)
    );
  }
}


if (document.getElementById('modules')) {
  initCoursePageQuizzes();
}

if (document.getElementById('quiz-form')) {
  initQuizPage();
}