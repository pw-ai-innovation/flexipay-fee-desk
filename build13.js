// Thirteenth build step: a Sem 1-4 summary at the top of each student statement, and "Collected" renamed to "As per Flexi Pay structure".
const fs = require('fs');
let h = fs.readFileSync('public/index.html', 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('anchor not found once: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
rep(`/* ---------- student statement ---------- */`, fs.readFileSync('sum.inc.js', 'utf8') + `/* ---------- student statement ---------- */`);
rep(`h += '<div class="chips" role="group" aria-label="Choose a semester">';`, `h += summary14HTML(C);\nh += '<div class="chips" role="group" aria-label="Choose a semester">';`);
rep(`<th class="r">Course fee after scholarship</th><th class="r">Collected</th><th class="r">Carried forward</th><th class="r">Hostel fee</th><th class="r">Collected</th><th class="r">Carried forward</th>`,
    `<th class="r">Full course fee (after scholarship)</th><th class="r">As per Flexi Pay structure</th><th class="r">Carried forward</th><th class="r">Full hostel fee</th><th class="r">As per Flexi Pay structure</th><th class="r">Carried forward</th>`);
rep(`The remaining 25% of each is collected in`, `The remaining 25% of each is added to`);
fs.writeFileSync('public/index.html', h);
console.log('built step 13');
