// Fourteenth build step: student contact number (from the fee sheet) shown to the IOI Team, searchable and in downloads.
const fs = require('fs');
function patcher(file) { let h = fs.readFileSync(file, 'utf8');
  const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error(file + ': anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
  return { rep, save: () => fs.writeFileSync(file, h) }; }
const A = patcher('api/portal.js');
A.rep(`const [id, name, prog, sch, email, code, flexiUpto, note] = r;`, `const [id, name, prog, sch, email, code, flexiUpto, note, phone] = r;`);
A.rep(`if (note) st.flags = [String(note)];`, `if (note) st.flags = [String(note)];\n  if (phone) st.phone = String(phone).trim();`);
A.rep(`if (admin) { o.email = st.email;`, `if (admin) { o.email = st.email; if (st.phone) o.phone = st.phone;`);
A.save();
const P = patcher('public/index.html');
P.rep(`'</b> sees. Sign-in email: ' + (ps.email ? esc(ps.email) : 'not added yet') +`, `'</b> sees. Sign-in email: ' + (ps.email ? esc(ps.email) : 'not added yet') + (ps.phone ? '. Contact number: <span class="mono">' + esc(ps.phone) + '</span>' : '') +`);
P.rep(`x.hay = (x.id + ' ' + (x.st.name || '') + ' ' + (x.st.email || '') + ' ' + program(x.st)).toLowerCase();`, `x.hay = (x.id + ' ' + (x.st.name || '') + ' ' + (x.st.email || '') + ' ' + (x.st.phone || '') + ' ' + program(x.st)).toLowerCase();`);
P.rep(`'Scholarship %','Email','Semester',`, `'Scholarship %','Email','Contact number','Semester',`);
P.rep(`C.sch, st.email || '', r.n,`, `C.sch, st.email || '', st.phone || '', r.n,`);
P.rep(`placeholder="Search by enrollment ID, name or email"`, `placeholder="Search by enrollment ID, name, email or phone"`);
P.save();
console.log('built step 14');
