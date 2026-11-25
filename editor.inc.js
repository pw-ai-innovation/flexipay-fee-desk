function semCfg(n){ const d = S.draft; d.sems = d.sems || {}; return d.sems[n] = d.sems[n] || {}; }
function canEdit(){ return S.perm === 'full' || S.perm === 'super'; }
function editorHTML(){
const id = S.editId, d = S.draft;
let h = '<div class="row"><button class="btn ghost" data-act="edback">&larr; All students</button><div class="grow"></div><button class="btn" data-act="edpreview">Preview as student</button><button class="btn" data-act="eddiscard"' + (S.dirty ? '' : ' disabled') + '>Discard changes</button><button class="btn primary" data-act="edsave" id="saveBtn"' + (S.dirty && !S.busy ? '' : ' disabled') + '>Save changes</button></div>';
if (S.edMsg) h += '<div class="notice info">' + esc(S.edMsg) + '</div>';
h += '<section class="card"><div class="idrow"><h1>' + esc(d.name) + '</h1><span class="mono muted">' + esc(id) + '</span></div><div class="kv"><span><b>Programme</b>' + esc(program(d)) + '</span><span><b>Scholarship</b><input type="number" id="ed-sch" min="0" max="100" step="1" value="' + (d.sch || 0) + '" style="width:70px" aria-label="Scholarship percent"> %</span>' + (d.edited ? '<span><b>Last changed on the portal</b>' + esc(d.edited.by) + ', ' + fmtDate(d.edited.at) + '</span>' : '') + '</div></section>';
h += '<div class="editor"><div class="stack"><section class="card"><h2>Hostel, concession and fee by semester</h2><p class="small muted" style="margin-bottom:8px">Each semester is set on its own. A concession reduces that semester&rsquo;s course fee after scholarship, not the amount carried forward. To override the calculation, type a manual course fee or hostel fee; leave them empty for the standard amount. The monthly mandate always follows the semester total.</p><div class="scroll"><table class="semtable"><thead><tr><th>Semester</th><th>Hostel</th><th>Concession</th><th>Value</th></tr></thead><tbody>';
for (let n = 1; n <= 8; n++) { const c = (d.sems || {})[n] || {}, cc = c.conc || {};
h += '<tr><td><b>Sem ' + n + '</b><br><span class="small muted">' + (n < 5 ? 'Past' : n === 5 ? 'Current' : 'Upcoming') + '</span></td>' +
'<td><label class="switch"><input type="checkbox" id="ed-h-' + n + '" data-ed="hostel" data-n="' + n + '"' + (c.hostel !== false ? ' checked' : '') + '><span>' + (c.hostel !== false ? 'Opted in' : 'Opted out') + '</span></label></td>' +
'<td><select id="ed-t-' + n + '" data-ed="ctype" data-n="' + n + '" aria-label="Concession type, semester ' + n + '"><option value="">None</option>' + CONC_TYPES.map(t => '<option' + (cc.type === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></td>' +
'<td><div class="row" style="flex-wrap:nowrap;gap:6px"><input type="number" id="ed-v-' + n + '" data-ed="cval" data-n="' + n + '" min="0" step="any" value="' + (cc.value != null ? cc.value : '') + '" aria-label="Concession value, semester ' + n + '"' + (cc.type ? '' : ' disabled') + '><select id="ed-m-' + n + '" data-ed="cmode" data-n="' + n + '" aria-label="Percent or rupees, semester ' + n + '"' + (cc.type ? '' : ' disabled') + '><option value="pct">%</option><option value="flat"' + (cc.mode === 'flat' ? ' selected' : '') + '>&#8377;</option></select></div></td></tr>' +
'<tr><td style="border-bottom:1px solid var(--line)"></td><td colspan="3" style="padding-top:0;border-bottom:1px solid var(--line)"><div class="row" style="gap:6px"><input type="text" style="width:auto;flex:1 1 100%" id="ed-n-' + n + '" data-ed="note" data-n="' + n + '" aria-label="Remark for semester ' + n + '" value="' + esc(cc.type ? (cc.note || '') : (c.note || '')) + '" placeholder="' + (cc.type ? 'Reason for concession, shown to the student' : 'Remark shown to the student (optional)') + '"><input type="number" style="width:190px" id="ed-c-' + n + '" data-ed="camt" data-n="' + n + '" min="0" step="1" value="' + (c.courseAmt != null ? c.courseAmt : '') + '" placeholder="Manual course fee" aria-label="Manual course fee, semester ' + n + '"><input type="number" style="width:190px" id="ed-o-' + n + '" data-ed="hamt" data-n="' + n + '" min="0" step="1" value="' + (c.hostelAmt != null ? c.hostelAmt : '') + '" placeholder="Manual hostel fee" aria-label="Manual hostel fee, semester ' + n + '"></div></td></tr>'; }
h += '</tbody></table></div></section><section class="card stack"><h2>One-off adjustments</h2><p class="small muted">For amounts outside the standard structure. Use a negative amount for a reduction.</p>';
let any = false;
for (let n = 1; n <= 8; n++) (((d.sems || {})[n] || {}).adj || []).forEach((a, i) => { any = true;
h += '<div class="row"><span class="pill">Sem ' + n + '</span><span class="grow">' + esc(a.label) + (a.settlesHostel ? ' <span class="small muted">(settles ' + inr(a.settlesHostel) + ' of hostel balance)</span>' : '') + '</span><b class="num">' + inr(a.amount || 0) + '</b><button class="btn ghost danger" data-act="deladj" data-n="' + n + '" data-i="' + i + '">Remove</button></div>'; });
if (!any) h += '<p class="muted small">None recorded.</p>';
h += '<form id="adjForm" class="row" style="align-items:flex-end"><label class="f">Semester<select id="adj-n">' + [1,2,3,4,5,6,7,8].map(i => '<option' + (i === 5 ? ' selected' : '') + '>' + i + '</option>').join('') + '</select></label><label class="f grow">Description<input type="text" id="adj-l" required maxlength="120"></label><label class="f">Amount (&#8377;)<input type="number" id="adj-a" step="1" required style="width:110px"></label><label class="f">Settles hostel balance (&#8377;)<input type="number" id="adj-s" step="1" min="0" style="width:120px" placeholder="0"></label><button class="btn" type="submit">Add</button></form></section></div>';
return h + '<aside class="stack sticky" id="edPreview">' + edPreviewHTML() + '</aside></div>';
}
function edPreviewHTML(){
const C = computeFees(S.draft), n = S.viewSem, r = C.rows[n - 1];
return '<section class="card stack"><div class="row"><h3 class="grow">Live result</h3><select id="pv-sem" aria-label="Semester to preview">' + C.rows.map(x => '<option value="' + x.n + '"' + (x.n === n ? ' selected' : '') + '>Semester ' + x.n + '</option>').join('') + '</select></div>' +
'<div><div class="small muted">Semester ' + n + ' payable</div><div class="num" style="font:600 34px/1.1 var(--display)">' + inr(r.total) + '</div>' + (n >= 5 ? '<div class="small muted num">Monthly mandate ' + inr(r.monthly) + ' &times; ' + FEE.MONTHS + '</div>' : '') + '</div>' +
'<table class="num"><tbody><tr><td>Course fee</td><td class="r">' + inr(r.gross) + '</td></tr>' +
(r.schAmt ? '<tr><td>Scholarship ' + C.sch + '%</td><td class="r">' + inr(-r.schAmt) + '</td></tr>' : '') +
(r.conc ? '<tr><td>' + esc(r.conc.type) + ' concession</td><td class="r">' + inr(-r.concAmt) + '</td></tr>' : '') +
(r.manual ? '<tr><td>Manual override</td><td class="r">' + inr(r.manual) + '</td></tr>' : '') +
'<tr><td>Hostel fee' + (r.hostelIn ? '' : ' <span class="pill">Opted out</span>') + '</td><td class="r">' + inr(r.hostel) + '</td></tr>' +
(r.adjTotal ? '<tr><td>Adjustments</td><td class="r">' + inr(r.adjTotal) + '</td></tr>' : '') +
'<tr><td><span class="pill cf">Carried forward</span> course</td><td class="r">' + inr(r.courseCF) + '</td></tr><tr><td><span class="pill cf">Carried forward</span> hostel</td><td class="r">' + inr(r.hostelCF) + '</td></tr>' +
'<tr><td><b>Total</b></td><td class="r"><b>' + inr(r.total) + '</b></td></tr></tbody></table></section>' +
'<section class="card"><h3>All semesters</h3><table class="num"><thead><tr><th>Sem</th><th class="r">Fee</th><th class="r">Carried fwd</th><th class="r">Total</th></tr></thead><tbody>' +
C.rows.map(x => '<tr' + (x.n === n ? ' class="sel"' : '') + '><td>' + x.n + '</td><td class="r">' + inr(x.current) + '</td><td class="r">' + (x.cf ? inr(x.cf) : '&mdash;') + '</td><td class="r"><b>' + inr(x.total) + '</b></td></tr>').join('') + '</tbody></table></section>';
}
function markDirty(){ S.dirty = true; S.edMsg = ''; const b = $('#saveBtn'); if (b) b.disabled = false; const d = app.querySelector('[data-act="eddiscard"]'); if (d) d.disabled = false; const p = $('#edPreview'); if (p) p.innerHTML = edPreviewHTML(); }
function startEdit(id){ S.editId = id; S.draft = clone(S.students[id]); S.dirty = false; S.edMsg = ''; S.previewId = null; S.viewSem = 5; render(); window.scrollTo(0, 0); }
async function saveDraft(){ if (S.busy) return; S.busy = true; const id = S.editId;
try { const d = await api('saveStudent', { id, sch: Number(S.draft.sch) || 0, sems: S.draft.sems || {} }); S.busy = false; apply(d); S.draft = clone(S.students[id]); S.dirty = false; S.edMsg = 'Saved. The student sees the new amounts and monthly mandate now.'; render(); }
catch (e) { S.busy = false; if (e.message !== 'expired') { S.edMsg = e.message; render(); } } }
document.addEventListener('click', ev => { const el = ev.target.closest('[data-act]'); if (!el) return; const act = el.dataset.act;
if (act === 'editfees' && canEdit()) startEdit(S.previewId);
else if (act === 'edback') { if (S.dirty) { S.edMsg = 'You have unsaved changes. Save or discard them first.'; render(); return; } S.editId = null; S.draft = null; render(); }
else if (act === 'eddiscard') startEdit(S.editId);
else if (act === 'edsave') saveDraft();
else if (act === 'edpreview') { S.previewId = S.editId; render(); window.scrollTo(0, 0); }
else if (act === 'deladj') { semCfg(Number(el.dataset.n)).adj.splice(Number(el.dataset.i), 1); S.dirty = true; render(); }
});
document.addEventListener('input', ev => { const el = ev.target; if (!S.draft || !S.editId) return;
if (el.id === 'ed-sch') { S.draft.sch = Math.max(0, Math.min(100, Number(el.value) || 0)); markDirty(); return; }
const k = el.dataset && el.dataset.ed; if (!k) return; const n = Number(el.dataset.n), c = semCfg(n);
if (k === 'cval') { if (c.conc) c.conc.value = Number(el.value) || 0; S.viewSem = n; markDirty(); }
else if (k === 'camt' || k === 'hamt') { const key = k === 'camt' ? 'courseAmt' : 'hostelAmt'; if (el.value === '') delete c[key]; else c[key] = Math.max(0, Number(el.value) || 0); S.viewSem = n; markDirty(); }
else if (k === 'note') { if (c.conc && c.conc.type) c.conc.note = el.value; else c.note = el.value; markDirty(); }
});
document.addEventListener('change', ev => { const el = ev.target; if (!S.draft || !S.editId) return;
if (el.id === 'pv-sem') { S.viewSem = Number(el.value); const p = $('#edPreview'); if (p) p.innerHTML = edPreviewHTML(); return; }
const k = el.dataset && el.dataset.ed; if (!k) return; const n = Number(el.dataset.n), c = semCfg(n);
if (k === 'hostel') { if (el.checked) delete c.hostel; else c.hostel = false; el.nextElementSibling.textContent = el.checked ? 'Opted in' : 'Opted out'; S.viewSem = n; markDirty(); }
else if (k === 'ctype') { const v = $('#ed-v-' + n), m = $('#ed-m-' + n), nt = $('#ed-n-' + n);
if (!el.value) { delete c.conc; v.value = ''; v.disabled = m.disabled = true; nt.value = c.note || ''; }
else { c.conc = c.conc || { mode: m.value || 'pct', value: Number(v.value) || 0, note: '' }; c.conc.type = el.value; v.disabled = m.disabled = false; nt.value = c.conc.note || ''; if (!v.value) v.focus(); }
S.viewSem = n; markDirty(); }
else if (k === 'cmode') { if (c.conc) c.conc.mode = el.value; S.viewSem = n; markDirty(); }
});
