// Build step: applies the fee-team tools (add/remove students, sheet and PDF downloads) to index.html and writes public/index.html.
const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
const before = (a, b) => rep(a, b + a);

before(`</style>`, `input[type=password]{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:7px 10px}
#print{display:none}
@media print{
html:root:root{color-scheme:light;--bg:#fff;--surface:#fff;--sunken:#eef2f0;--ink:#111;--muted:#555;--line:#c9d1ce;--accent:#0b6b5d;--accent-soft:#dff0ec;--carry:#a85a06;--carry-soft:#fbecd6;--info:#2b5ea7;--info-soft:#e3ecf9}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
header,main{display:none!important}#print{display:block;padding:0 4px}body{background:#fff;font-size:12px}
.noprint,.chips{display:none!important}.card{border:0;padding:6px 0;break-inside:avoid}.pg{break-after:page}.pg:last-child{break-after:auto}
.hero{grid-template-columns:1fr 1fr}.hero .big{font-size:30px}h2{font-size:16px}.idrow h1{font-size:20px}th,td{padding:4px 8px}
}
`);
rep(`</main>`, `</main>\n<div id="print"></div>`);
rep(`'Flexi Pay, monthly') + '</span></div></section>';`, `'Flexi Pay, monthly') + '</span></div><div class="noprint" style="margin-top:10px"><button class="btn" type="button" data-act="pdf" data-id="' + esc(id) + '">Download PDF of this statement</button></div></section>';`);
rep(`let h = '<section class="card stack"><div><h2>Found a discrepancy?`, `let h = '<section class="card stack noprint"><div><h2>Found a discrepancy?`);
before(`const q = S.q.trim().toLowerCase();`, `h += (S.addMsg ? '<div class="notice info">' + esc(S.addMsg) + '</div>' : '') +
'<section class="card stack"><div class="row"><h2 class="grow">Downloads</h2><button class="btn" data-act="csv5">Sem 5 bifurcation (sheet)</button><button class="btn" data-act="csvall">All semesters (sheet)</button><button class="btn" data-act="pdfall">All Sem 5 statements (PDF)</button></div><p class="small muted">Sheets download as CSV files that open in Excel and Google Sheets, with a remarks column. For a PDF, choose &ldquo;Save as PDF&rdquo; in the print window that opens. One student&rsquo;s PDF is on their statement.</p></section>' +
'<details class="card"' + (S.addOpen ? ' open' : '') + '><summary style="cursor:pointer;font-weight:600">Add a student</summary><form id="addForm" class="row" style="margin-top:12px;align-items:flex-end"><label class="f">Enrollment ID<input type="text" id="ad-id" inputmode="numeric" pattern="[0-9]{10}" required style="width:130px"></label><label class="f grow">Name<input type="text" id="ad-name" maxlength="80" required></label><label class="f">Programme<select id="ad-prog"><option value="SOT-1">SOT, Phase 01</option><option value="SOT-2">SOT, Phase 02</option><option value="SOM-1">SOM, Phase 01</option></select></label><label class="f">Scholarship %<input type="number" id="ad-sch" min="0" max="100" value="0" style="width:90px"></label><label class="f grow">Email<input type="email" id="ad-email" placeholder="Can be added later"></label><button class="btn primary" type="submit">Add student</button></form><p class="small muted" style="margin-top:8px">The student starts on the standard structure, in the hostel. An access code is created for them. Ask in chat for any concession, hostel or fee change.</p></details>';
if ((S.removed || []).length) h += '<section class="card stack"><h3>Removed students</h3>' + S.removed.map(x => '<div class="row"><span class="mono">' + esc(x.id) + '</span><span class="grow">' + esc(x.name) + '</span><button class="btn" data-act="restore" data-id="' + esc(x.id) + '">Restore</button></div>').join('') + '</section>';
`);
rep(`'.</span><button class="btn" data-act="endpreview">Back to all students</button></div>' +`, `'. Access code: <span class="mono">' + esc(ps.code || 'none') + '</span>.</span>' + (S.confirmRemove ? '<button class="btn danger" data-act="removeyes">Yes, remove ' + esc(ps.name) + '</button><button class="btn" data-act="removeno">Cancel</button>' : '<button class="btn danger" data-act="remove">Remove student</button>') + '<button class="btn" data-act="endpreview">Back to all students</button></div>' +`);
before(`/* ---------- render ---------- */`, `function remarksOf(r){ const o = []; if (r.conc) o.push((r.conc.type || 'Concession') + ' concession' + (r.conc.note ? ': ' + r.conc.note : '')); if (r.note) o.push(r.note); if (r.manual) o.push('Course fee set by fee office'); if (r.hostelPartial) o.push('Hostel fee set by fee office'); r.adj.forEach(a => o.push(a.label)); if (!r.hostelIn) o.push('Hostel opted out'); return o; }
function printDoc(list, n){
const keep = S.viewSem; S.viewSem = n;
const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
$('#print').innerHTML = list.map(p => { const C = computeFees(p[1]); const rm = [];
C.rows.forEach(r => remarksOf(r).forEach(x => rm.push('Sem ' + r.n + ': ' + x)));
return '<div class="pg"><div class="row" style="border-bottom:2px solid var(--ink);padding-bottom:6px;margin-bottom:6px"><h2 class="grow">Flexi Pay fee statement</h2><span class="small muted">Batch 2024\\u201328, Bangalore Campus. Generated ' + today + '</span></div>' + statementHTML(p[1], p[0]) +
'<section class="card"><h2>Remarks</h2>' + (rm.length ? '<ul class="plain">' + rm.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted">Standard fee structure. No changes recorded.</p>') + '</section></div>'; }).join('');
S.viewSem = keep; setTimeout(() => window.print(), 80);
}
function exportCSV(onlySem){
const cell = v => { v = v == null ? '' : String(v); return /[",\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const out = [['Enrollment ID','Name','Programme','Scholarship %','Email','Semester','Hostel','Course fee','Scholarship','Concession type','Concession amount','Fee office adjustment','Course fee payable','Hostel fee payable','One-off adjustments','Semester fee','Carried forward: course','Carried forward: hostel','Carried forward total','Total payable','Monthly mandate','Remarks']];
ids().forEach(id => { const st = S.students[id], C = computeFees(st);
C.rows.filter(r => !onlySem || r.n === onlySem).forEach(r => out.push([id, st.name, program(st).replace(' \\u00b7 ', ', '), C.sch, st.email || '', r.n, r.hostelIn ? 'In' : 'Out', r.gross, -r.schAmt, r.conc ? r.conc.type : '', -r.concAmt, r.manual, r.course, r.hostel, r.adjTotal, r.current, r.courseCF, r.hostelCF, r.cf, r.total, r.monthly, remarksOf(r).join('; ')])); });
const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\\ufeff' + out.map(r => r.map(cell).join(',')).join('\\r\\n')], { type: 'text/csv;charset=utf-8' }));
a.download = 'flexipay-fee-bifurcation-' + (onlySem ? 'sem' + onlySem : 'all-semesters') + '.csv'; document.body.appendChild(a); a.click(); a.remove();
}
`);
rep(`function openEditor(id){ if (!S.students[id]) return; S.previewId = id;`, `function openEditor(id){ if (!S.students[id]) return; S.confirmRemove = false; S.addMsg = ''; S.previewId = id;`);
rep(`S.tickets = d.tickets || []; S.session = { user: { id: 'x' } };`, `S.tickets = d.tickets || []; S.removed = d.removed || []; S.session = { user: { id: 'x' } };`);
before(`else if (act === 'signout') signOut();`, `else if (act === 'pdf') { const id = el.dataset.id; printDoc([[id, S.isAdmin ? S.students[id] : S.mine]], S.viewSem); }
else if (act === 'pdfall') printDoc(ids().map(i => [i, S.students[i]]), 5);
else if (act === 'csv5') exportCSV(5);
else if (act === 'csvall') exportCSV(0);
else if (act === 'remove') { S.confirmRemove = true; render(); }
else if (act === 'removeno') { S.confirmRemove = false; render(); }
else if (act === 'removeyes' || act === 'restore') { try { const d = await api(act === 'restore' ? 'restoreStudent' : 'removeStudent', { id: act === 'restore' ? el.dataset.id : S.previewId }); S.confirmRemove = false; S.previewId = null; apply(d); S.addMsg = act === 'restore' ? 'Student restored.' : 'Student removed. They can no longer sign in.'; render(); } catch (e) { if (e.message !== 'expired') { S.previewId = null; S.addMsg = e.message; render(); } } }
`);
before(`else if (f.dataset.form === 'reply')`, `else if (f.id === 'addForm') { try { const d = await api('addStudent', { id: $('#ad-id').value.trim(), name: $('#ad-name').value.trim(), prog: $('#ad-prog').value, sch: Number($('#ad-sch').value) || 0, email: $('#ad-email').value.trim().toLowerCase() }); apply(d); S.addOpen = false; S.addMsg = 'Added ' + d.addedName + '. Their access code is ' + d.addedCode + '.'; render(); } catch (e) { if (e.message !== 'expired') { S.addOpen = true; S.addMsg = e.message; render(); } } }
`);
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/index.html', h);
console.log('built public/index.html', h.length);
