// Third build step: fee editor on the portal for Full-access IOI Team members, and a Super admin login.
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
const before = (a, b) => rep(a, b + a);
before(`/* ---------- data ---------- */`, fs.readFileSync('editor.inc.js', 'utf8'));
rep(`<label class="f">Email<input type="email" id="lg-email" autocomplete="username" placeholder="Leave empty when using the owner code"></label>`, `<label class="f">Email or ID<input type="text" id="lg-email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Your email, or superadmin" required></label>`);
rep(`(S.perm === 'full' ? '' : ' hidden') + (S.addOpen`, `(canEdit() ? '' : ' hidden') + (S.addOpen`);
rep(`if (S.perm === 'full' && (S.removed || []).length)`, `if (S.perm === 'super' && (S.removed || []).length)`);
rep(`(S.perm === 'full' ? '. Access code: <span`, `(S.perm === 'super' ? '. Access code: <span`);
rep(`'</span>' + (S.perm !== 'full' ? '' : S.confirmRemove`, `'</span>' + (canEdit() && !S.editId ? '<button class="btn primary" data-act="editfees">Edit fees</button>' : '') + (S.perm !== 'super' || S.editId ? '' : S.confirmRemove`);
rep(`(S.isAdmin ? ' \\u00b7 IOI Team' + (S.perm === 'full'`, `(S.isAdmin && S.perm === 'super' ? ' \\u00b7 Super admin' : S.isAdmin ? ' \\u00b7 IOI Team' + (S.perm === 'full'`);
rep(`const ps = S.students[S.previewId];`, `const ps = S.editId === S.previewId && S.draft ? S.draft : S.students[S.previewId];`);
rep(`else if (S.tab === 'tickets') h = adminTicketsHTML();`, `else if (S.tab === 'tickets') h = adminTicketsHTML();\nelse if (S.editId && S.draft && S.students[S.editId]) h = editorHTML();`);
rep(`S.confirmRemove = false; S.addMsg = ''; S.previewId = id;`, `S.confirmRemove = false; S.addMsg = ''; S.editId = null; S.draft = null; S.dirty = false; S.previewId = id;`);
rep(`<button class="btn" data-act="endpreview">Back to all students</button>`, `<button class="btn" data-act="endpreview">' + (S.editId ? 'Back to editing' : 'Back to all students') + '</button>`);
rep(`Select a student to see their statement exactly as they see it. Fee changes are made in the fee sheet.`, `Select a student to see their statement exactly as they see it. Members with full access can then choose Edit fees.`);
rep(`Ask in chat for any concession, hostel or fee change.`, `Open the student and choose Edit fees for any concession, hostel or fee change.`);
before(`else if (f.dataset.form === 'reply')`, `else if (f.id === 'adjForm') { const n = Number($('#adj-n').value), c = semCfg(n); c.adj = c.adj || []; const a = { label: $('#adj-l').value.trim(), amount: Math.round(Number($('#adj-a').value) || 0) }; const s = Math.round(Number($('#adj-s').value) || 0); if (s > 0) a.settlesHostel = s; c.adj.push(a); S.dirty = true; S.viewSem = n; render(); }
`);
rep(`function resetState(){`, `function resetState(){ S.editId = null; S.draft = null; S.dirty = false;`);
fs.writeFileSync('public/index.html', h);
console.log('built step 3', h.length);
