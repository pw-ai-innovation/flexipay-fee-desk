/* ---------- Sem 1-4 summary for students ---------- */
function summary14HTML(C){
const rows = C.rows.slice(0, 4), F = C.F, R = Math.round;
const anyCF = rows.some(x => x.cf), anyAdj = rows.some(x => x.adjTotal), anyDisc = rows.some(x => x.concAmt || x.manual || x.laptop);
const disc = x => -x.concAmt + x.manual - x.laptop;
let t = '<div class="scroll"><table class="num"><thead><tr><th>Semester</th><th class="r">Course fee</th><th class="r">Hostel fee</th><th class="r">Scholarship</th>' +
(anyDisc ? '<th class="r">Concession or discount</th>' : '') + (anyAdj ? '<th class="r">Adjustments</th>' : '') + (anyCF ? '<th class="r">Balance of Sem 1&ndash;' + F + ' recovered</th>' : '') +
'<th class="r">Fee as per Flexi Pay structure</th><th class="r">Carried forward to ' + recRange(F) + '</th></tr></thead><tbody>';
const tot = { g: 0, h: 0, s: 0, d: 0, a: 0, c: 0, t: 0, f: 0 };
rows.forEach(x => { const def = x.courseDef + x.hostelDef;
tot.g += x.gross; tot.h += x.hostel; tot.s += x.schAmt; tot.d += disc(x); tot.a += x.adjTotal; tot.c += x.cf; tot.t += x.total; tot.f += def;
t += '<tr><td>Sem ' + x.n + (x.flexi ? '' : ' <span class="pill">Direct Pay</span>') + '</td><td class="r">' + inr(x.gross) + '</td><td class="r">' + (x.hostelIn ? inr(x.hostel) : '<span class="muted">Not in hostel</span>') + '</td><td class="r">' + (x.schAmt ? inr(-x.schAmt) : '&mdash;') + '</td>' +
(anyDisc ? '<td class="r">' + (disc(x) ? inr(disc(x)) : '&mdash;') + '</td>' : '') + (anyAdj ? '<td class="r">' + (x.adjTotal ? inr(x.adjTotal) : '&mdash;') + '</td>' : '') + (anyCF ? '<td class="r">' + (x.cf ? inr(x.cf) : '&mdash;') + '</td>' : '') +
'<td class="r"><b>' + inr(x.total) + '</b></td><td class="r">' + (def ? inr(def) : '&mdash;') + '</td></tr>'; });
t += '<tr class="sub"><td><b>Total Sem 1&ndash;4</b></td><td class="r">' + inr(tot.g) + '</td><td class="r">' + inr(tot.h) + '</td><td class="r">' + (tot.s ? inr(-tot.s) : '&mdash;') + '</td>' +
(anyDisc ? '<td class="r">' + inr(tot.d) + '</td>' : '') + (anyAdj ? '<td class="r">' + inr(tot.a) + '</td>' : '') + (anyCF ? '<td class="r">' + inr(tot.c) + '</td>' : '') +
'<td class="r"><b>' + inr(tot.t) + '</b></td><td class="r"><b>' + inr(tot.f) + '</b></td></tr>';
const span = 5 + (anyDisc ? 1 : 0) + (anyAdj ? 1 : 0) + (anyCF ? 1 : 0), settled = F >= 4 ? Math.min(C.settledH, C.poolHGross) : 0;
if (settled) t += '<tr><td colspan="' + span + '">Hostel balance already recovered or waived in Sem 1&ndash;4</td><td class="r">' + inr(-settled) + '</td></tr><tr class="sub"><td colspan="' + span + '"><b>Carried forward to ' + recRange(F) + '</b></td><td class="r"><b>' + inr(C.defC * F + C.poolH) + '</b></td></tr>';
t += '</tbody></table></div>';
/* what was applied, in words */
const items = [];
rows.forEach(x => {
if (x.schAmt) items.push('Sem ' + x.n + ': ' + C.sch + '% scholarship on the course fee, ' + inr(-x.schAmt) + '.');
if (x.conc) items.push('Sem ' + x.n + ': ' + (x.conc.type || 'Concession') + ' concession' + (x.fix != null ? ' (course fee fixed at ' + inr(x.fix) + ')' : x.conc.mode === 'flat' ? '' : ' of ' + x.conc.value + '%') + ', ' + inr(-x.concAmt) + (x.conc.note ? '. ' + x.conc.note : '') + '.');
if (x.manual) items.push('Sem ' + x.n + ': course fee set by the IOI Team, ' + inr(x.manual) + ' against the standard amount.');
if (x.hostelPartial) items.push('Sem ' + x.n + ': hostel fee of ' + inr(x.hostel) + ' set by the IOI Team.');
x.adj.forEach(a => items.push('Sem ' + x.n + ': ' + a.label + (a.amount ? ', ' + inr(a.amount) : '') + '.' + (a.settlesHostel ? ' Clears ' + inr(a.settlesHostel) + ' of the hostel balance.' : '')));
if (x.laptop) items.push('Sem ' + x.n + ': laptop concession, ' + inr(-x.laptop) + '.');
if (!x.hostelIn && x.n > 1 && rows[x.n - 2].hostelIn) items.push('Sem ' + x.n + ': hostel opted out.');
});
const r5 = C.rows[4], pool = C.defC * F + C.poolH, sems = recRange(F);
let h = '<section class="card stack"><div><h2>Your fees till Semester 4</h2><p class="muted small">A summary of Semester 1&ndash;4 under the Flexi Pay structure, and the balance that moves to ' + sems + '.</p></div>';
h += '<div class="tiles"><div class="tile"><b class="num">' + inr(tot.t) + '</b><span>Total fee for Sem 1&ndash;4 as per the Flexi Pay structure</span></div>' +
'<div class="tile"><b class="num">' + inr(tot.s - tot.d) + '</b><span>Scholarship' + (anyDisc ? ', concessions and discounts' : '') + ' in Sem 1&ndash;4</span></div>' +
(F >= 4 ? '<div class="tile"><b class="num">' + inr(pool) + '</b><span>Carried forward to ' + sems + ', ' + inr(C.defC + C.poolH / F) + ' in each semester</span></div>' :
'<div class="tile"><b class="num">' + inr(tot.c) + '</b><span>Balance of Sem 1&ndash;' + F + ' already recovered in Sem ' + (F + 1) + '&ndash;4</span></div>') +
'<div class="tile"><b class="num">' + inr(r5.total) + '</b><span>Semester 5 payable: ' + inr(r5.current) + ' Sem 5 fee' + (r5.cf ? ' + ' + inr(r5.cf) + ' carried forward' : '') + (r5.laptop ? ' &minus; ' + inr(r5.laptop) + ' laptop concession' : '') + '</span></div></div>';
h += t;
if (F >= 4) h += '<p class="small">Under Flexi Pay, 75% of each semester&rsquo;s fee was billed in Sem 1&ndash;4. The other 25% (' + inr(C.defC * F) + ' course fee' + (C.poolH ? ' and ' + inr(C.poolH) + ' hostel fee' : '') + (C.settledH && C.poolHGross ? (C.poolH ? ', after the hostel balance already recovered or waived' : '; the hostel balance was already settled') : '') + ') is not a new charge: it is the balance of Sem 1&ndash;4 and is added equally to ' + sems + '.</p>';
h += '<div><h3>Scholarship, concessions and adjustments till Semester 4</h3>' + (items.length ? '<ul class="plain">' + items.map(x => '<li class="small">' + esc(x) + '</li>').join('') + '</ul>' : '<p class="small muted">None. Standard Flexi Pay fee in every semester.</p>') + '</div>';
return h + '</section>'; }
