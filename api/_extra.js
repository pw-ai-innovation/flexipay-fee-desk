// Activity log, bulk updates and manual-fee rules for the Flexi Pay Fee Desk API.
const day = t => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10); // one log file per day, India time
async function logMany(d, entries) {
  try { const now = Date.now(), name = 'logs/' + day(now) + '.json'; const cur = await d.readJson(name, { items: [] }); if (cur.off) return;
    const items = cur.items || []; entries.forEach(e => items.push(Object.assign({ at: now }, e))); await d.writeJson(name, { items }); }
  catch (e) { console.error('log failed', e); }
}
async function readLogs(d, days) {
  days = Math.max(1, Math.min(Number(days) || 7, 62)); const now = Date.now(), names = [];
  for (let i = 0; i < days; i++) names.push('logs/' + day(now - i * 86400e3) + '.json');
  const parts = await Promise.all(names.map(n => d.readJson(n, { items: [] }).catch(() => ({ items: [] }))));
  return [].concat(...parts.map(p => p.items || [])).sort((a, b) => b.at - a.at);
}
const cfgText = c => { c = c || {}; const o = [c.hostel === false ? 'hostel out' : 'hostel in'];
  if (c.conc) o.push(c.conc.type + ' concession ' + (c.conc.mode === 'flat' ? 'Rs ' + c.conc.value : c.conc.value + '%'));
  if (c.courseAmt != null) o.push('manual course fee Rs ' + c.courseAmt); if (c.hostelAmt != null) o.push('manual hostel fee Rs ' + c.hostelAmt);
  (c.adj || []).forEach(x => o.push('adjustment "' + x.label + '" Rs ' + x.amount));
  const note = (c.conc && c.conc.note) || c.note; if (note) o.push('remark: ' + note); return o.join(', '); };
function diff(a, b) { const o = []; if (Number(a.sch) !== Number(b.sch)) o.push('Scholarship ' + a.sch + '% -> ' + b.sch + '%');
  for (let n = 1; n <= 8; n++) { const x = cfgText((a.sems || {})[n]), y = cfgText((b.sems || {})[n]); if (x !== y) o.push('Sem ' + n + ': ' + x + ' -> ' + y); }
  return o.join(' | ') || 'No change'; }
const MAN = ['courseAmt', 'hostelAmt', 'hostelDefer', 'adj'];
// Members below Super admin cannot touch manual fees or one-off adjustments: keep whatever was there.
function keepManual(sems, old) { const out = {};
  for (let n = 1; n <= 8; n++) { const c = Object.assign({}, (sems || {})[n]), p = (old || {})[n] || {}; MAN.forEach(k => { delete c[k]; if (p[k] != null) c[k] = p[k]; }); if (Object.keys(c).length) out[n] = c; }
  return out; }
// A new or changed manual course or hostel fee must carry a remark. Returns the first semester missing one, or 0.
function needsRemark(sems, old) {
  for (let n = 1; n <= 8; n++) { const c = (sems || {})[n] || {}, p = (old || {})[n] || {};
    const changed = ['courseAmt', 'hostelAmt'].some(k => c[k] != null && c[k] !== p[k]); if (changed && !((c.conc && c.conc.note) || c.note)) return n; }
  return 0; }
const TYPES = ['Internship', 'Academic', 'Special scholarship', 'Other'];
function bulk(rows, all, cleanSems) {
  const errors = [], work = {}; let ok = 0; if (!Array.isArray(rows) || !rows.length) return { byId: {}, count: 0, rows: 0, errors: ['No rows to apply.'] };
  rows.slice(0, 3000).forEach((r, i) => { r = r || {}; const id = String(r.id || '').trim(), n = Number(r.sem) || 5, st = all[id], L = 'Row ' + (i + 1) + ': ';
    if (!st) return errors.push(L + 'enrollment ID ' + id + ' not found'); if (!(n >= 1 && n <= 8)) return errors.push(L + 'semester must be 1 to 8');
    const h = String(r.hostel || '').trim().toLowerCase(), t = String(r.ctype || '').trim(), v = Number(r.cval), remark = String(r.remark || '').trim().slice(0, 200);
    const out = /^(out|no|n|opt.?out|opted out)$/.test(h), inn = /^(in|yes|y|opt.?in|opted in)$/.test(h); if (h && !out && !inn) return errors.push(L + 'hostel must be In or Out');
    const remove = /^(none|remove|no|nil|0)$/i.test(t), flat = /rs|₹|flat|inr/i.test(String(r.cmode || ''));
    if (t && !remove && (!(v > 0) || (!flat && v > 100))) return errors.push(L + 'concession value must be a number' + (flat ? '' : ' from 1 to 100'));
    const sems = work[id] || (work[id] = JSON.parse(JSON.stringify(st.sems || {}))), c = sems[n] || (sems[n] = {});
    if (out) c.hostel = false; else if (inn) delete c.hostel;
    if (remove) delete c.conc; else if (t) c.conc = { type: TYPES.find(x => x.toLowerCase() === t.toLowerCase()) || t, mode: flat ? 'flat' : 'pct', value: v, note: remark || (c.conc && c.conc.note) || '' };
    if (remark) { if (c.conc) c.conc.note = remark; else c.note = remark; }
    ok++; });
  const byId = {}; Object.keys(work).forEach(id => { byId[id] = cleanSems(work[id]); });
  return { byId, count: Object.keys(byId).length, rows: ok, errors };
}
module.exports = { logMany, readLogs, diff, keepManual, needsRemark, bulk };
