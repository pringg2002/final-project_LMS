function initCoursePageQuizzes() {
  moduleRenderHooks.push(async (modules) => {
    const staff = isStaffUser();
    for (const m of modules) {
      const slot = document.querySelector(`[data-module-extras="${m.module_id}"]`);
      if (!slot) continue;
      let quizzes = [];
      try { quizzes = await api(`/api/modules/${m.module_id}/quizzes`); } catch (e) { /* locked or hidden */ }

      slot.insertAdjacentHTML('beforeend', `
        <div style="margin-top:8px">
          <strong>Quizzes</strong>
          ${quizzes.length ? `<ul style="margin:6px 0 0 18px;padding:0">${quizzes.map((q) => `
            <li><a href="quiz.html?id=${q.quiz_id}">${esc(q.title)}</a>
              <span class="muted">(${q.question_count} questions, pass ${Number(q.passing_score)}%)</span>
              ${staff ? statusBadge(q.status) : ''}</li>`).join('')}</ul>`
            : '<div class="muted">No quizzes yet.</div>'}
          ${staff ? `
          <form class="row" data-quiz-form="${m.module_id}" style="margin-top:8px">
            <input name="title" placeholder="New quiz title" required style="flex:2;min-width:160px">
            <input name="score" type="number" min="0" max="100" placeholder="pass %" style="width:90px">
            <select name="status" style="width:auto"><option value="published">published</option><option value="draft">draft</option></select>
            <button class="small" type="submit">Add quiz</button>
          </form>` : ''}
        </div>`);
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-quiz-form]');
    if (!form) return;
    e.preventDefault();
    try {
      const body = { title: form.title.value, status: form.status.value };
      if (form.score.value !== '') body.passing_score = Number(form.score.value);
      const quiz = await api(`/api/modules/${form.dataset.quizForm}/quizzes`, { method: 'POST', body });
      window.location.href = `quiz.html?id=${quiz.quiz_id}`; // go add questions
    } catch (err) { showMessage(document.getElementById('msg'), err.message); }
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
      quiz.time_limit_minutes ? `Time limit: ${quiz.time_limit_minutes} min` : null,
      quiz.attempt_limit ? `Attempts allowed: ${quiz.attempt_limit}` : 'Unlimited attempts',
      `${quiz.question_count} questions`,
    ].filter(Boolean).map((t) => `<span class="badge">${esc(t)}</span>`).join('');

    const mod = await api(`/api/modules/${quiz.module_id}`);
    $('back').href = `courses.html?id=${mod.course_id}`;

    if (isStaffUser()) { $('staff-card').hidden = false; loadQuestions(); }
    else $('take-card').hidden = false;
    loadAttempts();
  }

  async function loadAttempts() {
    const rows = await api(`/api/quizzes/${quizId}/attempts`);
    const staff = isStaffUser();
    if (!staff && quiz.attempt_limit) {
      const used = rows.filter((a) => a.status === 'graded').length;
      const startBtn = $('start-btn');
      if (used >= quiz.attempt_limit && startBtn) {
        startBtn.hidden = true;
        const last = rows.filter((a) => a.status === 'graded').pop();
        $('result').innerHTML = `<div class="msg error" style="display:block">All ${quiz.attempt_limit} attempts are used.
          Your last attempt (${Number(last.score)}%) is your final score.</div>`;
      }
    }
    $('attempts').innerHTML = rows.length
      ? `<table class="list"><tr>${staff ? '<th>Student</th>' : ''}<th>#</th><th>Status</th><th>Score</th><th>Result</th><th>Submitted</th></tr>
          ${rows.map((a) => {
            const graded = a.status === 'graded';
            const passed = graded && Number(a.score) >= Number(quiz.passing_score);
            return `<tr>${staff ? `<td>${esc(a.student_name)}</td>` : ''}<td>${a.attempt_number}</td><td>${esc(a.status)}</td>
              <td>${graded ? Number(a.score) + '%' : '-'}</td>
              <td>${graded ? `<span class="badge ${passed ? 'pill-ok' : 'pill-lock'}">${passed ? 'passed' : 'not passed'}</span>` : '-'}</td>
              <td>${a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '-'}</td></tr>`;
          }).join('')}</table>`
      : '<p class="empty">No attempts yet.</p>';
  }

  $('start-btn').addEventListener('click', async () => {
    try {
      currentAttempt = await api(`/api/quizzes/${quizId}/attempts`, { method: 'POST' });
      const questions = await api(`/api/quizzes/${quizId}/questions`);
      $('result').innerHTML = '';
      renderQuizForm(questions);
      $('start-btn').hidden = true;
    } catch (err) { showMessage(msgEl, err.message); }
  });

  function renderQuizForm(questions) {
    const form = $('quiz-form');
    form.hidden = false;
    form.innerHTML = questions.map((q, i) => `
      <fieldset style="border:1px solid var(--line);border-radius:10px;padding:12px">
        <legend><strong>${i + 1}.</strong> ${esc(q.question_text)} <span class="muted">(${Number(q.points)} pt)</span></legend>
        ${q.question_type === 'short_answer'
          ? `<input name="q${q.question_id}" placeholder="Your answer" autocomplete="off">`
          : (q.options || []).map((o) => `
            <label style="display:flex;gap:8px;align-items:center;margin:6px 0;color:inherit">
              <input type="radio" name="q${q.question_id}" value="${esc(o)}" style="width:auto"> ${esc(o)}</label>`).join('')}
      </fieldset>`).join('') + '<button type="submit">Submit answers</button>';
    form.dataset.questions = JSON.stringify(questions.map((q) => q.question_id));
  }

  $('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const ids = JSON.parse(form.dataset.questions);
    const answers = ids
      .map((id) => {
        const el = form.querySelector(`[name="q${id}"]:checked`) || form.querySelector(`input[type=text][name="q${id}"], input:not([type=radio])[name="q${id}"]`);
        return { question_id: id, answer_text: el ? el.value : '' };
      })
      .filter((a) => a.answer_text !== '');
    form.querySelector('button[type=submit]').disabled = true;
    try {
      if (answers.length) {
        await api(`/api/attempts/${currentAttempt.attempt_id}/answers`, { method: 'POST', body: { answers } });
      }
      const r = await api(`/api/attempts/${currentAttempt.attempt_id}/submit`, { method: 'POST' });
      form.hidden = true;
      form.innerHTML = '';
      $('start-btn').hidden = false;
      $('start-btn').textContent = 'Try again';
      $('result').innerHTML = `<div class="msg ${r.passed ? 'ok' : 'error'}" style="display:block">
        <strong>Score: ${Number(r.score)}%</strong> (${r.points_earned} / ${r.points_possible} points).
        ${r.passed ? 'You passed! The next module may now be unlocked.' : `You need ${Number(r.passing_score)}% to pass.`}
        ${r.final_attempt
          ? `<br><strong>That was your last attempt - ${Number(r.score)}% is your final score.</strong>${r.passed ? '' : ' If the next module stays locked, ask your instructor to review your result.'}`
          : (!r.passed && r.attempts_left !== null ? `<br>Attempts left: ${r.attempts_left}.` : '')}</div>`;
      if (r.final_attempt) $('start-btn').hidden = true;
      loadAttempts();
      if (typeof afterQuizSubmitted === 'function') afterQuizSubmitted(r);
    } catch (err) {
      form.querySelector('button[type=submit]').disabled = false;
      showMessage(msgEl, err.message);
    }
  });

  async function loadQuestions() {
    const list = await api(`/api/quizzes/${quizId}/questions`);
    $('questions').innerHTML = list.length
      ? list.map((q, i) => `
        <div class="notif"><div><strong>${i + 1}. ${esc(q.question_text)}</strong> ${statusBadge(q.question_type)} <span class="muted">${Number(q.points)} pt</span>
          <small>${q.options ? 'Options: ' + q.options.map(esc).join(' | ') + '<br>' : ''}Answer: <strong>${esc(q.correct_answer)}</strong></small></div>
          <button class="small danger" data-del-q="${q.question_id}">Delete</button></div>`).join('')
      : '<p class="empty">No questions yet.</p>';
  }

  $('questions').addEventListener('click', async (e) => {
    const id = e.target.dataset.delQ;
    if (!id) return;
    try { await api(`/api/questions/${id}`, { method: 'DELETE' }); loadQuestions(); }
    catch (err) { showMessage(msgEl, err.message); }
  });

  function syncQuestionForm() {
    const type = $('q-type').value;
    $('options-wrap').hidden = type !== 'multiple_choice';
    $('q-answer-hint').textContent = { multiple_choice: '(must match one option)', true_false: '(true or false)', short_answer: '(use | to allow several accepted answers)' }[type];
  }
  $('q-type').addEventListener('change', syncQuestionForm);
  syncQuestionForm();

  $('question-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = $('q-type').value;
    const body = {
      question_text: $('q-text').value,
      question_type: type,
      points: Number($('q-points').value),
      correct_answer: $('q-answer').value,
    };
    if (type === 'multiple_choice') body.options = $('q-options').value.split('\n').map((s) => s.trim()).filter(Boolean);
    try {
      await api(`/api/quizzes/${quizId}/questions`, { method: 'POST', body });
      e.target.reset(); syncQuestionForm(); loadQuestions();
    } catch (err) { showMessage(msgEl, err.message); }
  });

  if (!quizId) window.location.href = 'courses.html';
  else load().catch((err) => showMessage(msgEl, err.message));
}

if (document.getElementById('modules')) initCoursePageQuizzes();
if (document.getElementById('quiz-form')) initQuizPage();