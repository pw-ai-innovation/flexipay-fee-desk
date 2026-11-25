// Eleventh build step: the Super admin sees the IOI Team list with each member's current access code (including codes they changed themselves).
const fs = require('fs');
function patcher(file) { let h = fs.readFileSync(file, 'utf8');
  const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error(file + ': anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
  return { rep, before: (a, b) => rep(a, b + a), after: (a, b) => rep(a, a + b), save: () => fs.writeFileSync(file, h) }; }

const A = patcher('api/portal.js');
A.rep(`removed: !full ? [] :`, `team: !full ? [] : TEAM.map(t => { const k = 't:' + t.email, o = P.codes[k], cur = eff(P.codes, k, t.code); return { email: t.email, name: t.name, perm: t.perm, code: cur, changedAt: cur !== t.code && o ? o.at : 0 }; }), removed: !full ? [] :`);
A.save();

const P = patcher('public/index.html');
P.rep(`'>Activity log</button>' : ''); }`, `'>Activity log</button><button data-act="tab" data-t="team"' + (S.tab === 'team' ? ' aria-current="page"' : '') + '>IOI Team</button>' : ''); }`);
P.before(`else if (S.tab === 'tickets') h = adminTicketsHTML();`, `else if (S.tab === 'team' && S.perm === 'super') h = teamHTML();\n`);
P.before(`/* ---------- data ---------- */`, `function teamRows(){ return (S.team || []).map(t => [t.name, t.email, t.perm === 'full' ? 'Full' : t.perm === 'tickets' ? 'Tickets' : 'View', t.code, t.changedAt ? new Date(t.changedAt).toLocaleString('en-IN') : 'Not changed (code from the sheet)']); }
function teamHTML(){ const rows = teamRows();
let h = '<section class="card stack"><div class="row"><h2 class="grow">IOI Team access</h2>' + (rows.length ? '<button class="btn" data-act="teamdl">Download list</button>' : '') + '</div><p class="muted small">Current access codes, including any a member changed themselves. Members are added, removed or given a different permission in the Team tab of the fee sheet. Student codes are shown on each student&rsquo;s page.</p>';
if (!rows.length) h += '<p class="muted">No IOI Team members yet.</p>';
else h += '<div class="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Permission</th><th>Current access code</th><th>Changed by member</th></tr></thead><tbody>' + rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td><td class="mono">' + esc(r[3]) + '</td><td class="small">' + esc(r[4]) + '</td></tr>').join('') + '</tbody></table></div>';
return h + '</section>'; }
document.addEventListener('click', ev => { const el = ev.target.closest('[data-act="teamdl"]'); if (el) dl('flexipay-ioi-team-access.csv', [['Name', 'Email', 'Permission', 'Current access code', 'Changed by member']].concat(teamRows()).map(r => r.map(csvCell).join(',')).join('\\r\\n')); });
`);
P.rep(`S.perm = d.perm || 'view';`, `S.perm = d.perm || 'view'; S.team = d.team || [];`);
P.save();
console.log('built step 11');
