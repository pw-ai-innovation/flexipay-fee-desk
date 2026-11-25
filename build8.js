// Eighth build step: Sem 5 interns pay a fixed academic fee of Rs 20,000 and, if in the hostel, a fixed hostel fee of Rs 93,900.
// Adds a two-switch "Semester 5 setup" panel to the student editor.
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
const before = (a, b) => rep(a, b + a);
// fee engine
rep(`INTERN: 20000 };`, `INTERN: 20000, INTERN_H: 93900 };`);
rep(`const hostel = inH ? (c.hostelAmt != null ? Number(c.hostelAmt) : (flexi ? FEE.FLEXI_H : FEE.H)) : 0;`,
`const internH = inH && c.hostelAmt == null && !!cc && cc.type === 'Internship' && n === 5;
const hostel = inH ? (c.hostelAmt != null ? Number(c.hostelAmt) : internH ? FEE.INTERN_H : (flexi ? FEE.FLEXI_H : FEE.H)) : 0;`);
rep(`conc: cc, fix, concAmt: R(concAmt),`, `conc: cc, fix, internH, concAmt: R(concAmt),`);
// statement wording
rep(`(r.hostelPartial ? '<small>Amount set by IOI Team</small>'`, `(r.hostelPartial ? '<small>Amount set by IOI Team</small>' : r.internH ? '<small>Fixed hostel fee for students on internship</small>'`);
rep(`Internship concession in Semester 5 always makes the course fee a fixed &#8377;20,000; with the hostel that is &#8377;93,900, plus the carried-forward amount.`, `Internship concession in Semester 5 always sets the academic fee to a fixed &#8377;20,000 and, if the student stays in the hostel, the hostel fee to a fixed &#8377;93,900. The carried-forward amount is added on top.`);
rep(`with Hostel = In the semester fee is &#8377;93,900.`, `with Hostel = In the hostel fee is a fixed &#8377;93,900 (&#8377;1,13,900 in all). You never type the academic or hostel fee yourself. Older templates with a Concession type column still work.`);
// two-switch panel in the editor
before(`'<div class="editor"><div class="stack"><section class="card"><h2>Hostel, concession and fee by semester</h2>`, `'<section class="card stack"><h2>Semester 5 setup</h2><p class="small muted">Answer two questions. The fees are filled in for you.</p><div class="row" style="gap:28px">' +
'<label class="switch"><input type="checkbox" id="q-h5"' + (((d.sems || {})[5] || {}).hostel !== false ? ' checked' : '') + '><span>Staying in hostel in Semester 5</span></label>' +
'<label class="switch"><input type="checkbox" id="q-i5"' + ((((d.sems || {})[5] || {}).conc || {}).type === 'Internship' ? ' checked' : '') + '><span>Internship concession in Semester 5</span></label></div>' +
(function(){ const r5 = computeFees(d).rows[4]; return '<div class="row num" style="gap:24px"><span><span class="small muted">Academic fee</span><br><b>' + inr(r5.course) + '</b></span><span><span class="small muted">Hostel fee</span><br><b>' + inr(r5.hostel) + '</b></span><span><span class="small muted">Carried forward</span><br><b>' + inr(r5.cf) + '</b></span><span><span class="small muted">Total payable</span><br><b>' + inr(r5.total) + '</b></span><span><span class="small muted">Monthly mandate</span><br><b>' + inr(r5.monthly) + '</b></span></div>'; })() + '</section>' +
`);
before(`/* ---------- data ---------- */`, `document.addEventListener('change', ev => { const el = ev.target; if (!S.draft || !S.editId || (el.id !== 'q-h5' && el.id !== 'q-i5')) return;
const c = semCfg(5);
if (el.id === 'q-h5') { if (el.checked) delete c.hostel; else c.hostel = false; }
else if (el.checked) c.conc = { type: 'Internship', mode: 'fixed', value: FEE.INTERN, note: (c.conc && c.conc.note) || '' };
else if (c.conc && c.conc.type === 'Internship') delete c.conc;
S.dirty = true; S.edMsg = ''; S.viewSem = 5; render(); });
`);
fs.writeFileSync('public/index.html', h);
console.log('built step 8', h.length);
