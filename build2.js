// Second build step: IOI Team naming, named team logins with permissions, self-service access codes, no monthly mandate before Sem 5.
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
const before = (a, b) => rep(a, b + a);
h = h.split('Fee team').join('IOI Team').split('fee team').join('IOI Team').split('Fee office').join('IOI Team').split('fee office').join('IOI Team');

rep(`'<div class="mandate"><span class="small muted">Monthly mandate</span><b class="num">' + inr(r.monthly) + '</b><span class="small muted">&times; ' + FEE.MONTHS + ' months</span></div></div>' +`,
    `(n >= 5 ? '<div class="mandate"><span class="small muted">Monthly mandate</span><b class="num">' + inr(r.monthly) + '</b><span class="small muted">&times; ' + FEE.MONTHS + ' months</span></div>' : '') + '</div>' +`);
rep(`'</b></td><td class="r">' + inr(x.monthly) + '</td><td>' + tags.join(' ')`, `'</b></td><td class="r">' + (x.n >= 5 ? inr(x.monthly) : '\\u2014') + '</td><td>' + tags.join(' ')`);
rep(`r.total, r.monthly, remarksOf(r)`, `r.total, r.n >= 5 ? r.monthly : '', remarksOf(r)`);
rep(`'<form id="loginForm" class="stack"><label class="f">IOI Team access code<input type="password"`, `'<form id="loginForm" class="stack"><label class="f">Email<input type="email" id="lg-email" autocomplete="username" placeholder="Leave empty when using the owner code"></label><label class="f">Access code<input type="password"`);
rep(`'<details class="card"' + (S.addOpen ? ' open' : '') + '>`, `'<details class="card"' + (S.perm === 'full' ? '' : ' hidden') + (S.addOpen ? ' open' : '') + '>`);
rep(`if ((S.removed || []).length) h +=`, `if (S.perm === 'full' && (S.removed || []).length) h +=`);
rep(`'. Access code: <span class="mono">' + esc(ps.code || 'none') + '</span>.</span>' + (S.confirmRemove`, `(S.perm === 'full' ? '. Access code: <span class="mono">' + esc(ps.code || 'none') + '</span>.' : '.') + '</span>' + (S.perm !== 'full' ? '' : S.confirmRemove`);
rep(`'<form class="stack" data-form="reply" data-key="'`, `(S.perm === 'view' && t.reply ? '<div class="reply"><span class="small muted">Reply</span><p>' + esc(t.reply) + '</p></div>' : '') + '<form class="stack"' + (S.perm === 'view' ? ' hidden' : '') + ' data-form="reply" data-key="'`);
rep(`S.removed = d.removed || [];`, `S.removed = d.removed || []; S.perm = d.perm || 'view'; S.canChange = !!d.canChange;`);
rep(`'</span><button class="btn" data-act="signout">Sign out</button>' : '';`, `(S.isAdmin ? ' \\u00b7 IOI Team' + (S.perm === 'full' ? '' : S.perm === 'tickets' ? ' (tickets)' : ' (view only)') : '') + '</span>' + (S.canChange ? '<button class="btn" data-act="chgcode">Change access code</button>' : '') + '<button class="btn" data-act="signout">Sign out</button>' : '';`);
rep(`app.innerHTML = h;`, `app.innerHTML = (S.chg && S.session ? chgHTML() : '') + h;`);
before(`/* ---------- render ---------- */`, `function chgHTML(){
if (S.chgDone) return '<div class="notice info row"><span class="grow">Your access code is changed. Use the new code the next time you sign in.</span><button class="btn" data-act="chgcode">Close</button></div>';
return '<section class="card stack" style="max-width:560px"><h2>Change your access code</h2><form id="chgForm" class="stack"><label class="f">Current access code<input type="password" id="cg-old" autocomplete="current-password" required></label><label class="f">New access code<input type="password" id="cg-new" autocomplete="new-password" minlength="6" maxlength="32" required></label><label class="f">New access code again<input type="password" id="cg-new2" autocomplete="new-password" required></label><div class="row"><button class="btn primary" type="submit">Save new code</button><button class="btn ghost" type="button" data-act="chgcode">Cancel</button></div><p class="small muted">6 to 32 letters and numbers, no spaces. Capital and small letters count as the same. The IOI Team can see your access code, so do not reuse a password from another account.</p><p class="small" style="color:var(--crit)">' + esc(S.chgMsg || '') + '</p></form></section>';
}
`);
before(`else if (act === 'signout') signOut();`, `else if (act === 'chgcode') { S.chg = !S.chg || S.chgDone ? !S.chgDone && !S.chg : false; S.chgDone = false; S.chgMsg = ''; render(); window.scrollTo(0, 0); }
`);
before(`else if (f.dataset.form === 'reply')`, `else if (f.id === 'chgForm') { const o = $('#cg-old').value, n1 = $('#cg-new').value.trim(), n2 = $('#cg-new2').value.trim();
if (n1 !== n2) { S.chgMsg = 'The two new codes do not match.'; render(); return; }
try { await api('changeCode', { old: o, code: n1 }); S.chgDone = true; S.chgMsg = ''; render(); } catch (e) { if (e.message !== 'expired') { S.chgMsg = e.message; render(); } } }
`);
rep(`function signOut(){ resetState();`, `function signOut(){ S.chg = false; S.chgDone = false; resetState();`);
fs.writeFileSync('public/index.html', h);
console.log('built step 2', h.length);
