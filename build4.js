// Fourth build step: bulk upload, activity log, and manual fees for the Super admin only (page and API).
const fs = require('fs');
function patcher(file) { let h = fs.readFileSync(file, 'utf8');
  const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error(file + ': anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
  return { rep, before: (a, b) => rep(a, b + a), after: (a, b) => rep(a, a + b), save: () => fs.writeFileSync(file, h) }; }

const P = patcher('public/index.html');
P.before(`/* ---------- data ---------- */`, fs.readFileSync('more.inc.js', 'utf8'));
P.before(`</style>`, `[hidden]{display:none!important}\n`);
P.rep(`'>Tickets' + (open ? ' (' + open + ')' : '') + '</button>'; }`, `'>Tickets' + (open ? ' (' + open + ')' : '') + '</button>' + (S.perm === 'super' ? '<button data-act="tab" data-t="log"' + (S.tab === 'log' ? ' aria-current="page"' : '') + '>Activity log</button>' : ''); }`);
P.before(`else if (S.tab === 'tickets') h = adminTicketsHTML();`, `else if (S.tab === 'log' && S.perm === 'super') h = logHTML();\n`);
P.before(`const q = S.q.trim().toLowerCase();`, `if (canEdit()) h += bulkHTML();\n`);
P.rep(`<input type="number" style="width:190px" id="ed-c-' + n + '"`, `<input type="number"' + (S.perm === 'super' ? '' : ' hidden') + ' style="width:190px" id="ed-c-' + n + '"`);
P.rep(`<input type="number" style="width:190px" id="ed-o-' + n + '"`, `<input type="number"' + (S.perm === 'super' ? '' : ' hidden') + ' style="width:190px" id="ed-o-' + n + '"`);
P.rep(`'<form id="adjForm" class="row" style="align-items:flex-end">`, `'<form id="adjForm" class="row"' + (S.perm === 'super' ? '' : ' hidden') + ' style="align-items:flex-end">`);
P.rep(`<button class="btn ghost danger" data-act="deladj"`, `<button class="btn ghost danger"' + (S.perm === 'super' ? '' : ' hidden') + ' data-act="deladj"`);
P.rep(`To override the calculation, type a manual course fee or hostel fee; leave them empty for the standard amount. The monthly mandate always follows the semester total.`, `' + (S.perm === 'super' ? 'As Super admin you can also type a manual course fee or hostel fee, which replaces the calculated amount; a remark is required with it. ' : 'Manual fees and one-off adjustments can be changed only by the Super admin. ') + 'The monthly mandate always follows the semester total.`);
P.save();

const A = patcher('api/portal.js');
A.after(`const D = require('./_data.json');`, `\nconst X = require('./_extra.js');`);
A.before(`const readTickets = () =>`, `const actor = who => who && who.r === 'a' ? (who.e || 'superadmin') : who && who.id ? 'student ' + who.id : String(who || '');
const log = (who, action, target, detail) => X.logMany({ readJson, writeJson }, [{ by: actor(who), action, target: target || '', detail: detail || '' }]);
`);
A.rep(`if (!who) { await new Promise(r => setTimeout(r, 700)); return send(403, { error: b.team ?`, `if (!who) { await log(String(b.email || '(no ID given)').slice(0, 80), 'Failed sign-in', '', b.team ? 'IOI Team sign-in form' : 'Student sign-in form'); await new Promise(r => setTimeout(r, 700)); return send(403, { error: b.team ?`);
A.before(`return send(200, Object.assign({ token: sign(who) }, await state(who)));`, `await log(who, 'Signed in');\n      `);
A.rep(`await writeJson('codes.json', clean); return send(200, { ok: true });`, `await writeJson('codes.json', clean); await log(who, 'Changed own access code'); return send(200, { ok: true });`);
A.after(`status: 'open' }); await writeTickets(t);`, ` await log(who, 'Raised ticket #' + t.seq, enrollId, 'Sem ' + sem + ', ' + head + ': ' + msg.slice(0, 200));`);
A.after(`it.repliedAt = Date.now(); await writeTickets(t);`, ` await log(who, 'Replied to ticket #' + it.id, it.enrollId, 'Status ' + it.status + '. ' + it.reply.slice(0, 200));`);
A.rep(`next[id] = { sch, sems: cleanSems(b.sems), base: cur.h0, by: who.e || 'Super admin', at: Date.now() };
      await writeJson('edits.json', next); return send(200, await state(who));`, `let sems = cleanSems(b.sems); if (me.perm !== 'super') sems = X.keepManual(sems, cur.sems);
      const miss = me.perm === 'super' ? X.needsRemark(sems, cur.sems) : 0; if (miss) return send(400, { error: 'Add a remark for Semester ' + miss + ' explaining the manual fee.' });
      next[id] = { sch, sems, base: cur.h0, by: who.e || 'Super admin', at: Date.now() };
      await writeJson('edits.json', next); await log(who, 'Edited fees', id, X.diff(cur, { sch, sems })); return send(200, await state(who));`);
A.after(`await writeJson('roster.json', { added: ro.added, removed: ro.removed });`, `\n      await log(who, b.action === 'addStudent' ? 'Added student' : b.action === 'removeStudent' ? 'Removed student' : 'Restored student', id, extra.addedName || '');`);
A.before(`return send(400, { error: 'Unknown request.' });`, `if (b.action === 'bulkUpdate') {
      if (who.r !== 'a' || !['full', 'super'].includes(me.perm)) return send(403, { error: 'Your IOI Team access does not include changing fees.' });
      const P = await people(), r = X.bulk(b.rows, P.all, cleanSems); if (!r.count) return send(400, { error: r.errors[0] || 'No valid rows to apply.' });
      const edits = await readJson('edits.json', {}); if (edits.off) return send(503, { error: 'Portal storage is not switched on.' });
      const next = {}, at = Date.now(), by = who.e || 'Super admin', entries = []; Object.keys(edits).forEach(k => { if (k !== 'off') next[k] = edits[k]; });
      Object.keys(r.byId).forEach(id => { const cur = P.all[id]; next[id] = { sch: cur.sch, sems: r.byId[id], base: cur.h0, by, at }; entries.push({ by: actor(who), action: 'Bulk update', target: id, detail: X.diff(cur, { sch: cur.sch, sems: r.byId[id] }) }); });
      await writeJson('edits.json', next); await X.logMany({ readJson, writeJson }, entries);
      return send(200, Object.assign({ bulk: { students: r.count, rows: r.rows, errors: r.errors } }, await state(who)));
    }
    if (b.action === 'logs') {
      if (who.r !== 'a' || me.perm !== 'super') return send(403, { error: 'Only the Super admin can see the activity log.' });
      return send(200, { log: await X.readLogs({ readJson, writeJson }, b.days) });
    }
    `);
A.save();
console.log('built step 4');
