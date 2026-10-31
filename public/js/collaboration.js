moduleRenderHooks.push(async (modules) => {
  for (const m of modules) {
    const slot = document.querySelector(`[data-module-extras="${m.module_id}"]`);
    if (!slot) continue;
    slot.insertAdjacentHTML('beforeend', `
      <div class="row" style="margin-top:8px">
        <a class="btn small secondary" href="assignments.html?module=${m.module_id}">Assignments</a>
        <a class="btn small secondary" href="discussions.html?module=${m.module_id}">Discussions</a>
      </div>`);
  }
});
