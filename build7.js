// Seventh build step: simpler bulk template. Only Hostel (In/Out) and Internship (Yes/No); no percentage.
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
rep(`[['Enrollment ID', 'Name (for reference)', 'Semester', 'Hostel (In/Out)', 'Concession type', 'Concession value', '% or Rs', 'Remark']].concat(ids().map(id => { const st = S.students[id], c = (st.sems || {})[5] || {}, cc = c.conc; return [id, st.name, 5, c.hostel === false ? 'Out' : 'In', cc ? cc.type : '', cc ? cc.value : '', cc ? (cc.mode === 'flat' ? 'Rs' : '%') : '', cc ? cc.note || '' : c.note || '']; }))`,
`[['Enrollment ID', 'Name (for reference)', 'Semester', 'Hostel (In/Out)', 'Internship (Yes/No)', 'Remark', 'Sem 5 fee now (for reference)', 'Carried forward (for reference)', 'Total payable now (for reference)']].concat(ids().map(id => { const st = S.students[id], c = (st.sems || {})[5] || {}, cc = c.conc, r = computeFees(st).rows[4]; return [id, st.name, 5, c.hostel === false ? 'Out' : 'In', cc && cc.type === 'Internship' ? 'Yes' : 'No', cc ? cc.note || '' : c.note || '', r.current, r.cf, r.total]; }))`);
rep(`remark: find('remark', 'reason', 'note') }; table.shift(); }`, `remark: find('remark', 'reason', 'note'), intern: find('internship') }; table.shift(); }`);
rep(`if (!S.students[row.id]) errors.push('Row ' + (i + 1) + ': enrollment ID "' + row.id + '" is not in the portal');
else if (row.hostel || row.ctype || row.remark) rows.push(row); });`,
`if (!S.students[row.id]) { errors.push('Row ' + (i + 1) + ': enrollment ID "' + row.id + '" is not in the portal'); return; }
const cur = (S.students[row.id].sems || {})[Number(row.sem) || 5] || {}, curNote = (cur.conc ? cur.conc.note : cur.note) || '';
let yn = idx.intern >= 0 ? g('intern') : '';
if (idx.intern == null && /^(yes|no|y|n)$/i.test(row.ctype)) { yn = row.ctype; row.remark = String(r[4] == null ? '' : r[4]).trim(); row.ctype = ''; row.cval = ''; row.cmode = ''; }
if (yn) { if (/^(yes|y)$/i.test(yn)) row.ctype = 'Internship'; else if (/^(no|n)$/i.test(yn)) row.ctype = cur.conc && cur.conc.type === 'Internship' ? 'None' : ''; else { errors.push('Row ' + (i + 1) + ': Internship must be Yes or No'); return; } }
const hOut = /^(out|no|n|opt.?out|opted out)$/i.test(row.hostel), hIn = /^(in|yes|y|opt.?in|opted in)$/i.test(row.hostel);
const hChange = (hOut && cur.hostel !== false) || (hIn && cur.hostel === false) || (row.hostel && !hOut && !hIn);
const cChange = row.ctype && !(row.ctype === 'Internship' && cur.conc && cur.conc.type === 'Internship' && !row.cval);
if (!hChange) row.hostel = '';
if (hChange || cChange || (row.remark && row.remark !== curNote)) rows.push(row); });`);
rep(`S.bulk.msg = S.bulk.rows.length ? 'Ready. Check the preview, then apply.' : 'Nothing to apply.';`, `S.bulk.msg = S.bulk.rows.length ? 'Ready. Only rows that change something are listed. Check them, then apply.' : 'No changes found compared with what is already saved.';`);
rep(`One line per student and semester, in this order: Enrollment ID, Semester, Hostel (In or Out), Concession type (Internship, Academic, Special scholarship, Other, or None to remove), Concession value, % or Rs, Remark. Leave a cell empty to keep what is already there. The template lists every student for Semester 5 with their current hostel and concession.`,
`Download the template and change only two columns: <b>Hostel</b> (In or Out) and <b>Internship</b> (Yes or No). No percentage is needed. In Semester 5, Internship = Yes makes the course fee a fixed &#8377;20,000; with Hostel = In the semester fee is &#8377;93,900. The carried-forward amount is added automatically. Rows you leave unchanged are ignored. To paste instead of uploading, use this order: Enrollment ID, Semester, Hostel, Internship, Remark.`);
rep(`placeholder="2401010015, 5, In, Internship, 15, %, Internship at Acme"`, `placeholder="2401010015, 5, In, Yes, Internship at Acme"`);
rep(`Bulk update: hostel and concession</summary>`, `Bulk update: hostel and internship</summary>`);
fs.writeFileSync('public/index.html', h);
console.log('built step 7', h.length);
