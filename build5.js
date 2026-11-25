// Fifth build step: student search across ID, name and email, and filters by semester, hostel and concession.
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
rep(`const shown = rows.filter(x => F[S.filter](x) && (!q || x.id.includes(q) || (x.st.name || '').toLowerCase().includes(q) || (x.st.email || '').includes(q)));`,
`const fsem = S.fSem || 5, words = q.split(/\\s+/).filter(Boolean);
rows.forEach(x => { x.r = fsem === 5 ? x.r : computeFees(x.st).rows[fsem - 1]; x.hay = (x.id + ' ' + (x.st.name || '') + ' ' + (x.st.email || '') + ' ' + program(x.st)).toLowerCase(); });
const shown = rows.filter(x => F[S.filter](x) && (S.fHostel === 'in' ? x.r.hostelIn : S.fHostel === 'out' ? !x.r.hostelIn : true) && (S.fConc === 'yes' ? !!x.r.conc : S.fConc === 'no' ? !x.r.conc : true) && words.every(w => x.hay.includes(w)));
S.shownIds = shown.map(x => x.id);
const opt = (v, cur, label) => '<option value="' + v + '"' + (String(cur || '') === String(v) ? ' selected' : '') + '>' + label + '</option>';`);
rep(`placeholder="Search name, ID or email" value="' + esc(S.q) + '" aria-label="Search students" style="width:260px;max-width:100%">`, `placeholder="Search by enrollment ID, name or email" value="' + esc(S.q) + '" aria-label="Search students" style="width:340px;max-width:100%">`);
rep(`[['all','All'],['review','To review'],['out','Hostel out in Sem 5'],['conc','Concession in Sem 5'],['changed','Any change recorded']]`, `[['all','All students'],['review','To review'],['changed','Any change recorded']]`);
rep(`'<div class="scroll"><table class="num"><thead><tr><th>Enrollment</th><th>Name</th><th>Programme</th>`, `'<div class="row" style="align-items:flex-end"><label class="f">Semester<select id="f-sem">' + [1,2,3,4,5,6,7,8].map(n => opt(n, fsem, 'Semester ' + n + (n === 5 ? ' (current)' : ''))).join('') + '</select></label><label class="f">Hostel in that semester<select id="f-hostel">' + opt('', S.fHostel, 'All') + opt('in', S.fHostel, 'Opted in') + opt('out', S.fHostel, 'Opted out') + '</select></label><label class="f">Concession in that semester<select id="f-conc">' + opt('', S.fConc, 'All') + opt('yes', S.fConc, 'With concession') + opt('no', S.fConc, 'No concession') + '</select></label><span class="grow"></span><span class="small muted">' + shown.length + ' of ' + rows.length + ' students</span><button class="btn" type="button" data-act="csvlist">Download this list (sheet)</button>' + (S.q || S.fHostel || S.fConc || fsem !== 5 || S.filter !== 'all' ? '<button class="btn ghost" type="button" data-act="fclear">Clear search and filters</button>' : '') + '</div>' +
'<div class="scroll"><table class="num"><thead><tr><th>Enrollment</th><th>Name</th><th>Programme</th>`);
rep(`<th>Sem 5 hostel</th><th>Sem 5 concession</th><th class="r">Sem 5 fee</th><th class="r">Carried forward</th><th class="r">Sem 5 payable</th>`, `<th>Sem ' + fsem + ' hostel</th><th>Sem ' + fsem + ' concession</th><th class="r">Sem ' + fsem + ' fee</th><th class="r">Carried forward</th><th class="r">Sem ' + fsem + ' payable</th>`);
rep(`'</b></td><td class="r">' + inr(r.monthly) + '</td><td>' + ((x.st.flags`, `'</b></td><td class="r">' + (fsem >= 5 ? inr(r.monthly) : '\\u2014') + '</td><td>' + ((x.st.flags`);
rep(`ids().forEach(id => { const st = S.students[id], C = computeFees(st);`, `(S.expIds || ids()).forEach(id => { const st = S.students[id], C = computeFees(st);`);
rep(`/* ---------- data ---------- */`, `document.addEventListener('change', ev => { const el = ev.target;
if (el.id === 'f-sem') { S.fSem = Number(el.value); render(); } else if (el.id === 'f-hostel') { S.fHostel = el.value; render(); } else if (el.id === 'f-conc') { S.fConc = el.value; render(); }
});
document.addEventListener('click', ev => { const el = ev.target.closest('[data-act]'); if (!el) return;
if (el.dataset.act === 'fclear') { S.q = ''; S.fHostel = ''; S.fConc = ''; S.fSem = 5; S.filter = 'all'; render(); }
else if (el.dataset.act === 'csvlist') { S.expIds = S.shownIds || ids(); exportCSV(S.fSem || 5); S.expIds = null; }
});
/* ---------- data ---------- */`);
fs.writeFileSync('public/index.html', h);
console.log('built step 5', h.length);
