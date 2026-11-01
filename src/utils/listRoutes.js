const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'routes');
const index = fs.readFileSync(path.join(dir, 'index.js'), 'utf8');

const mounts = [];
for (const m of index.matchAll(/router\.use\(\s*(?:'([^']*)'\s*,\s*)?require\('\.\/([\w.-]+)'\)\s*\)/g)) {
  mounts.push({ prefix: m[1] || '', file: m[2] });
}

const rows = [];
for (const m of index.matchAll(/router\.(get|post|put|delete)\(\s*'([^']+)'/g)) {
  rows.push({ method: m[1].toUpperCase(), url: '/api' + m[2], access: 'public', file: 'index.js' });
}
for (const { prefix, file } of mounts) {
  const src = fs.readFileSync(path.join(dir, file + '.js'), 'utf8');
  const fileWide = /router\.use\(\s*auth\s*,\s*role\(/.test(src) ? 'staff' : /router\.use\(\s*auth\s*\)/.test(src) ? 'login' : null;
  for (const line of src.split('\n')) {
    const m = line.match(/router\.(get|post|put|delete)\(\s*'([^']*)'(.*)/);
    if (!m) continue;
    const rest = m[3];
    let access = fileWide || 'public';
    if (/\bauth\b/.test(rest) && access === 'public') access = 'login';
    if (/\bstaff\b/.test(rest)) access = 'staff';
    else if (/\bstudent\b/.test(rest)) access = 'student only';
    else if (/role\(ROLES\.ADMIN\)/.test(rest)) access = 'admin only';
    else if (/role\(/.test(rest)) access = 'role-restricted';
    rows.push({ method: m[1].toUpperCase(), url: '/api' + prefix + (m[2] === '/' ? '' : m[2]), access, file: file + '.js' });
  }
}

const w = (k, min) => Math.max(min, ...rows.map((r) => r[k].length));
const wm = w('method', 6), wu = w('url', 10), wa = w('access', 6);
console.log(`${'METHOD'.padEnd(wm)}  ${'URL'.padEnd(wu)}  ${'ACCESS'.padEnd(wa)}  FILE`);
console.log('-'.repeat(wm + wu + wa + 12));
for (const r of rows) console.log(`${r.method.padEnd(wm)}  ${r.url.padEnd(wu)}  ${r.access.padEnd(wa)}  routes/${r.file}`);
console.log(`\n${rows.length} routes`);
