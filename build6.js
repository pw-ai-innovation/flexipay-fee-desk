// Sixth build step: Sem 5 internship rule (fixed course fee of Rs 20,000) and the white theme.
const fs = require('fs');
function patcher(file) { let h = fs.readFileSync(file, 'utf8');
  const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error(file + ': anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
  return { rep, before: (a, b) => rep(a, b + a), after: (a, b) => rep(a, a + b), save: () => fs.writeFileSync(file, h) }; }

const P = patcher('public/index.html');
// fee engine: an Internship concession in Sem 5, or any concession saved as a fixed fee, makes the course fee a fixed amount
P.rep(`ADM: 50000, MONTHS: 6 };`, `ADM: 50000, MONTHS: 6, INTERN: 20000 };`);
P.rep(`const concAmt = cc ? (cc.mode === 'flat' ? Math.min(Number(cc.value), net) : net * Number(cc.value) / 100) : 0;`, `const fix = cc && cc.mode === 'fixed' ? Number(cc.value) : cc && cc.type === 'Internship' && n === 5 ? FEE.INTERN : null;
const concAmt = cc ? (fix != null ? Math.max(0, net - fix) : cc.mode === 'flat' ? Math.min(Number(cc.value), net) : net * Number(cc.value) / 100) : 0;`);
P.rep(`conc: cc, concAmt: R(concAmt),`, `conc: cc, fix, concAmt: R(concAmt),`);
P.rep(`' concession (' + (r.conc.mode === 'flat' ? 'flat' : r.conc.value + '%') + ')'`, `' concession (' + (r.fix != null ? 'course fee fixed at ' + inr(r.fix) : r.conc.mode === 'flat' ? 'flat' : r.conc.value + '%') + ')'`);
P.rep(`(x.conc.mode === 'flat' ? inr(x.concAmt) : x.conc.value + '%')`, `(x.fix != null ? 'fixed ' + inr(x.fix) : x.conc.mode === 'flat' ? inr(x.concAmt) : x.conc.value + '%')`);
P.rep(`(r.conc.mode === 'flat' ? inr(r.concAmt) : r.conc.value + '%')`, `(r.fix != null ? 'fixed ' + inr(r.fix) : r.conc.mode === 'flat' ? inr(r.concAmt) : r.conc.value + '%')`);
// editor: fixed-fee option, and Internship in Sem 5 fills it in
P.rep(`<option value="flat"' + (cc.mode === 'flat' ? ' selected' : '') + '>&#8377;</option>`, `<option value="flat"' + (cc.mode === 'flat' ? ' selected' : '') + '>&#8377; off</option><option value="fixed"' + (cc.mode === 'fixed' || (cc.type === 'Internship' && n === 5) ? ' selected' : '') + '>Fixed fee &#8377;</option>`);
P.rep(`value="' + (cc.value != null ? cc.value : '') + '" aria-label="Concession value, semester ' + n + '"`, `value="' + (cc.type === 'Internship' && n === 5 ? FEE.INTERN : cc.value != null ? cc.value : '') + '" aria-label="Concession value, semester ' + n + '"`);
P.rep(`c.conc.type = el.value; v.disabled = m.disabled = false;`, `c.conc.type = el.value; v.disabled = m.disabled = false; if (el.value === 'Internship' && n === 5) { c.conc.mode = 'fixed'; c.conc.value = FEE.INTERN; v.value = FEE.INTERN; m.value = 'fixed'; }`);
P.rep(`A concession reduces that semester&rsquo;s course fee after scholarship, not the amount carried forward.`, `A concession reduces that semester&rsquo;s course fee after scholarship, not the amount carried forward. An Internship concession in Semester 5 always makes the course fee a fixed &#8377;20,000; with the hostel that is &#8377;93,900, plus the carried-forward amount.`);
// white theme
P.rep(`family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap`, `family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap`);
P.before(`</style>`, `html:root:root{color-scheme:light;--bg:#ffffff;--surface:#ffffff;--sunken:#f4f5f6;--ink:#1f272e;--muted:#687178;--line:#e2e6e9;--accent:#1877d6;--accent-soft:#e8f3fe;--on-accent:#ffffff;--carry:#a8690a;--carry-soft:#fdf3e1;--good:#1e8e3e;--good-soft:#e4f5e9;--crit:#d53f3f;--crit-soft:#fdecec;--info:#1877d6;--info-soft:#e8f3fe;--display:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;--body:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;--r:8px}
body{font-size:14px}
.top{border-bottom:1px solid var(--line)}
.card,.tile{box-shadow:0 1px 2px rgba(25,39,52,.06)}
.btn{border-radius:6px;font-size:13px}
.btn.primary{background:#2490ef;border-color:#2490ef}
th{background:var(--sunken)}
.brand b{font-size:17px}.idrow h1{font-size:22px}h2{font-size:17px}h3{font-size:15px}
.hero .big{font-size:38px;font-weight:700}.tile b{font-size:20px;font-weight:700}
.split .a{background:#2490ef}.legend div{border-color:#2490ef}.legend div.b{border-color:var(--carry)}
`);
P.save();

const A = patcher('api/portal.js');
A.rep(`mode: /rs|`, `mode: /fix/i.test(String(cmode || '')) ? 'fixed' : /rs|`);
A.rep(`{ const flat = c.conc.mode === 'flat'; o.conc = { type: String(c.conc.type).slice(0, 40), mode: flat ? 'flat' : 'pct', value: Math.min(Number(c.conc.value), flat ? 1e7 : 100),`, `{ const m = c.conc.mode === 'fixed' ? 'fixed' : c.conc.mode === 'flat' ? 'flat' : 'pct'; o.conc = { type: String(c.conc.type).slice(0, 40), mode: m, value: Math.min(Number(c.conc.value), m === 'pct' ? 100 : 1e7),`);
A.save();

const X = patcher('api/_extra.js');
X.rep(`(c.conc.mode === 'flat' ? 'Rs ' + c.conc.value : c.conc.value + '%')`, `(c.conc.mode === 'fixed' ? '(course fee fixed at Rs ' + c.conc.value + ')' : c.conc.mode === 'flat' ? 'Rs ' + c.conc.value : c.conc.value + '%')`);
X.rep(`if (t && !remove && (!(v > 0)`, `const I5 = /^internship$/i.test(t) && n === 5; if (t && !remove && !I5 && (!(v > 0)`);
X.rep(`mode: flat ? 'flat' : 'pct', value: v,`, `mode: I5 ? 'fixed' : flat ? 'flat' : 'pct', value: I5 ? 20000 : v,`);
X.save();
console.log('built step 6');
