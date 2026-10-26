/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const initial = n => (n || '?').trim()[0].toUpperCase();
const clock = t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toast = m => { const t = el('div', 'toast', m); document.body.append(t); setTimeout(() => t.remove(), 2200); };
const safe = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} }, del: k => { try { sessionStorage.removeItem(k); } catch {} } };

/* ---------- Transport ----------
   Uses BroadcastChannel so two tabs can talk with no server.
   To use the real Socket.IO server, replace send() and the onmessage handler:
     const socket = io(SERVER_URL); socket.on('event', handle); send = e => socket.emit('event', e);  */
const chan = new BroadcastChannel('securechat-demo');
const send = e => chan.postMessage(e);
chan.onmessage = ev => handle(ev.data);

/* ---------- State ---------- */
let me = null;                 // {id, nick}
const rooms = new Map();       // id -> {id, members: Map, msgs: [], unread, bot}
let current = null;
let pendingImg = null;

/* ---------- 2. Identity (session only) ---------- */
function loadIdentity() { try { return JSON.parse(safe.get('sc_identity')); } catch { return null; } }
function startSession(nick) {
  me = { id: crypto.randomUUID(), nick };
  safe.set('sc_identity', JSON.stringify(me));
  enterApp();
}
$('#nickForm').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('#nick').value.trim();
  if (n.length < 2) { $('#nickErr').textContent = 'Use at least 2 characters.'; return; }
  startSession(n);
});
function enterApp() {
  $('#gate').classList.add('hidden'); $('#app').classList.remove('hidden');
  $('#meNick').textContent = me.nick; $('#meAvatar').textContent = initial(me.nick);
  $('#meId').textContent = 'ID ' + me.id.slice(0, 8);
  let saved = [];
  try {
    const parsed = JSON.parse(safe.get('sc_rooms') || '[]');
    if (Array.isArray(parsed)) saved = parsed.filter(id => typeof id === 'string');
  } catch {
    safe.del('sc_rooms');
  }
  saved.forEach(id => joinRoom(id, true));
  const hashRoom = new URLSearchParams(location.hash.slice(1)).get('room');
  if (hashRoom) joinRoom(hashRoom);
  else if (!current && saved.length) select(saved[0]);
  renderAll();
}
$('#endSession').addEventListener('click', () => { leaveAll(); safe.del('sc_identity'); safe.del('sc_rooms'); location.hash = ''; location.reload(); });
addEventListener('pagehide', leaveAll);   // browser session ends -> others see "left"
function leaveAll() {
  if (!me) return;
  rooms.forEach(r => send({ t: 'leave', room: r.id, user: me }));
}

/* ---------- 3. Rooms ---------- */
const newRoomId = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
const inviteUrl = id => location.href.split('#')[0] + '#room=' + id;
const persistRooms = () => safe.set('sc_rooms', JSON.stringify([...rooms.keys()]));

function joinRoom(id, quiet) {
  id = id.trim().replace(/^.*room=/, '').toLowerCase();
  if (!/^[a-z0-9]{4,12}$/.test(id)) { toast('That room ID looks invalid.'); return; }
  if (!rooms.has(id)) {
    const r = { id, members: new Map([[me.id, me]]), msgs: [], unread: 0, bot: null };
    rooms.set(id, r);
    r.msgs.push({ sys: true, text: quiet ? 'You rejoined this room' : 'You joined the room', ts: Date.now() });
    send({ t: 'join', room: id, user: me });
    persistRooms();
  }
  select(id);
}
function leaveRoom(id) {
  send({ t: 'leave', room: id, user: me });
  rooms.delete(id); persistRooms();
  if (current === id) current = rooms.size ? [...rooms.keys()][0] : null;
  renderAll();
}
$('#createRoom').addEventListener('click', () => { joinRoom(newRoomId()); toast('Room created. Copy the invite link on the right.'); });
$('#joinForm').addEventListener('submit', e => { e.preventDefault(); const v = $('#joinId').value; if (v.trim()) { joinRoom(v); $('#joinId').value = ''; } });
$('#leaveRoom').addEventListener('click', () => current && leaveRoom(current));
$('#copyLink').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(inviteUrl(current)); toast('Invite link copied'); }
  catch { toast('Select the link and copy it manually'); }
});
function select(id) { current = id; const r = rooms.get(id); if (r) r.unread = 0; renderAll(); $('#side').classList.remove('open'); }

/* ---------- 4/5. Realtime events, presence ---------- */
function handle(e) {
  if (!e || typeof e !== 'object' || typeof e.room !== 'string' || typeof e.t !== 'string') return;
  const r = rooms.get(e.room);
  if (!r || (e.user && e.user.id === me.id)) return;
  if (e.t === 'join') {
    r.members.set(e.user.id, e.user);
    addMsg(r, { sys: true, text: e.user.nick + ' joined', ts: Date.now() });
    send({ t: 'here', room: r.id, user: me, to: e.user.id });
  } else if (e.t === 'here') {
    if (!e.to || e.to === me.id) r.members.set(e.user.id, e.user);
  } else if (e.t === 'leave') {
    if (r.members.delete(e.user.id)) addMsg(r, { sys: true, text: e.user.nick + ' left', ts: Date.now() });
  } else if (e.t === 'msg') {
    const m = e.msg;
    if (m && m.from && typeof m.from.id === 'string' && typeof m.from.nick === 'string'
        && typeof m.ts === 'number' && (typeof m.text === 'string' || typeof m.text === 'undefined')
        && (typeof m.img === 'string' || typeof m.img === 'undefined')) {
      addMsg(r, m);
    }
  }
  renderAll();
}
function addMsg(r, m) { r.msgs.push(m); if (r.id !== current && !m.sys) r.unread++; }

/* ---------- Composer: text + image ---------- */
$('#attachBtn').addEventListener('click', () => $('#file').click());
$('#file').addEventListener('change', e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (!f.type || !f.type.startsWith('image/')) { toast('Only images can be shared.'); return; }
  if (f.size > 2 * 1024 * 1024) { toast('Image is larger than 2 MB.'); return; }
  const rd = new FileReader();
  rd.onload = () => { pendingImg = rd.result; $('#previewImg').src = pendingImg; $('#previewInfo').textContent = f.name + ' · ' + Math.round(f.size / 1024) + ' KB. Check it carefully: photos can contain private details like locations or faces.'; $('#preview').classList.remove('hidden'); };
  rd.readAsDataURL(f);
});
$('#cancelImg').addEventListener('click', clearImg);
function clearImg() {
  pendingImg = null;
  $('#previewImg').removeAttribute('src');
  $('#previewInfo').textContent = '';
  $('#preview').classList.add('hidden');
  $('#file').value = '';
}

$('#composer').addEventListener('submit', e => {
  e.preventDefault();
  const r = rooms.get(current); if (!r) return;
  const text = $('#text').value.trim();
  if (!text && !pendingImg) return;
  const msg = { id: crypto.randomUUID(), from: me, text, img: pendingImg, ts: Date.now() };
  r.msgs.push(msg); send({ t: 'msg', room: r.id, msg });
  $('#text').value = ''; clearImg(); renderAll();
  if (r.bot) botReply(r, msg);
});

/* ---------- Demo guest (works with one tab) ---------- */
const guestNames = ['Maya', 'Jonas', 'Sofia', 'Ravi'];
$('#demoGuest').addEventListener('click', () => {
  const r = rooms.get(current); if (!r) return;
  if (r.bot) { r.members.delete(r.bot.id); addMsg(r, { sys: true, text: r.bot.nick + ' left', ts: Date.now() }); r.bot = null; renderAll(); return; }
  r.bot = { id: 'demo-' + crypto.randomUUID(), nick: guestNames[Math.floor(Math.random() * guestNames.length)] };
  r.members.set(r.bot.id, r.bot);
  addMsg(r, { sys: true, text: r.bot.nick + ' joined', ts: Date.now() });
  renderAll();
  setTimeout(() => { if (r.bot) { addMsg(r, { id: crypto.randomUUID(), from: r.bot, text: 'Hi, I just joined. Is this room private?', ts: Date.now() }); renderAll(); } }, 900);
});
function botReply(r, msg) {
  const bot = r.bot;
  setTimeout(() => {
    if (r.bot !== bot) return;
    addMsg(r, { id: crypto.randomUUID(), from: bot, text: msg.img ? 'Got the image. Looks good.' : ['Understood.', 'Makes sense.', 'Thanks for telling me.', 'Can you say more?'][Math.floor(Math.random() * 4)], ts: Date.now() });
    renderAll();
  }, 1000);
}

/* ---------- Rendering ---------- */
function renderAll() { renderRooms(); renderHead(); renderBanners(); renderThread(); renderMembers(); }

function renderRooms() {
  const ul = $('#rooms'); ul.replaceChildren();
  if (!rooms.size) { ul.append(el('li', 'empty', 'No conversations yet. Create a room or paste an invite link to join one.')); return; }
  rooms.forEach(r => {
    const li = el('li'); const b = el('button', 'room'); b.setAttribute('aria-current', r.id === current);
    const last = [...r.msgs].reverse().find(m => !m.sys);
    const body = el('div', 'room__body');
    body.append(el('div', 'room__name', 'Room ' + r.id), el('div', 'room__last', last ? (last.from.id === me.id ? 'You: ' : last.from.nick + ': ') + (last.text || 'Image') : r.members.size + ' online'));
    b.append(el('div', 'avatar avatar--grey', '#'), body);
    if (r.unread) b.append(el('span', 'badge', r.unread));
    b.addEventListener('click', () => select(r.id)); li.append(b); ul.append(li);
  });
}
function renderHead() {
  const r = rooms.get(current);
  $('#roomTitle').textContent = r ? 'Room ' + r.id : 'No room selected';
  $('#roomCount').classList.toggle('hidden', !r);
  $('#leaveRoom').classList.toggle('hidden', !r);
  if (r) $('#roomCount').textContent = r.members.size + (r.members.size === 1 ? ' person online' : ' people online');
  ['#text', '#attachBtn', '#sendBtn'].forEach(s => $(s).disabled = !r);
}
function renderBanners() {
  const box = $('#banners'); box.replaceChildren();
  const r = rooms.get(current); if (!r) return;
  if (!safe.get('sc_warn_off')) {
    const b = el('div', 'banner'); b.setAttribute('role', 'note');
    b.append(el('p', null, 'Stay safe: never share passwords, bank details or your address. Anyone with the invite link can read this room, and people may not be who they say they are.'));
    const x = el('button', null, '×'); x.setAttribute('aria-label', 'Dismiss warning'); x.onclick = () => { safe.set('sc_warn_off', '1'); renderBanners(); };
    b.append(x); box.append(b);
  }
  if (r.members.size === 1) {
    const b = el('div', 'banner banner--info');
    b.append(el('p', null, 'You are the only person here. Copy the invite link to bring someone in, or add a demo guest.'));
    box.append(b);
  }
}
function renderThread() {
  const t = $('#thread'); t.replaceChildren();
  const r = rooms.get(current);
  if (!r) { const w = el('div', 'welcome'); w.append(el('h2', null, 'Welcome, ' + me.nick), el('p', null, 'Create a room and share its link, or join one with an invite. Everything disappears when you close this tab.')); t.append(w); return; }
  r.msgs.forEach(m => {
    if (m.sys) { t.append(el('div', 'sys', m.text)); return; }
    if (!m.from || typeof m.from.id !== 'string' || typeof m.from.nick !== 'string') return;
    const mine = m.from.id === me.id;
    const row = el('div', 'msg' + (mine ? ' msg--out' : ''));
    if (!mine) row.append(el('div', 'avatar avatar--sm avatar--grey', initial(m.from.nick)));
    const col = el('div', 'msg__col');
    if (!mine) col.append(el('span', 'msg__who', m.from.nick));
    if (m.img) { const b = el('div', 'bubble bubble--img'); const i = el('img'); i.src = m.img; i.alt = 'Image from ' + m.from.nick; b.append(i); col.append(b); }
    if (m.text) col.append(el('div', 'bubble', m.text));
    col.append(el('span', 'time', clock(m.ts)));
    row.append(col); t.append(row);
  });
  t.scrollTop = t.scrollHeight;   // auto-scroll
}
function renderMembers() {
  const r = rooms.get(current); const ul = $('#memList'); ul.replaceChildren();
  $('#invite').classList.toggle('hidden', !r);
  $('#memTitle').textContent = r ? 'People online · ' + r.members.size : 'People online';
  if (!r) return;
  $('#inviteLink').textContent = inviteUrl(r.id);
  $('#demoGuest').textContent = r.bot ? 'Remove demo guest' : 'Add demo guest';
  r.members.forEach(u => { const li = el('li'); li.append(el('div', 'avatar avatar--sm' + (u.id === me.id ? '' : ' avatar--grey'), initial(u.nick)), el('span', null, u.nick), u.id === me.id ? el('small', null, 'you') : document.createTextNode('')); ul.append(li); });
}

/* Mobile drawers */
$('#openSide').onclick = () => $('#side').classList.toggle('open');
$('#openMembers').onclick = () => $('#members').classList.toggle('open');

/* ---------- Boot ---------- */
const saved = loadIdentity();
if (saved) { me = saved; enterApp(); }
