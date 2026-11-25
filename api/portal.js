// Flexi Pay Fee Desk API. Fee data lives in _data.json (generated from the fee Google Sheet); tickets live in a private Blob store.
const crypto = require('crypto');
const D = require('./_data.json');
const TEAM = (require('./_team.json').team || []).map(r => ({ email: String(r[0] || '').trim().toLowerCase(), name: String(r[1] || ''), code: String(r[2] || '').trim().toUpperCase(), perm: /full/i.test(r[3]) ? 'full' : /ticket/i.test(r[3]) ? 'tickets' : 'view' })).filter(t => t.email && t.code);
const SECRET = process.env.SESSION_SECRET || '';
const PROG = { 'SOT-1': 'SOT [24-28]_Phase-01_Bangalore Campus', 'SOT-2': 'SOT [24-28]_Phase-02_Bangalore Campus', 'SOM-1': 'SOM [24-28]_Phase-01_Bangalore Campus' };
const num = v => (v === '' || v == null ? null : Number(v));

function fromRow(r) {
  const [id, name, prog, sch, email, code, flexiUpto, note] = r;
  const st = { name, scheme: PROG[prog] || prog, sch: Number(sch) || 0, email: String(email || '').trim().toLowerCase(), code: String(code || '').trim().toUpperCase(), sems: {} };
  if (num(flexiUpto)) st.flexiUpto = Number(flexiUpto);
  if (note) st.flags = [String(note)];
  return st;
}
function build() {
  const out = {};
  for (const r of D.students) out[String(r[0])] = fromRow(r);
  for (const r of D.changes || []) {
    const [id, sem, hostel, ctype, cval, cmode, remark, courseAmt, hostelAmt, hostelDefer] = r;
    const st = out[String(id)]; const n = Number(sem); if (!st || !(n >= 1 && n <= 8)) continue;
    const c = st.sems[n] = st.sems[n] || {};
    if (String(hostel || '').trim().toLowerCase() === 'out') c.hostel = false;
    if (ctype && num(cval) > 0) c.conc = { type: String(ctype), mode: /rs|₹|flat/i.test(String(cmode || '')) ? 'flat' : 'pct', value: Number(cval), note: String(remark || '') };
    else if (remark) c.note = String(remark);
    if (num(courseAmt) != null) c.courseAmt = Number(courseAmt);
    if (num(hostelAmt) != null) c.hostelAmt = Number(hostelAmt);
    if (num(hostelDefer) != null) c.hostelDefer = Number(hostelDefer);
  }
  for (const r of D.adjustments || []) {
    const [id, sem, label, amount, settles] = r;
    const st = out[String(id)]; const n = Number(sem); if (!st || !(n >= 1 && n <= 8)) continue;
    const c = st.sems[n] = st.sems[n] || {};
    const a = { label: String(label || 'Adjustment'), amount: Number(amount) || 0 }; if (num(settles) > 0) a.settlesHostel = Number(settles);
    (c.adj = c.adj || []).push(a);
  }
  return out;
}
const STUDENTS = build();
const pub = (st, admin, full) => { const o = { name: st.name, scheme: st.scheme, sch: st.sch, sems: st.sems }; if (st.flexiUpto) o.flexiUpto = st.flexiUpto; if (admin) { o.email = st.email; if (full) o.code = st.code; if (st.added) o.added = true; if (st.edited) o.edited = st.edited; if (st.flags) o.flags = st.flags; } return o; };

const b64 = b => Buffer.from(b).toString('base64url');
const mac = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
function sign(p) { const body = b64(JSON.stringify(Object.assign({ exp: Date.now() + 12 * 3600 * 1000 }, p))); return body + '.' + mac(body); }
function verify(t) {
  if (!SECRET || typeof t !== 'string') return null; const i = t.indexOf('.'); if (i < 1) return null;
  const body = t.slice(0, i), sig = Buffer.from(t.slice(i + 1)), want = Buffer.from(mac(body));
  if (sig.length !== want.length || !crypto.timingSafeEqual(sig, want)) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch (e) { return null; }
}
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y); };

async function readJson(name, empty) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Object.assign({ off: true }, empty);
  const { get } = require('@vercel/blob');
  let r; try { r = await get(name, { access: 'private' }); }
  catch (e) { if (/not.?found/i.test((e && (e.name + ' ' + e.message)) || '')) return empty; throw e; }
  if (!r || r.statusCode === 404) return empty;
  if (r.statusCode !== 200) throw new Error('blob read ' + r.statusCode);
  return JSON.parse(await new Response(r.stream).text());
}
async function writeJson(name, obj) {
  const { put } = require('@vercel/blob');
  await put(name, JSON.stringify(obj), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json', cacheControlMaxAge: 0 });
}
const readTickets = () => readJson('tickets.json', { seq: 0, items: [] });
const writeTickets = t => writeJson('tickets.json', { seq: t.seq, items: t.items });
const readRoster = () => readJson('roster.json', { added: {}, removed: [] });
// Access codes people changed themselves. An entry applies while the sheet still holds the code it replaced (or already holds the new one).
const readCodes = async () => { try { return await readJson('codes.json', {}); } catch (e) { return {}; } };
const eff = (codes, key, base) => { const o = codes[key]; return o && (o.base === base || o.code === base) ? o.code : base; };
// Fee edits saved on the portal. An edit applies while the sheet data it was made on is unchanged; once synced into the sheet it drops out.
const readEdits = async () => { try { return await readJson('edits.json', {}); } catch (e) { return {}; } };
const hashOf = st => crypto.createHash('sha1').update(JSON.stringify([st.sch, st.sems])).digest('hex');
function cleanSems(x) {
  const out = {}; if (!x || typeof x !== 'object') return out;
  for (let n = 1; n <= 8; n++) { const c = x[n]; if (!c || typeof c !== 'object') continue; const o = {};
    if (c.hostel === false) o.hostel = false;
    if (c.conc && c.conc.type && Number(c.conc.value) > 0) { const flat = c.conc.mode === 'flat'; o.conc = { type: String(c.conc.type).slice(0, 40), mode: flat ? 'flat' : 'pct', value: Math.min(Number(c.conc.value), flat ? 1e7 : 100), note: String(c.conc.note || '').slice(0, 200) }; }
    if (c.note) o.note = String(c.note).slice(0, 300);
    for (const k of ['courseAmt', 'hostelAmt', 'hostelDefer']) if (c[k] !== '' && c[k] != null && Number(c[k]) >= 0) o[k] = Math.round(Number(c[k]));
    if (Array.isArray(c.adj)) { const a = c.adj.slice(0, 10).map(v => { const r = { label: String((v && v.label) || 'Adjustment').slice(0, 120), amount: Math.round(Number(v && v.amount) || 0) }; if (Number(v && v.settlesHostel) > 0) r.settlesHostel = Math.round(Number(v.settlesHostel)); return r; }); if (a.length) o.adj = a; }
    if (Object.keys(o).length) out[n] = o; }
  return out;
}
const member = who => who.o ? { name: 'Super admin', perm: 'super', owner: true } : TEAM.find(t => t.email === who.e) || null;
// Students = fee sheet data, minus those removed in the portal, plus those added in the portal.
function merge(ro) {
  const out = {}; const gone = new Set(ro.removed || []);
  for (const id of Object.keys(STUDENTS)) if (!gone.has(id)) out[id] = STUDENTS[id];
  for (const id of Object.keys(ro.added || {})) if (!STUDENTS[id]) { const st = fromRow(ro.added[id]); st.added = true; out[id] = st; }
  return out;
}
async function people() { let ro; try { ro = await readRoster(); } catch (e) { ro = { added: {}, removed: [] }; }
  const all = merge(ro), codes = await readCodes(), edits = await readEdits(), out = {};
  for (const id of Object.keys(all)) { let st = all[id]; const h0 = hashOf(st), e = edits[id];
    if (e && e.base === h0) st = Object.assign({}, st, { sch: e.sch, sems: e.sems, edited: { by: e.by, at: e.at } });
    out[id] = Object.assign({}, st, { h0, base: st.code, code: eff(codes, 's:' + id, st.code) }); }
  return { all: out, ro, codes, edits }; }
async function ticketsFor(who) { let t; try { t = await readTickets(); } catch (e) { return []; } return who.r === 'a' ? t.items : t.items.filter(x => x.enrollId === who.id); }
async function state(who, P) {
  P = P || await people(); const tickets = await ticketsFor(who);
  if (who.r === 'a') { const m = member(who); if (!m) return null; const full = m.perm === 'super';
    const students = {}; for (const id of Object.keys(P.all)) students[id] = pub(P.all[id], true, full);
    return { role: 'a', perm: m.perm, name: m.name, email: who.e || 'superadmin', canChange: true, students, tickets, removed: !full ? [] : (P.ro.removed || []).filter(id => STUDENTS[id]).map(id => ({ id, name: STUDENTS[id].name })) }; }
  const st = P.all[who.id]; if (!st) return null;
  return { role: 's', email: st.email, canChange: true, student: Object.assign({ enrollId: who.id }, pub(st, false)), tickets };
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  const send = (code, obj) => res.status(code).json(obj);
  if (req.method !== 'POST') {
    const key = String((req.query && req.query.sync) || '');
    if (key) { if (!process.env.SYNC_KEY || !same(key, process.env.SYNC_KEY)) return send(403, { error: 'No.' });
      const P = await people(), edits = {}; Object.keys(P.edits).forEach(id => { const e = P.edits[id]; if (P.all[id] && e.base === P.all[id].h0) edits[id] = { sch: e.sch, sems: e.sems, by: e.by, at: e.at }; });
      return send(200, { roster: P.ro, codes: await readJson('codes.json', {}), edits }); }
    const fs = require('fs'), path = require('path'); const h = f => { try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex'); } catch (e) { return 'missing'; } };
    return send(200, { ok: true, page: h(path.join(process.cwd(), 'public', 'index.html')), api: h(__filename), data: crypto.createHash('sha1').update(JSON.stringify(D)).digest('hex'), students: D.students.length, tickets: !!process.env.BLOB_READ_WRITE_TOKEN });
  }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } b = b || {};
  if (!SECRET) return send(500, { error: 'The portal is not configured yet.' });
  try {
    if (b.action === 'login') {
      const code = String(b.code || '').trim().toUpperCase(); let who = null;
      if (b.team) { const email = String(b.email || '').trim().toLowerCase(); const t = TEAM.find(x => x.email === email);
        if (t) { if (same(code, eff(await readCodes(), 't:' + email, t.code))) who = { r: 'a', e: email }; }
        else if ((!email || email === 'superadmin') && D.adminCode && same(code, eff(await readCodes(), 'o', String(D.adminCode).toUpperCase()))) who = { r: 'a', o: 1 }; }
      else { const email = String(b.email || '').trim().toLowerCase();
        const all = (await people()).all;
        for (const id of Object.keys(all)) { const st = all[id]; if (st.email && st.code && st.email === email && same(code, st.code)) { who = { r: 's', id }; break; } } }
      if (!who) { await new Promise(r => setTimeout(r, 700)); return send(403, { error: b.team ? 'That email and access code do not match an IOI Team member.' : 'That email and access code do not match our records. Check both, or contact the IOI Team.' }); }
      return send(200, Object.assign({ token: sign(who) }, await state(who)));
    }
    const who = verify(b.token); if (!who) return send(401, { error: 'Please sign in again.' });
    const me = who.r === 'a' ? member(who) : null; if (who.r === 'a' && !me) return send(401, { error: 'Please sign in again.' });
    if (b.action === 'changeCode') {
      const oldC = String(b.old || '').trim().toUpperCase(), newC = String(b.code || '').trim().toUpperCase();
      if (!/^[A-Z0-9@#$%&*!._-]{6,32}$/.test(newC)) return send(400, { error: 'Choose a new code of 6 to 32 letters and numbers, without spaces.' });
      let key, base, cur; const codes = await readJson('codes.json', {}); if (codes.off) return send(503, { error: 'Portal storage is not switched on.' });
      if (who.r === 'a' && me.owner) { key = 'o'; base = String(D.adminCode).toUpperCase(); cur = eff(codes, key, base); }
      else if (who.r === 'a') { const t = TEAM.find(x => x.email === who.e); key = 't:' + who.e; base = t.code; cur = eff(codes, key, base); }
      else { const st = (await people()).all[who.id]; if (!st) return send(401, { error: 'Please sign in again.' }); key = 's:' + who.id; base = st.base; cur = st.code; }
      if (!same(oldC, cur)) { await new Promise(r => setTimeout(r, 700)); return send(403, { error: 'Your current access code is not right.' }); }
      const clean = {}; Object.keys(codes).forEach(k => { if (k !== 'off') clean[k] = codes[k]; }); clean[key] = { code: newC, base, at: Date.now() };
      await writeJson('codes.json', clean); return send(200, { ok: true });
    }
    if (b.action === 'load') { const s = await state(who); return s ? send(200, s) : send(401, { error: 'Please sign in again.' }); }
    if (b.action === 'ticket') {
      const enrollId = who.r === 'a' ? String(b.enrollId || '') : who.id; const sem = Number(b.sem), msg = String(b.msg || '').trim().slice(0, 1500), head = String(b.head || '').slice(0, 80);
      if (!(await people()).all[enrollId] || !(sem >= 1 && sem <= 8) || !msg) return send(400, { error: 'Fill in the semester and describe the issue.' });
      const t = await readTickets(); if (t.off) return send(503, { error: 'Tickets are not switched on yet. Contact the IOI Team directly.' });
      t.seq = (t.seq || 0) + 1; t.items.push({ id: t.seq, enrollId, sem, head, msg, at: Date.now(), status: 'open' }); await writeTickets(t);
      return send(200, { tickets: who.r === 'a' ? t.items : t.items.filter(x => x.enrollId === who.id) });
    }
    if (b.action === 'reply') {
      if (who.r !== 'a' || me.perm === 'view') return send(403, { error: 'Your IOI Team access does not include replying to tickets.' });
      const t = await readTickets(); const it = t.items.find(x => x.id === Number(b.id)); if (!it) return send(404, { error: 'Ticket not found.' });
      it.reply = String(b.reply || '').trim().slice(0, 1500); it.status = ['open', 'review', 'resolved'].includes(b.status) ? b.status : 'open'; it.repliedAt = Date.now(); await writeTickets(t);
      return send(200, { tickets: t.items });
    }
    if (b.action === 'saveStudent') {
      if (who.r !== 'a' || !['full', 'super'].includes(me.perm)) return send(403, { error: 'Your IOI Team access does not include changing fees.' });
      const id = String(b.id || ''), cur = (await people()).all[id], sch = Number(b.sch); if (!cur) return send(404, { error: 'Student not found.' });
      if (!(sch >= 0 && sch <= 100)) return send(400, { error: 'Scholarship must be between 0 and 100.' });
      const edits = await readJson('edits.json', {}); if (edits.off) return send(503, { error: 'Portal storage is not switched on.' });
      const next = {}; Object.keys(edits).forEach(k => { if (k !== 'off') next[k] = edits[k]; });
      next[id] = { sch, sems: cleanSems(b.sems), base: cur.h0, by: who.e || 'Super admin', at: Date.now() };
      await writeJson('edits.json', next); return send(200, await state(who));
    }
    if (['addStudent', 'removeStudent', 'restoreStudent'].includes(b.action)) {
      if (who.r !== 'a' || !(me.perm === 'super' || (me.perm === 'full' && b.action === 'addStudent'))) return send(403, { error: b.action === 'addStudent' ? 'Only IOI Team members with full access can add students.' : 'Only the Super admin can remove or restore students.' });
      const ro = await readRoster(); if (ro.off) return send(503, { error: 'Portal storage is not switched on.' });
      ro.added = ro.added || {}; ro.removed = ro.removed || []; const id = String(b.id || '').trim(); const extra = {};
      if (b.action === 'addStudent') {
        const name = String(b.name || '').trim().slice(0, 80), prog = String(b.prog || ''), sch = Number(b.sch) || 0, email = String(b.email || '').trim().toLowerCase();
        if (!/^\d{10}$/.test(id)) return send(400, { error: 'The enrollment ID must be 10 digits.' });
        if (!name || !PROG[prog] || sch < 0 || sch > 100) return send(400, { error: 'Fill in the name, programme and a scholarship between 0 and 100.' });
        if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(400, { error: 'That email address does not look right.' });
        const all = merge(ro);
        if (STUDENTS[id] && ro.removed.includes(id)) return send(400, { error: 'This student was removed earlier. Restore them from the Removed students list instead.' });
        if (all[id]) return send(400, { error: 'A student with this enrollment ID already exists.' });
        if (email && Object.keys(all).some(k => all[k].email === email)) return send(400, { error: 'Another student already uses this email.' });
        const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let code = ''; for (let i = 0; i < 8; i++) code += A[crypto.randomInt(A.length)];
        ro.added[id] = [id, name, prog, sch, email, code, '', '']; extra.addedName = name; extra.addedCode = code;
      } else if (b.action === 'removeStudent') {
        if (ro.added[id]) delete ro.added[id]; else if (STUDENTS[id]) { if (!ro.removed.includes(id)) ro.removed.push(id); } else return send(404, { error: 'Student not found.' });
      } else ro.removed = ro.removed.filter(x => x !== id);
      await writeJson('roster.json', { added: ro.added, removed: ro.removed });
      return send(200, Object.assign(extra, await state(who)));
    }
    return send(400, { error: 'Unknown request.' });
  } catch (e) { console.error(e); return send(500, { error: 'Something went wrong on our side. Try again in a minute.' }); }
};
