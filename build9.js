// Ninth build step: laptop concession. IOI Team (Full or Super admin) sets an amount on a semester;
// it is taken off that semester's total payable, and any amount above it is carried into the following semesters.
const fs = require('fs');
function patcher(file) { let h = fs.readFileSync(file, 'utf8');
  const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error(file + ': anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
  return { rep, before: (a, b) => rep(a, b + a), after: (a, b) => rep(a, a + b), save: () => fs.writeFileSync(file, h) }; }

const P = patcher('public/index.html');
// fee engine
P.before(`return { rows, F, sch: Number(st.sch) || 0`, `let lapPool = 0; const lapSrc = [];
rows.forEach(row => { const c = sems[row.n] || {}; row.laptopSet = Number(c.laptop) > 0 ? R(Number(c.laptop)) : 0; row.laptopNote = c.laptopNote || '';
if (row.laptopSet) { lapPool += row.laptopSet; lapSrc.push(row.n); }
const use = Math.min(lapPool, Math.max(0, row.total)); row.laptop = use; row.laptopFrom = use ? lapSrc.slice() : []; lapPool -= use; row.laptopCarry = lapPool; if (!lapPool) lapSrc.length = 0;
row.total = row.total - use; row.monthly = R(row.total / FEE.MONTHS); });
const laptopLeft = lapPool;
`);
P.rep(`return { rows, F, sch: Number(st.sch) || 0`, `return { laptopLeft, rows, F, sch: Number(st.sch) || 0`);
// statement
P.before(`t += '<tr class="tot"><td>Total payable for Semester '`, `if (r.laptop || r.laptopSet) t += '<tr><td>Laptop concession<small>' + (r.laptopSet ? inr(r.laptopSet) + ' approved in Semester ' + n + (r.laptopNote ? ': ' + esc(r.laptopNote) : '') + '. ' : '') + (r.laptopFrom.some(x => x !== n) ? 'Includes the balance carried from Semester ' + r.laptopFrom.filter(x => x !== n).join(', ') + '. ' : '') + (r.laptopCarry ? inr(r.laptopCarry) + ' is more than this semester&rsquo;s fee and moves to Semester ' + (n + 1) + '.' : '') + '</small></td><td class="r">' + inr(-r.laptop) + '</td></tr>';
`);
P.rep(`if (!x.hostelIn) tags.push('<span class="pill">Hostel opted out</span>');`, `if (!x.hostelIn) tags.push('<span class="pill">Hostel opted out</span>'); if (x.laptop) tags.push('<span class="pill good">Laptop ' + inr(-x.laptop) + '</span>');`);
P.rep(`r.adj.forEach(a => o.push(a.label));`, `r.adj.forEach(a => o.push(a.label)); if (r.laptopSet) o.push('Laptop concession of Rs ' + r.laptopSet + ' approved' + (r.laptopNote ? ' (' + r.laptopNote + ')' : '')); if (r.laptop && r.laptopFrom.some(x => x !== r.n)) o.push('Laptop concession balance of Rs ' + r.laptop + ' carried from Sem ' + r.laptopFrom.filter(x => x !== r.n).join(', ')); if (r.laptopCarry) o.push('Laptop balance Rs ' + r.laptopCarry + ' moved to next semester');`);
P.rep(`'Carried forward total','Total payable','Monthly mandate','Remarks'`, `'Carried forward total','Laptop concession','Total payable','Monthly mandate','Remarks'`);
P.rep(`r.cf, r.total, r.n >= 5 ? r.monthly : '', remarksOf(r)`, `r.cf, -r.laptop, r.total, r.n >= 5 ? r.monthly : '', remarksOf(r)`);
P.rep(`(r.adjTotal ? '<tr><td>Adjustments</td><td class="r">' + inr(r.adjTotal) + '</td></tr>' : '') +`, `(r.adjTotal ? '<tr><td>Adjustments</td><td class="r">' + inr(r.adjTotal) + '</td></tr>' : '') +
(r.laptop ? '<tr><td>Laptop concession</td><td class="r">' + inr(-r.laptop) + '</td></tr>' : '') +`);
P.rep(`<span><span class="small muted">Total payable</span><br><b>' + inr(r5.total)`, `<span><span class="small muted">Laptop concession</span><br><b>' + inr(-r5.laptop) + '</b></span><span><span class="small muted">Total payable</span><br><b>' + inr(r5.total)`);
// editor section, IOI Team with edit rights only
P.before(`h += '</tbody></table></div></section><section class="card stack"><h2>One-off adjustments</h2>`, `h += '</tbody></table></div></section>' + laptopHTML(d) + '<!--lap-->';
`);
P.rep(`'<!--lap-->';
h += '</tbody></table></div></section><section class="card stack"><h2>One-off adjustments</h2>`, `'';
h += '<section class="card stack"><h2>One-off adjustments</h2>`);
P.before(`/* ---------- data ---------- */`, `function laptopHTML(d){ const C = computeFees(d); let h = '<section class="card stack"><h2>Laptop concession</h2><p class="small muted">Waive the laptop cost for this student. It comes off the total payable of the semester you choose. If it is more than that semester&rsquo;s fee, the balance is taken off the next semester, and so on.</p>';
const set = C.rows.filter(r => r.laptopSet);
if (set.length) set.forEach(r => { h += '<div class="row"><span class="pill good">Sem ' + r.n + '</span><span class="grow">' + inr(r.laptopSet) + (r.laptopNote ? ' &middot; ' + esc(r.laptopNote) : '') + '</span><button class="btn ghost danger" type="button" data-act="lapdel" data-n="' + r.n + '">Remove</button></div>'; });
else h += '<p class="small muted">No laptop concession applied.</p>';
const used = C.rows.filter(r => r.laptop).map(r => 'Sem ' + r.n + ': ' + inr(r.laptop));
if (used.length) h += '<p class="small">Taken off: ' + used.join(', ') + (C.laptopLeft ? '. <b>' + inr(C.laptopLeft) + ' could not be used</b> because Semester 8 is fully covered.' : '.') + '</p>';
h += '<form id="lapForm" class="row" style="align-items:flex-end"><label class="f">Semester<select id="lap-n">' + [1,2,3,4,5,6,7,8].map(i => '<option' + (i === 5 ? ' selected' : '') + '>' + i + '</option>').join('') + '</select></label><label class="f">Laptop amount (&#8377;)<input type="number" id="lap-a" min="1" step="1" required value="50000" style="width:140px"></label><label class="f grow">Remark<input type="text" id="lap-r" maxlength="160" placeholder="For example: Laptop fee waived, approved by"></label><button class="btn primary" type="submit">Apply laptop concession</button></form>';
return h + '</section>'; }
document.addEventListener('submit', ev => { const f = ev.target; if (f.id !== 'lapForm' || !S.draft) return; ev.preventDefault();
const n = Number($('#lap-n').value), a = Math.round(Number($('#lap-a').value) || 0); if (!(a > 0)) return;
const c = semCfg(n); c.laptop = a; const r = $('#lap-r').value.trim(); if (r) c.laptopNote = r; else delete c.laptopNote;
S.dirty = true; S.edMsg = 'Laptop concession added to Semester ' + n + '. Click Save changes to apply it.'; S.viewSem = n; render(); });
document.addEventListener('click', ev => { const el = ev.target.closest('[data-act="lapdel"]'); if (!el || !S.draft) return;
const c = semCfg(Number(el.dataset.n)); delete c.laptop; delete c.laptopNote; S.dirty = true; S.edMsg = ''; render(); });
`);
P.save();

// server: keep the laptop fields when saving; describe them in the activity log
const A = patcher('api/portal.js');
A.after(`if (c.note) o.note = String(c.note).slice(0, 300);`, `
    if (Number(c.laptop) > 0) { o.laptop = Math.round(Math.min(Number(c.laptop), 1e6)); if (c.laptopNote) o.laptopNote = String(c.laptopNote).slice(0, 160); }`);
A.save();
const X = patcher('api/_extra.js');
X.before(`if (c.courseAmt != null) o.push('manual course fee Rs ' + c.courseAmt);`, `if (c.laptop) o.push('laptop concession Rs ' + c.laptop + (c.laptopNote ? ' (' + c.laptopNote + ')' : '')); `);
X.save();
console.log('built step 9');
