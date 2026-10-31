requireLogin();
renderTopbar();

const moduleId = qs('module');
const $ = (id) => document.getElementById(id);
const msgEl = $('msg');
const staff = isStaffUser();
let mod = null;

async function load() {
  mod = await api(`/api/modules/${moduleId}`);
  $('title').textContent = `Assignments - ${mod.title}`;
  $('back').href = `course.html?id=${mod.course_id}`;
  if (staff) $('create-card').hidden = false;
  await render();
}

async function render() {
  const list = await api(`/api/modules/${moduleId}/assignments`);
  if (!list.length) { $('assignments').innerHTML = '<p class="empty">No assignments yet.</p>'; return; }
  const cards = [];
  for (const a of list) {
    const mine = staff ? null : (await api(`/api/assignments/${a.assignment_id}/submissions`))[0] || null;
    cards.push(card(a, mine));
  }
  $('assignments').innerHTML = cards.join('');
}

function card(a, mine) {
  const due = a.due_date ? new Date(a.due_date).toLocaleString() : 'No deadline';
  return `
  <section class="card" data-assignment="${a.assignment_id}">
    <div class="row between"><h2 style="margin:0">${esc(a.title)}</h2>
      <div class="row">${statusBadge(a.status)}<span class="badge">${Number(a.max_score)} pts</span></div></div>
    <p class="muted">Due: ${esc(due)}</p>
    <div style="white-space:pre-wrap">${esc(a.instructions || '')}</div>
    ${staff ? staffControls(a) : studentControls(a, mine)}
  </section>`;
}

function studentControls(a, mine) {
  if (mine) {
    const graded = mine.status === 'graded';
    return `<div class="stack" style="margin-top:12px">
      <div>Your submission: ${statusBadge(mine.status)} ${graded ? `<strong>${Number(mine.score)} / ${Number(a.max_score)}</strong>` : ''}</div>
      ${mine.feedback ? `<div class="msg ok" style="display:block"><strong>Feedback:</strong> ${esc(mine.feedback)}</div>` : ''}
      ${graded || a.status !== 'published' ? `<div class="muted" style="white-space:pre-wrap">${esc(mine.submission_text || '')}</div>` : `
      <form data-edit-submission="${mine.submission_id}" class="stack">
        <textarea name="text">${esc(mine.submission_text || '')}</textarea>
        <input name="file" placeholder="Link to your file (optional)" value="${esc(mine.file_url || '')}">
        <button class="small" type="submit">Update submission</button>
      </form>`}</div>`;
  }
  if (a.status !== 'published') return '<p class="muted">This assignment is closed.</p>';
  return `<form data-new-submission="${a.assignment_id}" class="stack" style="margin-top:12px">
    <textarea name="text" placeholder="Write your answer"></textarea>
    <input name="file" placeholder="Link to your file (optional)">
    <button type="submit">Submit work</button></form>`;
}

function staffControls(a) {
  return `<div class="row" style="margin-top:12px">
      <button class="small secondary" data-load-subs="${a.assignment_id}">View submissions</button>
      <button class="small danger" data-del-assignment="${a.assignment_id}">Delete</button></div>
    <div data-subs="${a.assignment_id}"></div>`;
}

async function loadSubmissions(id) {
  const slot = document.querySelector(`[data-subs="${id}"]`);
  const subs = await api(`/api/assignments/${id}/submissions`);
  slot.innerHTML = subs.length ? subs.map((s) => `
    <div class="notif" style="flex-direction:column">
      <div><strong>${esc(s.student_name)}</strong> ${statusBadge(s.status)} <span class="muted">${new Date(s.submitted_at).toLocaleString()}</span></div>
      <div style="white-space:pre-wrap;font-weight:400">${esc(s.submission_text || '')}</div>
      ${s.file_url ? `<a href="${esc(s.file_url)}" target="_blank" rel="noopener noreferrer">Attached file</a>` : ''}
      <form class="row" data-grade="${s.submission_id}">
        <input name="score" type="number" min="0" step="0.01" placeholder="Score" value="${s.score ?? ''}" style="width:100px" required>
        <input name="feedback" placeholder="Feedback" value="${esc(s.feedback || '')}" style="flex:1;min-width:160px">
        <button class="small" type="submit">Save grade</button></div>
      </form></div>`).join('') : '<p class="empty">No submissions yet.</p>';
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  try {
    if (t.dataset.loadSubs) await loadSubmissions(t.dataset.loadSubs);
    else if (t.dataset.delAssignment) {
      if (!confirm('Delete this assignment and its submissions?')) return;
      await api(`/api/assignments/${t.dataset.delAssignment}`, { method: 'DELETE' });
      render();
    }
  } catch (err) { showMessage(msgEl, err.message); }
});

document.addEventListener('submit', async (e) => {
  const f = e.target;
  try {
    if (f.dataset.newSubmission) {
      e.preventDefault();
      await api(`/api/assignments/${f.dataset.newSubmission}/submissions`, { method: 'POST', body: bodyFrom(f) });
      showMessage(msgEl, 'Submitted!', 'ok'); render();
    } else if (f.dataset.editSubmission) {
      e.preventDefault();
      await api(`/api/submissions/${f.dataset.editSubmission}`, { method: 'PUT', body: bodyFrom(f) });
      showMessage(msgEl, 'Submission updated.', 'ok'); render();
    } else if (f.dataset.grade) {
      e.preventDefault();
      await api(`/api/submissions/${f.dataset.grade}`, { method: 'PUT', body: { score: Number(f.score.value), feedback: f.feedback.value } });
      showMessage(msgEl, 'Grade saved and student notified.', 'ok');
    }
  } catch (err) { showMessage(msgEl, err.message); }
});

function bodyFrom(f) {
  const body = { submission_text: f.text.value };
  if (f.file.value.trim()) body.file_url = f.file.value.trim();
  return body;
}

$('assignment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { title: $('a-title').value, instructions: $('a-inst').value, max_score: Number($('a-max').value), status: $('a-status').value };
  if ($('a-due').value) body.due_date = new Date($('a-due').value).toISOString();
  try {
    await api(`/api/modules/${moduleId}/assignments`, { method: 'POST', body });
    e.target.reset(); render();
  } catch (err) { showMessage(msgEl, err.message); }
});

if (!moduleId) window.location.href = 'courses.html';
else load().catch((err) => showMessage(msgEl, err.message));
