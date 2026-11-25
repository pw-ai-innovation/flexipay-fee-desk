// Fifteenth build step: changes made through the fee sheet (by the Superadmin via Claude) also appear in the Activity log.
const fs = require('fs');
let h = fs.readFileSync('api/_extra.js', 'utf8');
const a = `return [].concat(...parts.map(p => p.items || [])).sort((a, b) => b.at - a.at);`;
if (h.split(a).length !== 2) throw new Error('anchor not found');
h = h.replace(a, () => `let sheet = []; try { sheet = (require('./_sheetlog.json').items || []).filter(e => e.at >= now - days * 86400e3); } catch (e) {}
  return [].concat(...parts.map(p => p.items || []), sheet).sort((a, b) => b.at - a.at);`);
fs.writeFileSync('api/_extra.js', h);
console.log('built step 15');
