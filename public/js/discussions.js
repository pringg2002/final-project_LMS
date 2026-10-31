requireLogin();
renderTopbar();

const moduleId = qs('module');
const $ = (id) => document.getElementById(id);
const msgEl = $('msg');
const me = getUser() || {};
const open = new Set();

async function load() {
  const mod = await api(`/api/modules/${moduleId}`);
  $('title').textContent = `Discussions - ${mod.title}`;
  $('back').href = `courses.html?id=${mod.course_id}`;
  await render();
}

async function render() {
  const list = await api(`/api/modules/${moduleId}/discussions`);
  const html = [];
  for (const d of list) {
    const canEdit = d.author_id === me.user_id || me.role === 'admin' || me.role === 'instructor';
    let replies = '';
    if (open.has(d.discussion_id)) {
      const rs = await api(`/api/discussions/${d.discussion_id}/replies`);
      replies = `<div style="margin:10px 0 0 16px">${rs.map((r) => `
        <div class="notif"><div style="font-weight:400"><strong>${esc(r.author_name)}</strong>
          <small>${new Date(r.created_at).toLocaleString()}</small><div style="white-space:pre-wrap">${esc(r.content)}</div></div>
          ${r.author_id === me.user_id || me.role === 'admin' || me.role === 'instructor'
            ? `<button class="small secondary" data-del-reply="${r.reply_id}">Delete</button>` : ''}</div>`).join('') || '<p class="empty">No replies yet.</p>'}
        ${d.status === 'closed' ? '<p class="muted">This discussion is closed.</p>' : `
        <form class="row" data-reply="${d.discussion_id}"><input name="content" placeholder="Write a reply" required style="flex:1;min-width:200px"><button class="small" type="submit">Reply</button></form>`}</div>`;
    }
    html.push(`
    <section class="card">
      <div class="row between"><h2 style="margin:0">${esc(d.title)}</h2>${statusBadge(d.status)}</div>
      <p class="muted">${esc(d.author_name)} · ${new Date(d.created_at).toLocaleString()} · ${d.reply_count} replies</p>
      <div style="white-space:pre-wrap">${esc(d.content)}</div>
      <div class="row" style="margin-top:10px">
        <button class="small secondary" data-toggle="${d.discussion_id}">${open.has(d.discussion_id) ? 'Hide replies' : 'Show replies'}</button>
        ${canEdit ? `<button class="small secondary" data-close="${d.discussion_id}" data-status="${d.status === 'closed' ? 'active' : 'closed'}">${d.status === 'closed' ? 'Reopen' : 'Close'}</button>
        <button class="small danger" data-del="${d.discussion_id}">Delete</button>` : ''}</div>
      ${replies}
    </section>`);
  }
  $('discussions').innerHTML = html.join('') || '<p class="empty">No discussions yet. Start one above.</p>';
}

document.addEventListener('click', async (e) => {
  const t = e.target;
  try {
    if (t.dataset.toggle) { const id = Number(t.dataset.toggle); open.has(id) ? open.delete(id) : open.add(id); }
    else if (t.dataset.close) await api(`/api/discussions/${t.dataset.close}`, { method: 'PUT', body: { status: t.dataset.status } });
    else if (t.dataset.del) { if (!confirm('Delete this discussion?')) return; await api(`/api/discussions/${t.dataset.del}`, { method: 'DELETE' }); }
    else if (t.dataset.delReply) await api(`/api/replies/${t.dataset.delReply}`, { method: 'DELETE' });
    else return;
    render();
  } catch (err) { showMessage(msgEl, err.message); }
});

document.addEventListener('submit', async (e) => {
  const f = e.target;
  if (!f.dataset.reply) return;
  e.preventDefault();
  try {
    await api(`/api/discussions/${f.dataset.reply}/replies`, { method: 'POST', body: { content: f.content.value } });
    render();
  } catch (err) { showMessage(msgEl, err.message); }
});

$('discussion-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api(`/api/modules/${moduleId}/discussions`, { method: 'POST', body: { title: $('d-title').value, content: $('d-content').value } });
    e.target.reset(); render();
  } catch (err) { showMessage(msgEl, err.message); }
});

if (!moduleId) window.location.href = 'courses.html';
else load().catch((err) => showMessage(msgEl, err.message));
