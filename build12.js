// Twelfth build step: programme shown as SOT or SOM only (no phase), and no Sem 5 billing total on the IOI Team dashboard.
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
rep(`function program(st){ const m = /^(\\w+).*Phase-(\\d+)/.exec(st.scheme || ''); return m ? m[1] + ' · Phase ' + m[2] : (st.scheme || ''); }`,
    `function program(st){ const m = /^(SOT|SOM)/i.exec(String(st.scheme || '').trim()); return m ? m[1].toUpperCase() : (st.scheme || ''); }`);
rep(`'<div class="tile"><b class="num">' + inr(bill) + '</b><span>Sem 5 billing, of which ' + inr(cf) + ' carried forward</span></div>' +\n`, '');
rep(`<option value="SOT-1">SOT, Phase 01</option>`, `<option value="SOT-1">SOT</option>`);
rep(`<option value="SOT-2">SOT, Phase 02</option>`, ``);
rep(`<option value="SOM-1">SOM, Phase 01</option>`, `<option value="SOM-1">SOM</option>`);
fs.writeFileSync('public/index.html', h);
console.log('built step 12');
