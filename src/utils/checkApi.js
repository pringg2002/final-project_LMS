const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = 'Password123!';

let pass = 0;
let fail = 0;
const failures = [];

async function call(method, url, { token, body } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* 204 or empty body */ }
  return { status: res.status, json };
}

function report(ok, label, status, note = '') {
  if (ok) pass++; else { fail++; failures.push(`${label} (got ${status}) ${note}`); }
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(status).padEnd(4)} ${label}${note ? '  - ' + note : ''}`);
}

async function check(label, method, url, expect, opts = {}) {
  let r;
  try {
    r = await call(method, url, opts);
  } catch (err) {
    report(false, label, 'ERR', err.message);
    return null;
  }
  const allowed = Array.isArray(expect) ? expect : [expect];
  const shapeOk = r.status === 204 || (r.json && typeof r.json.success === 'boolean');
  report(allowed.includes(r.status) && shapeOk, label, r.status, shapeOk ? '' : 'response is not { success, message, data }');
  return r;
}

const rows = (r) => (r && r.json && Array.isArray(r.json.data) ? r.json.data : []);
const login = async (email) => {
  const r = await call('POST', '/api/auth/login', { body: { email, password: PASSWORD } });
  return r.json && r.json.data ? r.json.data.token : null;
};

(async () => {
  console.log(`Checking ${BASE}\n`);

  const health = await check('GET  /api/health', 'GET', '/api/health', 200);
  if (!health) {
    console.log('\nThe server is not reachable. Start it with: npm run dev');
    process.exit(1);
  }
  const tokens = {};
  for (const [key, email] of Object.entries({
    admin: 'admin@lms.test', ian: 'instructor@lms.test', stella: 'student@lms.test',
    mia: 'mia@lms.test', noah: 'noah@lms.test', liam: 'liam@lms.test',
  })) {
    tokens[key] = await login(email);
    report(!!tokens[key], `POST /api/auth/login as ${email}`, tokens[key] ? 200 : 'none', tokens[key] ? '' : 'did you run npm run seed?');
  }
  if (!tokens.admin || !tokens.ian || !tokens.mia) {
    console.log('\nLogin failed, so the other checks are skipped. Run: npm run seed:reset');
    process.exit(1);
  }
  const { admin, ian, stella, mia, noah, liam } = tokens;

  await check('POST /api/auth/login (wrong password -> 401)', 'POST', '/api/auth/login', 401, { body: { email: 'admin@lms.test', password: 'wrong' } });
  await check('POST /api/auth/register (disabled -> 404)', 'POST', '/api/auth/register', 404, { body: { email: 'x@y.z' } });
  await check('GET  /api/auth/me', 'GET', '/api/auth/me', 200, { token: mia });
  await check('GET  /api/auth/me (no token -> 401)', 'GET', '/api/auth/me', 401);
  await check('GET  /api/auth/me (bad token -> 401)', 'GET', '/api/auth/me', 401, { token: 'not.a.token' });
  await check('GET  /api/users (admin)', 'GET', '/api/users', 200, { token: admin });
  await check('GET  /api/users (student -> 403)', 'GET', '/api/users', 403, { token: mia });
  await check('GET  /api/this-route-does-not-exist (-> 404)', 'GET', '/api/this-route-does-not-exist', 404, { token: admin });

  const courses = await check('GET  /api/courses', 'GET', '/api/courses', 200, { token: mia });
  const dbms = rows(courses).find((c) => c.course_code === 'DBMS101');
  if (!dbms) { console.log('\nDBMS101 not found - run npm run seed:reset'); process.exit(1); }
  await check('GET  /api/courses/:id', 'GET', `/api/courses/${dbms.course_id}`, 200, { token: mia });
  await check('GET  /api/courses/999999 (-> 404)', 'GET', '/api/courses/999999', 404, { token: mia });
  const modulesRes = await check('GET  /api/courses/:id/modules', 'GET', `/api/courses/${dbms.course_id}/modules`, 200, { token: mia });
  const mods = rows(modulesRes);
  const [m1, m2] = [mods[0], mods[1]];
  if (!m1 || !m2) { console.log('\nModules missing - run npm run seed:reset'); process.exit(1); }
  await check('GET  /api/modules/:id', 'GET', `/api/modules/${m1.module_id}`, 200, { token: mia });
  await check('GET  /api/modules/:id/prerequisites', 'GET', `/api/modules/${m2.module_id}/prerequisites`, 200, { token: mia });

  const code = 'TMP' + Date.now().toString().slice(-6);
  const made = await check('POST /api/courses (instructor)', 'POST', '/api/courses', 201, { token: ian, body: { course_code: code, course_name: 'Temporary check course', status: 'draft' } });
  const tmp = made && made.json && made.json.data;
  if (tmp) {
    await check('POST /api/courses (student -> 403)', 'POST', '/api/courses', 403, { token: mia, body: { course_code: 'NOPE', course_name: 'x' } });
    await check('POST /api/courses (duplicate code -> 409)', 'POST', '/api/courses', 409, { token: ian, body: { course_code: code, course_name: 'dup' } });
    await check('POST /api/courses (missing name -> 400)', 'POST', '/api/courses', 400, { token: ian, body: { course_code: 'ONLYCODE' } });
    await check('GET  /api/courses/:id (new course)', 'GET', `/api/courses/${tmp.course_id}`, 200, { token: ian });
    await check('PUT  /api/courses/:id', 'PUT', `/api/courses/${tmp.course_id}`, 200, { token: ian, body: { course_name: 'Renamed check course' } });
    const newMod = await check('POST /api/courses/:id/modules', 'POST', `/api/courses/${tmp.course_id}/modules`, 201, { token: ian, body: { title: 'Temp module' } });
    const tm = newMod && newMod.json && newMod.json.data;
    if (tm) {
      await check('PUT  /api/modules/:id', 'PUT', `/api/modules/${tm.module_id}`, 200, { token: ian, body: { title: 'Temp module renamed' } });
      await check('DELETE /api/modules/:id', 'DELETE', `/api/modules/${tm.module_id}`, [200, 204], { token: ian });
    }
    await check('DELETE /api/courses/:id', 'DELETE', `/api/courses/${tmp.course_id}`, [200, 204], { token: ian });
    await check('GET  /api/courses/:id after delete (-> 404)', 'GET', `/api/courses/${tmp.course_id}`, 404, { token: ian });
  }

  const lessons = rows(await check('GET  /api/modules/:id/lessons', 'GET', `/api/modules/${m1.module_id}/lessons`, 200, { token: mia }));
  if (lessons[0]) {
    await check('GET  /api/lessons/:id', 'GET', `/api/lessons/${lessons[0].lesson_id}`, 200, { token: mia });
    await check('GET  /api/lessons/:id/resources', 'GET', `/api/lessons/${lessons[0].lesson_id}/resources`, 200, { token: mia });
    await check('GET  /api/lessons/:id/progress', 'GET', `/api/lessons/${lessons[0].lesson_id}/progress`, 200, { token: mia });
  }
  await check('GET  /api/progress/me', 'GET', '/api/progress/me', 200, { token: mia });

  const quizzes = rows(await check('GET  /api/modules/:id/quizzes', 'GET', `/api/modules/${m1.module_id}/quizzes`, 200, { token: mia }));
  if (quizzes[0]) {
    const qid = quizzes[0].quiz_id;
    await check('GET  /api/quizzes/:id', 'GET', `/api/quizzes/${qid}`, 200, { token: mia });
    const qs = await check('GET  /api/quizzes/:id/questions', 'GET', `/api/quizzes/${qid}/questions`, 200, { token: mia });
    const leaked = rows(qs).some((q) => q.correct_answer !== undefined);
    report(!leaked, 'Student must NOT see correct_answer', leaked ? 'LEAK' : 'ok', leaked ? 'answer key is visible to students' : '');
    await check('GET  /api/quizzes/:id/attempts', 'GET', `/api/quizzes/${qid}/attempts`, 200, { token: mia });
  }

  const assignments = rows(await check('GET  /api/modules/:id/assignments', 'GET', `/api/modules/${m1.module_id}/assignments`, 200, { token: mia }));
  if (assignments[0]) {
    await check('GET  /api/assignments/:id', 'GET', `/api/assignments/${assignments[0].assignment_id}`, 200, { token: mia });
    await check('GET  /api/assignments/:id/submissions', 'GET', `/api/assignments/${assignments[0].assignment_id}/submissions`, 200, { token: mia });
  }
  const discussions = rows(await check('GET  /api/modules/:id/discussions', 'GET', `/api/modules/${m1.module_id}/discussions`, 200, { token: mia }));
  if (discussions[0]) {
    await check('GET  /api/discussions/:id', 'GET', `/api/discussions/${discussions[0].discussion_id}`, 200, { token: mia });
    await check('GET  /api/discussions/:id/replies', 'GET', `/api/discussions/${discussions[0].discussion_id}/replies`, 200, { token: mia });
  }

  await check('GET  /api/enrollments', 'GET', '/api/enrollments', 200, { token: mia });
  await check('GET  /api/courses/:id/announcements', 'GET', `/api/courses/${dbms.course_id}/announcements`, 200, { token: mia });
  await check('GET  /api/notifications', 'GET', '/api/notifications', 200, { token: mia });
  await check('GET  /api/notifications?unread=true', 'GET', '/api/notifications?unread=true', 200, { token: mia });

  const accessOf = async (token) => {
    const r = await call('GET', `/api/modules/${m2.module_id}/access`, { token });
    return r.json && r.json.data;
  };
  const noahAccess = await accessOf(noah);
  report(noahAccess && noahAccess.unlocked === false, 'Adaptive: Noah (74%) -> Module 2 LOCKED', noahAccess ? 200 : 'ERR', noahAccess ? '' : 'no data');
  const liamAccess = await accessOf(liam);
  report(liamAccess && liamAccess.unlocked === true, 'Adaptive: Liam (75%) -> Module 2 UNLOCKED', liamAccess ? 200 : 'ERR', liamAccess ? '' : 'no data');
  const miaAccess = await accessOf(mia);
  report(miaAccess && miaAccess.unlocked === true, 'Adaptive: Mia (passed) -> Module 2 UNLOCKED', miaAccess ? 200 : 'ERR');
  await check('GET  /api/courses/:id/progress', 'GET', `/api/courses/${dbms.course_id}/progress`, 200, { token: stella });
  await check('GET  /api/modules/:id/unlock-candidates (instructor)', 'GET', `/api/modules/${m2.module_id}/unlock-candidates`, 200, { token: ian });
  await check('GET  /api/modules/:id/unlocks (instructor)', 'GET', `/api/modules/${m2.module_id}/unlocks`, 200, { token: ian });
  await check('GET  /api/modules/:id/unlocks (student -> 403)', 'GET', `/api/modules/${m2.module_id}/unlocks`, 403, { token: noah });

  for (const name of ['student-roles', 'course-modules', 'lessons-without-resources', 'quiz-questions', 'assignments-without-submissions', 'enrollment-activity']) {
    const r = await check(`GET  /api/reports/${name}`, 'GET', `/api/reports/${name}`, 200, { token: admin });
    if (r && r.status === 200) console.log(`        ${rows(r).length} rows`);
  }
  await check('GET  /api/reports/student-roles (student -> 403)', 'GET', '/api/reports/student-roles', 403, { token: mia });

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) {
    console.log('\nFailed checks:');
    failures.forEach((f) => console.log('  - ' + f));
    process.exitCode = 1;
  } else {
    console.log('Everything checked is working.');
  }
})();
