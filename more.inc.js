function dl(name, text){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
const csvCell = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
function parseCSV(text){ const rows = []; let row = [], cur = '', q = false; text = String(text).replace(/\r\n?/g, '\n');
for (let i = 0; i < text.length; i++) { const ch = text[i];
if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
else if (ch === '"') q = true; else if (ch === ',' || ch === '\t') { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; }
row.push(cur); rows.push(row); return rows; }
function bulkParse(text){
const table = parseCSV(text).filter(r => r.some(c => String(c).trim())); if (!table.length) return { rows: [], errors: ['No data found. Paste the rows or choose a file.'] };
let idx = { id: 0, sem: 1, hostel: 2, ctype: 3, cval: 4, cmode: 5, remark: 6 }; const head = table[0].map(c => String(c).toLowerCase());
if (head.some(c => c.includes('enrol'))) { const find = (...k) => head.findIndex(c => k.some(x => c.includes(x)));
idx = { id: find('enrol'), sem: find('sem'), hostel: find('hostel'), ctype: find('concession type', 'type'), cval: find('value', 'amount'), cmode: find('% or', 'mode', 'unit'), remark: find('remark', 'reason', 'note') }; table.shift(); }
const rows = [], errors = [];
table.forEach((r, i) => { const g = k => idx[k] >= 0 && r[idx[k]] != null ? String(r[idx[k]]).trim() : '';
const row = { id: g('id').replace(/\.0+$/, ''), sem: g('sem') || '5', hostel: g('hostel'), ctype: g('ctype'), cval: g('cval').replace(/[%,₹\s]/g, ''), cmode: g('cmode'), remark: g('remark') };
if (!S.students[row.id]) errors.push('Row ' + (i + 1) + ': enrollment ID "' + row.id + '" is not in the portal');
else if (row.hostel || row.ctype || row.remark) rows.push(row); });
return { rows, errors }; }
function bulkHTML(){ const b = S.bulk || {};
let h = '<details class="card"' + (S.bulkOpen ? ' open' : '') + '><summary style="cursor:pointer;font-weight:600">Bulk update: hostel and concession</summary><div class="stack" style="margin-top:12px"><p class="small muted">One line per student and semester, in this order: Enrollment ID, Semester, Hostel (In or Out), Concession type (Internship, Academic, Special scholarship, Other, or None to remove), Concession value, % or Rs, Remark. Leave a cell empty to keep what is already there. The template lists every student for Semester 5 with their current hostel and concession.</p><div class="row"><button class="btn" type="button" data-act="bulktpl">Download template</button><label class="btn" style="cursor:pointer">Choose Excel or CSV file<input type="file" id="bulk-file" accept=".csv,.xlsx,.xls,.txt" hidden></label></div><textarea id="bulk-text" aria-label="Bulk data" placeholder="2401010015, 5, In, Internship, 15, %, Internship at Acme" style="font-family:var(--mono);min-height:110px">' + esc(b.text || '') + '</textarea><div class="row"><button class="btn" type="button" data-act="bulkcheck">Check data</button>' + (b.rows && b.rows.length ? '<button class="btn primary" type="button" data-act="bulkapply"' + (S.busy ? ' disabled' : '') + '>Apply ' + b.rows.length + ' rows</button>' : '') + '<span class="small muted">' + esc(b.msg || '') + '</span></div>';
if (b.errors && b.errors.length) h += '<div class="notice err"><b>' + b.errors.length + ' rows will be skipped</b><ul class="plain">' + b.errors.slice(0, 8).map(e => '<li>' + esc(e) + '</li>').join('') + (b.errors.length > 8 ? '<li>and ' + (b.errors.length - 8) + ' more</li>' : '') + '</ul></div>';
if (b.rows && b.rows.length) h += '<div class="scroll"><table class="num"><thead><tr><th>Enrollment</th><th>Name</th><th>Sem</th><th>Hostel</th><th>Concession</th><th>Remark</th></tr></thead><tbody>' + b.rows.slice(0, 8).map(r => '<tr><td class="mono">' + esc(r.id) + '</td><td>' + esc(S.students[r.id].name) + '</td><td>' + esc(r.sem) + '</td><td>' + esc(r.hostel || 'no change') + '</td><td>' + esc(r.ctype ? r.ctype + (r.cval ? ' ' + r.cval + (/rs|flat|inr/i.test(r.cmode) ? ' Rs' : '%') : '') : 'no change') + '</td><td>' + esc(r.remark) + '</td></tr>').join('') + '</tbody></table></div>' + (b.rows.length > 8 ? '<p class="small muted">Showing the first 8 of ' + b.rows.length + ' rows.</p>' : '');
return h + '</div></details>'; }
function bulkCheck(text){ S.bulk = Object.assign(bulkParse(text), { text }); S.bulk.msg = S.bulk.rows.length ? 'Ready. Check the preview, then apply.' : 'Nothing to apply.'; S.bulkOpen = true; render(); }
function loadXlsx(){ return new Promise((ok, no) => { if (window.XLSX) return ok(); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => ok(); s.onerror = () => no(new Error('x')); document.head.appendChild(s); }); }
async function loadLog(){ S.logLoading = true; render(); try { const d = await api('logs', { days: S.logDays || 7 }); S.log = d.log || []; } catch (e) { if (e.message === 'expired') return; S.log = []; S.logErr = e.message; } S.logLoading = false; render(); }
const logTime = t => { try { return new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
function logItems(){ const q = (S.logQ || '').toLowerCase(); return (S.log || []).filter(e => !q || (e.by + ' ' + e.action + ' ' + (e.target || '') + ' ' + ((S.students[e.target] || {}).name || '') + ' ' + (e.detail || '')).toLowerCase().includes(q)); }
function logHTML(){ const items = logItems(), dys = S.logDays || 7;
let h = '<section class="card stack"><div class="row"><h2 class="grow">Activity log</h2><select id="log-days" aria-label="Period">' + [[7, 'Last 7 days'], [30, 'Last 30 days'], [60, 'Last 60 days']].map(o => '<option value="' + o[0] + '"' + (o[0] === dys ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select><input type="search" id="log-q" placeholder="Search person, student or action" value="' + esc(S.logQ || '') + '" aria-label="Search the log" style="width:260px;max-width:100%"><button class="btn" data-act="logreload">Refresh</button><button class="btn" data-act="logdl">Download (sheet)</button></div><p class="small muted">Every sign-in, fee change, bulk update, student added or removed, ticket and access-code change is recorded here. Only the Super admin can see it.</p>';
if (S.logLoading) h += '<p class="muted">Loading the log&hellip;</p>';
else if (!items.length) h += '<p class="muted">' + ((S.log || []).length ? 'Nothing matches your search.' : 'No activity recorded in this period yet.') + '</p>';
else h += '<div class="scroll"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Student</th><th>Details</th></tr></thead><tbody>' + items.slice(0, 500).map(e => '<tr><td style="white-space:nowrap" class="num">' + logTime(e.at) + '</td><td>' + esc(e.by) + '</td><td><b>' + esc(e.action) + '</b></td><td>' + (e.target ? '<span class="mono">' + esc(e.target) + '</span> ' + esc((S.students[e.target] || {}).name || '') : '') + '</td><td class="small">' + esc(e.detail || '') + '</td></tr>').join('') + '</tbody></table></div>' + (items.length > 500 ? '<p class="small muted">Showing the latest 500 of ' + items.length + '. Download the sheet for all of them.</p>' : '');
return h + '</section>'; }
document.addEventListener('click', async ev => { const el = ev.target.closest('[data-act]'); if (!el) return; const act = el.dataset.act;
if (act === 'tab' && el.dataset.t === 'log') loadLog();
else if (act === 'logreload') loadLog();
else if (act === 'logdl') dl('flexipay-activity-log.csv', [['When', 'Who', 'Action', 'Enrollment ID', 'Student', 'Details']].concat(logItems().map(e => [new Date(e.at).toLocaleString('en-IN'), e.by, e.action, e.target || '', (S.students[e.target] || {}).name || '', e.detail || ''])).map(r => r.map(csvCell).join(',')).join('\r\n'));
else if (act === 'bulktpl') dl('flexipay-bulk-update-template.csv', [['Enrollment ID', 'Name (for reference)', 'Semester', 'Hostel (In/Out)', 'Concession type', 'Concession value', '% or Rs', 'Remark']].concat(ids().map(id => { const st = S.students[id], c = (st.sems || {})[5] || {}, cc = c.conc; return [id, st.name, 5, c.hostel === false ? 'Out' : 'In', cc ? cc.type : '', cc ? cc.value : '', cc ? (cc.mode === 'flat' ? 'Rs' : '%') : '', cc ? cc.note || '' : c.note || '']; })).map(r => r.map(csvCell).join(',')).join('\r\n'));
else if (act === 'bulkcheck') bulkCheck($('#bulk-text').value);
else if (act === 'bulkapply') { if (S.busy || !S.bulk || !S.bulk.rows.length) return; S.busy = true; render();
try { const d = await api('bulkUpdate', { rows: S.bulk.rows }); S.busy = false; apply(d); const r = d.bulk || {}; S.bulk = { text: '', rows: [], errors: r.errors || [], msg: 'Done. ' + r.rows + ' rows applied to ' + r.students + ' students.' }; S.bulkOpen = true; render(); }
catch (e) { S.busy = false; if (e.message !== 'expired') { S.bulk.msg = e.message; render(); } } }
});
document.addEventListener('change', async ev => { const el = ev.target;
if (el.id === 'log-days') { S.logDays = Number(el.value); loadLog(); }
else if (el.id === 'bulk-file' && el.files && el.files[0]) { const f = el.files[0];
try { if (/\.(csv|txt)$/i.test(f.name)) bulkCheck(await f.text());
else { await loadXlsx(); const wb = window.XLSX.read(await f.arrayBuffer(), { type: 'array' }); bulkCheck(window.XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])); } }
catch (e) { S.bulk = { rows: [], errors: [], text: '', msg: 'That file could not be read. Save it as CSV and try again.' }; S.bulkOpen = true; render(); } }
});
document.addEventListener('input', ev => { const el = ev.target; if (el.id !== 'log-q') return; S.logQ = el.value; const pos = el.selectionStart; render(); const n = $('#log-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
