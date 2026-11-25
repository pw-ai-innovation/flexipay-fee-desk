// Tenth build step: a laptop concession can also come from the fee sheet (Changes tab, column K).
const fs = require('fs');
let h = fs.readFileSync('api/portal.js', 'utf8');
const a = `if (num(hostelDefer) != null) c.hostelDefer = Number(hostelDefer);`;
if (h.split(a).length !== 2) throw new Error('anchor not found');
h = h.replace(a, () => a + `\n    if (num(r[10]) > 0) { c.laptop = Number(r[10]); if (remark && !c.conc) { c.laptopNote = String(remark); delete c.note; } }`);
fs.writeFileSync('api/portal.js', h);
console.log('built step 10');
