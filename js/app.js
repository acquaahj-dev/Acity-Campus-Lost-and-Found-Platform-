/**
 * app.js - Secure Chat
 *
 * Sidebar: public rooms, private rooms, members, demo guests, offline toggle.
 * Main: message thread with text, images and emoji reactions.
 *
 * Tabs talk to each other with BroadcastChannel (no server needed).
 * Each tab is its own user because identity is kept in sessionStorage.
 */
(function () {
  'use strict';

  /* ---------- Constants ---------- */
  const COLORS = ['#D32F2F', '#B71C1C', '#E53935', '#C62828', '#991B1B', '#7F1D1D',
                  '#1F1F23', '#2C2C30', '#374151', '#4B5563', '#6B7280', '#0D0D0E'];
  const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '🙏'];
  const NAME_RE = /^[a-zA-Z0-9 _-]{2,20}$/;
  const ROOM_RE = /^[a-zA-Z0-9 _-]{2,24}$/;
  const PRIVATE_RE = /^private-[a-z0-9-]{1,40}$/;
  const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
  const IMG_RE = /^data:image\/(png|jpe?g|gif|webp|bmp|avif);base64,/i;
  const MAX_TEXT = 500;
  const MAX_IMG = 2 * 1024 * 1024;
  const MAX_MSGS = 200;

  /* ---------- Helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const make = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''));
  const initial = (name) => (name || '?').trim().charAt(0).toUpperCase() || '?';
  const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const systemMsg = (text) => ({ id: uuid(), sys: true, text, ts: Date.now() });
  const storage = (area) => ({
    get: (k) => { try { return area.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { area.setItem(k, v); } catch (_) {} }
  });
  const tabStore = storage(window.sessionStorage);
  const localStore = storage(window.localStorage);

  function toast(text) {
    const t = make('div', 'toast', text);
    document.body.append(t);
    setTimeout(() => t.remove(), 2400);
  }

  /* ---------- State ---------- */
  const state = {
    me: null,              // { id, name, color }
    rooms: new Map(),      // name -> room
    current: 'General',
    offline: false,
    pendingImg: null,
    color: COLORS[0],      // color picked on the profile screen
    typing: new Map(),     // userId -> { name, timer }
    typingTimer: null,
    target: null           // person chosen for a private room
  };
  const myId = () => (state.me ? state.me.id : null);
  const currentRoom = () => state.rooms.get(state.current);
  const canSee = (r) => !r.isPrivate || r.participants.includes(myId());

  function getRoom(name, isPrivate = false, participants = []) {
    if (!state.rooms.has(name)) {
      state.rooms.set(name, {
        name,
        isPrivate,
        participants: isPrivate ? participants.slice(0, 2) : [],
        msgs: [systemMsg(isPrivate ? '🔒 Private room. Only the 2 invited people can see it.' : `Welcome to #${name}.`)],
        members: new Map(),
        guests: new Set(),
        unread: 0,
        joined: false
      });
    }
    return state.rooms.get(name);
  }
  ['General', 'Random', 'Help'].forEach((n) => getRoom(n));

  /* ---------- Transport (swap send/onmessage for Socket.IO to use a server) ---------- */
  const TAB = uuid();
  let channel = null;
  try { channel = new BroadcastChannel('securechat-v2'); } catch (_) {}

  function send(event) {
    if (!channel || state.offline) return;
    event.tab = TAB;
    channel.postMessage(event);
  }
  if (channel) channel.onmessage = (e) => { if (!state.offline) receive(e.data); };

  /* Anything from another tab is checked before use */
  function cleanUser(u) {
    if (!u || typeof u.id !== 'string' || u.id.length > 64 || Demo.isGuest(u.id) || !NAME_RE.test(u.name)) return null;
    return { id: u.id, name: u.name, color: COLOR_RE.test(u.color) ? u.color : COLORS[0] };
  }
  function cleanReactions(r) {
    const out = {};
    EMOJIS.forEach((emoji) => {
      const who = r && r[emoji];
      if (!who || typeof who !== 'object') return;
      const ok = {};
      Object.keys(who).slice(0, 100).forEach((id) => { if (typeof who[id] === 'string') ok[id] = who[id].slice(0, 20); });
      if (Object.keys(ok).length) out[emoji] = ok;
    });
    return out;
  }
  function cleanMsg(m) {
    if (!m || typeof m.id !== 'string' || typeof m.ts !== 'number') return null;
    if (m.sys) {
      return m.invite && typeof m.text === 'string' && PRIVATE_RE.test(m.room || '')
        ? { id: m.id, sys: true, invite: true, room: m.room, text: m.text.slice(0, 200), ts: m.ts } : null;
    }
    const from = cleanUser(m.from);
    const text = typeof m.text === 'string' ? m.text.slice(0, MAX_TEXT) : '';
    const img = typeof m.img === 'string' && IMG_RE.test(m.img) ? m.img : null;
    if (!from || (!text && !img)) return null;
    return { id: m.id, from, text, img, ts: m.ts, reactions: cleanReactions(m.reactions) };
  }

  function receive(e) {
    if (!e || typeof e.t !== 'string' || e.tab === TAB) return;
    const room = state.rooms.get(e.room);
    const user = cleanUser(e.user);

    if (e.t === 'hello') {                 // new tab wants the history
      send({ t: 'sync', to: e.tab, rooms: exportRooms(e.userId) });
      state.rooms.forEach((r) => { if (r.joined && state.me) send({ t: 'here', room: r.name, user: state.me, to: e.tab }); });
    } else if (e.t === 'sync' && e.to === TAB && Array.isArray(e.rooms)) {
      importRooms(e.rooms);
    } else if (e.t === 'room' && ROOM_RE.test(e.name || '')) {
      getRoom(e.name);
      renderSidebar();
    } else if ((e.t === 'join' || e.t === 'here') && room && user) {
      if (e.to && e.to !== TAB) return;
      if (room.isPrivate && !room.participants.includes(user.id)) return;
      if (e.t === 'join' && !room.members.has(user.id)) addMessage(room, systemMsg(`${user.name} joined`));
      room.members.set(user.id, user);
      if (e.t === 'join' && room.joined && state.me) send({ t: 'here', room: room.name, user: state.me, to: e.tab });
      renderSidebar();
      renderBanners();
    } else if (e.t === 'leave' && room && user && room.members.delete(user.id)) {
      addMessage(room, systemMsg(`${user.name} left`));
      setTyping(user.id, user.name, false, room);
      renderSidebar();
      renderBanners();
    } else if (e.t === 'profile' && user) {
      state.rooms.forEach((r) => { if (r.members.has(user.id)) r.members.set(user.id, user); });
      renderSidebar();
    } else if (e.t === 'invite' && user && PRIVATE_RE.test(e.room || '') && Array.isArray(e.participants)) {
      const priv = getRoom(e.room, true, e.participants.map(String));
      const notice = cleanMsg(e.notice);
      if (notice) addMessage(getRoom('General'), notice);
      if (canSee(priv) && e.to === myId()) showInvite(user.name, priv.name);
      renderSidebar();
    } else if (e.t === 'msg' && room && canSee(room)) {
      const m = cleanMsg(e.msg);
      if (!m || m.sys) return;
      setTyping(m.from.id, m.from.name, false, room);
      addMessage(room, m);
    } else if (e.t === 'reaction' && room && canSee(room)) {
      const m = room.msgs.find((x) => x.id === e.msgId && !x.sys);
      if (m) { m.reactions = cleanReactions(e.reactions); if (room.name === state.current) renderThread(); }
    } else if (e.t === 'typing' && room && user) {
      setTyping(user.id, user.name, !!e.on, room);
    }
  }

  function exportRooms(forUser) {
    return [...state.rooms.values()]
      .filter((r) => !r.isPrivate || r.participants.includes(forUser))
      .map((r) => ({
        name: r.name,
        isPrivate: r.isPrivate,
        participants: r.participants,
        msgs: r.msgs.filter((m) => (m.sys ? m.invite : !m.from.demo)) // skip demo chatter + join notices
      }));
  }

  function importRooms(list) {
    list.slice(0, 100).forEach((raw) => {
      if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.msgs)) return;
      const ok = raw.isPrivate ? PRIVATE_RE.test(raw.name) && Array.isArray(raw.participants) : ROOM_RE.test(raw.name);
      if (!ok) return;
      const r = getRoom(raw.name, !!raw.isPrivate, (raw.participants || []).map(String));
      raw.msgs.slice(-MAX_MSGS).forEach((x) => {
        const m = cleanMsg(x);
        if (m && !r.msgs.some((y) => y.id === m.id)) r.msgs.push(m);
      });
      r.msgs.sort((a, b) => a.ts - b.ts);
    });
    renderAll();
  }

  /* ---------- Messages ---------- */
  function addMessage(room, msg) {
    if (room.msgs.some((m) => m.id === msg.id)) return;
    room.msgs.push(msg);
    if (room.msgs.length > MAX_MSGS) room.msgs.shift();
    if (room.name === state.current) {
      renderThread(msg.from && msg.from.id === myId());
    } else if (!msg.sys && canSee(room)) {
      room.unread++;
      renderSidebar();
    }
  }

  function toggleReaction(room, msg, emoji, user) {
    const who = msg.reactions[emoji] || (msg.reactions[emoji] = {});
    if (who[user.id]) delete who[user.id]; else who[user.id] = user.name;
    if (!Object.keys(who).length) delete msg.reactions[emoji];
    if (!user.demo && !msg.from.demo) send({ t: 'reaction', room: room.name, msgId: msg.id, reactions: msg.reactions });
    if (room.name === state.current) renderThread();
  }

  /* ---------- Typing indicator ---------- */
  function setTyping(id, name, on, room) {
    if (room && room.name !== state.current) return;
    const old = state.typing.get(id);
    if (old) clearTimeout(old.timer);
    state.typing.delete(id);
    if (on) state.typing.set(id, { name, timer: setTimeout(() => setTyping(id, name, false), 4000) });
    const names = [...state.typing.values()].map((t) => t.name);
    $('typing').textContent = !names.length ? ''
      : names.length === 1 ? `${names[0]} is typing...`
      : names.length === 2 ? `${names[0]} and ${names[1]} are typing...` : 'Several people are typing...';
  }

  function onInput() {
    const input = $('msgInput');
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    if (!state.me) return;
    if (!state.typingTimer) send({ t: 'typing', room: state.current, user: state.me, on: true });
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(stopTyping, 2000);
  }
  function stopTyping() {
    if (!state.typingTimer) return;
    clearTimeout(state.typingTimer);
    state.typingTimer = null;
    send({ t: 'typing', room: state.current, user: state.me, on: false });
  }

  /* ---------- Rooms ---------- */
  function switchRoom(name) {
    const room = state.rooms.get(name);
    if (!room || !canSee(room)) return;
    stopTyping();
    state.current = name;
    room.unread = 0;
    state.typing.forEach((t) => clearTimeout(t.timer));
    state.typing.clear();
    $('typing').textContent = '';
    if (state.me && !room.joined) {
      room.joined = true;
      room.members.set(state.me.id, state.me);
      send({ t: 'join', room: name, user: state.me });
    }
    clearImage();
    closeDrawer();
    renderAll(true);
  }

  function createRoom(e) {
    e.preventDefault();
    const name = $('roomInput').value.trim().replace(/\s+/g, ' ');
    if (!ROOM_RE.test(name)) { $('roomError').textContent = 'Use 2-24 letters, numbers, spaces, _ or -.'; return; }
    if ([...state.rooms.keys()].some((k) => k.toLowerCase() === name.toLowerCase())) {
      $('roomError').textContent = 'A room with that name already exists.';
      return;
    }
    getRoom(name);
    send({ t: 'room', name });
    $('roomDialog').close();
    switchRoom(name);
  }

  /* ---------- Private rooms ---------- */
  function openPrivateDialog(person) {
    const select = $('privateSelect');
    select.replaceChildren();
    const people = person ? [person] : [...getRoom('General').members.values()].filter((u) => u.id !== myId());
    people.forEach((u) => {
      const opt = make('option', null, u.name + (u.demo ? ' (demo guest)' : ''));
      opt.value = u.id;
      select.append(opt);
    });
    state.target = people[0] || null;
    select.onchange = () => { state.target = people.find((u) => u.id === select.value) || null; };
    select.classList.toggle('hidden', !!person || !people.length);
    $('privateOk').disabled = !people.length;
    $('privatePrompt').textContent = person ? `Start a private 1-on-1 room with ${person.name}?`
      : people.length ? 'Pick someone from General to talk to privately.'
      : 'Nobody else is in General yet. Open another tab or add a demo guest first.';
    $('privateDialog').showModal();
  }

  function startPrivate(e) {
    e.preventDefault();
    const target = state.target;
    $('privateDialog').close();
    if (!target || !state.me) return;

    const existing = [...state.rooms.values()].find((r) => r.isPrivate && r.participants.includes(myId()) && r.participants.includes(target.id));
    if (existing) return switchRoom(existing.name);

    const slug = target.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'room';
    const room = getRoom(`private-${slug}-${Math.random().toString(36).slice(2, 6)}`, true, [myId(), target.id]);
    const notice = { id: uuid(), sys: true, invite: true, room: room.name, ts: Date.now(), text: `🔒 ${state.me.name} invited ${target.name} to a private room.` };
    addMessage(getRoom('General'), notice);

    if (target.demo) Demo.enter(room, target, `Hey ${state.me.name}! Thanks for the private invite. What's on your mind?`);
    else send({ t: 'invite', room: room.name, participants: room.participants, user: state.me, to: target.id, notice });
    switchRoom(room.name);
  }

  function showInvite(fromName, roomName) {
    $('inviteText').textContent = `🔒 ${fromName} invited you to a private room.`;
    $('invite').classList.remove('hidden');
    $('inviteJoin').onclick = () => { $('invite').classList.add('hidden'); switchRoom(roomName); };
  }

  // A private room is labelled with the other person's name
  function privateName(room) {
    const otherId = room.participants.find((id) => id !== myId());
    let other = Demo.USERS.find((u) => u.id === otherId);
    state.rooms.forEach((r) => { other = other || r.members.get(otherId); });
    return '🔒 ' + (other ? other.name : 'Private room');
  }

  /* ---------- Rendering: sidebar ---------- */
  function renderAll(scrollDown) {
    renderSidebar();
    renderHeader();
    renderBanners();
    renderThread(scrollDown);
  }

  function roomItem(room) {
    const li = make('li');
    const btn = make('button', 'room' + (room.isPrivate ? ' room--private' : ''));
    btn.type = 'button';
    btn.setAttribute('aria-current', String(room.name === state.current));
    btn.append(make('span', null, room.isPrivate ? privateName(room) : '# ' + room.name));
    if (room.unread) btn.append(make('b', 'unread', String(room.unread)));
    btn.onclick = () => switchRoom(room.name);
    li.append(btn);
    return li;
  }

  function renderSidebar() {
    const rooms = [...state.rooms.values()];
    $('publicRooms').replaceChildren(...rooms.filter((r) => !r.isPrivate).map(roomItem));
    const priv = rooms.filter((r) => r.isPrivate && canSee(r));
    $('privateRooms').replaceChildren(...(priv.length ? priv.map(roomItem) : [make('li', 'empty', 'No private rooms yet.')]));

    const room = currentRoom();
    const people = [...room.members.values()].sort((a, b) => (a.id === myId() ? -1 : b.id === myId() ? 1 : a.name.localeCompare(b.name)));
    $('memberCount').textContent = people.length;
    $('members').replaceChildren(...people.map((u) => memberItem(u, room)));

    const guests = Demo.count(room);
    $('addGuestBtn').textContent = `+ Guest ${guests}/${Demo.max}`;
    $('addGuestBtn').classList.toggle('hidden', room.isPrivate || guests >= Demo.max);
    $('removeGuestsBtn').classList.toggle('hidden', room.isPrivate || guests === 0);
  }

  function memberItem(u, room) {
    const li = make('li', 'member');
    const av = make('div', 'avatar avatar--sm', initial(u.name));
    av.style.background = u.color;
    li.append(av, make('span', 'member__name', u.id === myId() ? `${u.name} (you)` : u.name));
    if (u.demo) li.append(make('span', 'tag', 'demo'));
    if (u.id !== myId() && !room.isPrivate) {
      const b = make('button', 'private-btn', '🔒 Private');
      b.type = 'button';
      b.setAttribute('aria-label', `Start a private room with ${u.name}`);
      b.onclick = () => openPrivateDialog(u);
      li.append(b);
    }
    return li;
  }

  function renderHeader() {
    const room = currentRoom();
    $('roomTitle').textContent = room.isPrivate ? privateName(room) : '# ' + room.name;
    $('roomSub').textContent = room.isPrivate ? 'Private 1-on-1 room' : 'Public room';
    $('backBtn').classList.toggle('hidden', !room.isPrivate);
  }

  function renderBanners() {
    const box = $('banners');
    box.replaceChildren();
    if (!localStore.get('sc_warn_off')) {
      const b = make('div', 'banner');
      const x = make('button', null, '×');
      x.type = 'button';
      x.setAttribute('aria-label', 'Dismiss');
      x.onclick = () => { localStore.set('sc_warn_off', '1'); renderBanners(); };
      b.append(make('p', null, 'Stay safe: never share passwords, bank details or your address. People may not be who they say they are.'), x);
      box.append(b);
    }
    const room = currentRoom();
    if (!room.isPrivate && room.members.size <= 1) {
      const b = make('div', 'banner banner--info');
      b.append(make('p', null, 'You are the only one here. Open this page in another tab to chat as a second user, or add a demo guest.'));
      box.append(b);
    }
  }

  /* ---------- Rendering: thread ---------- */
  function renderThread(forceBottom) {
    const thread = $('thread');
    const nearBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 80;
    const room = currentRoom();
    thread.replaceChildren(...room.msgs.map((m, i) => messageEl(room, m, room.msgs[i - 1])));
    if (forceBottom || nearBottom) thread.scrollTop = thread.scrollHeight;
  }

  function messageEl(room, m, prev) {
    if (m.sys) {
      const d = make('div', 'sys' + (m.invite ? ' sys--invite' : ''), m.text);
      const target = m.invite && state.rooms.get(m.room);
      if (target && canSee(target)) {
        const b = make('button', 'btn btn--small', 'Open');
        b.type = 'button';
        b.onclick = () => switchRoom(target.name);
        d.append(b);
      }
      return d;
    }

    const mine = m.from.id === myId();
    const grouped = prev && !prev.sys && prev.from.id === m.from.id && m.ts - prev.ts < 120000;
    const row = make('div', 'msg' + (mine ? ' msg--out' : '') + (grouped ? ' msg--grouped' : ''));
    const av = make('div', 'avatar', initial(m.from.name));
    av.style.background = m.from.color;

    const col = make('div', 'msg__col');
    if (!grouped) {
      const who = make('div', 'msg__who', mine ? 'You' : m.from.name);
      who.append(make('span', null, clock(m.ts)));
      col.append(who);
    }

    const bubbles = make('div', 'bubbles');
    bubbles.title = clock(m.ts);
    if (m.img) {
      const b = make('div', 'bubble bubble--img');
      const img = make('img');
      img.src = m.img;
      img.alt = 'Image from ' + m.from.name;
      img.onload = () => { if (room.msgs[room.msgs.length - 1] === m) $('thread').scrollTop = $('thread').scrollHeight; };
      b.append(img);
      bubbles.append(b);
    }
    if (m.text) bubbles.append(make('div', 'bubble', m.text));

    const bar = make('div', 'emoji-bar');
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Add reaction');
    EMOJIS.forEach((emoji) => {
      const b = make('button', null, emoji);
      b.type = 'button';
      b.setAttribute('aria-label', 'React with ' + emoji);
      b.onclick = (e) => { e.stopPropagation(); react(room, m, emoji); };
      bar.append(b);
    });
    bubbles.append(bar);
    bubbles.onclick = () => bar.classList.toggle('open');
    col.append(bubbles);

    const reactions = make('div', 'reactions');
    Object.keys(m.reactions).forEach((emoji) => {
      const ids = Object.keys(m.reactions[emoji]);
      const pill = make('button', 'reaction' + (ids.includes(myId()) ? ' reaction--mine' : ''), `${emoji} ${ids.length}`);
      pill.type = 'button';
      pill.title = ids.map((id) => m.reactions[emoji][id]).join(', ');
      pill.onclick = () => react(room, m, emoji);
      reactions.append(pill);
    });
    col.append(reactions);

    row.append(av, col);
    return row;
  }

  function react(room, msg, emoji) {
    if (state.me && !state.offline) toggleReaction(room, msg, emoji, state.me);
  }

  /* ---------- Composer ---------- */
  function sendMessage(e) {
    if (e) e.preventDefault();
    if (!state.me || state.offline) return;
    const text = $('msgInput').value.trim();
    if (!text && !state.pendingImg) return;
    const room = currentRoom();
    const msg = { id: uuid(), from: { ...state.me }, text, img: state.pendingImg, ts: Date.now(), reactions: {} };
    stopTyping();
    addMessage(room, msg);
    send({ t: 'msg', room: room.name, msg });
    $('msgInput').value = '';
    $('msgInput').style.height = 'auto';
    clearImage();
    Demo.reply(room, msg);
  }

  function pickImage(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp|bmp|avif)$/i.test(file.type)) return toast('Only PNG, JPG, GIF, WebP, BMP or AVIF images.');
    if (file.size > MAX_IMG) return toast('Image is larger than 2 MB.');
    const reader = new FileReader();
    reader.onload = () => {
      state.pendingImg = reader.result;
      $('previewImg').src = reader.result;
      $('previewInfo').textContent = `${file.name || 'Image'} · ${Math.round(file.size / 1024)} KB. Check it first: photos can show locations or faces.`;
      $('preview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    state.pendingImg = null;
    $('previewImg').removeAttribute('src');
    $('preview').classList.add('hidden');
    $('fileInput').value = '';
  }

  /* ---------- Profile ---------- */
  function renderSwatches() {
    $('swatches').replaceChildren(...COLORS.map((c) => {
      const b = make('button', 'swatch');
      b.type = 'button';
      b.style.background = c;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', 'Color ' + c);
      b.setAttribute('aria-checked', String(c === state.color));
      b.onclick = () => { state.color = c; renderSwatches(); };
      return b;
    }));
    $('avatarPreview').textContent = initial($('nameInput').value || '?');
    $('avatarPreview').style.background = state.color;
  }

  function showGate(editing) {
    $('gate').classList.remove('hidden');
    $('gateTitle').textContent = editing ? 'Update profile' : 'Welcome to Chat';
    $('profileBtn').textContent = editing ? 'Save changes' : 'Start chatting';
    $('cancelProfile').classList.toggle('hidden', !editing);
    $('nameInput').value = state.me ? state.me.name : '';
    $('nameError').textContent = '';
    renderSwatches();
    $('nameInput').focus();
  }

  function hideGate() {
    $('gate').classList.add('hidden');
    $('app').classList.remove('hidden');
  }

  function saveProfile(e) {
    e.preventDefault();
    const name = $('nameInput').value.trim();
    if (!NAME_RE.test(name)) { $('nameError').textContent = 'Use 2-20 letters, numbers, spaces, _ or -.'; return; }
    const taken = Demo.USERS.concat(...[...state.rooms.values()].map((r) => [...r.members.values()]))
      .some((u) => u.id !== myId() && u.name.toLowerCase() === name.toLowerCase());
    if (taken) { $('nameError').textContent = `"${name}" is already in use.`; return; }

    const isNew = !state.me;
    if (isNew) state.me = { id: uuid(), name, color: state.color };
    else Object.assign(state.me, { name, color: state.color });
    tabStore.set('sc_me', JSON.stringify(state.me));
    showMe();
    hideGate();
    if (isNew) {
      send({ t: 'hello', userId: myId() });
      switchRoom('General');
    } else {
      send({ t: 'profile', user: state.me });
      renderAll();
    }
  }

  function showMe() {
    $('myName').textContent = state.me.name;
    $('myAvatar').textContent = initial(state.me.name);
    $('myAvatar').style.background = state.me.color;
  }

  /* ---------- Offline, theme, drawer ---------- */
  function toggleOffline() {
    const goingOffline = $('offlineToggle').checked;
    const setStatus = (cls, text) => { $('status').className = 'status status--' + cls; $('statusText').textContent = text; };
    const setEnabled = (on) => ['msgInput', 'sendBtn', 'attachBtn'].forEach((id) => { $(id).disabled = !on; });
    if (goingOffline) {
      stopTyping();
      state.offline = true;
      setStatus('offline', 'Offline');
      setEnabled(false);
      return;
    }
    setStatus('reconnecting', 'Reconnecting...');
    setTimeout(() => {
      state.offline = false;
      setStatus('connected', 'Connected');
      setEnabled(true);
      send({ t: 'hello', userId: myId() });   // catch up on missed messages
      state.rooms.forEach((r) => { if (r.joined) send({ t: 'here', room: r.name, user: state.me }); });
    }, 1500);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStore.set('sc_theme', theme);
  }

  function openDrawer() { $('side').classList.add('open'); $('backdrop').classList.remove('hidden'); }
  function closeDrawer() { $('side').classList.remove('open'); $('backdrop').classList.add('hidden'); }

  /* ---------- Wiring ---------- */
  function bindEvents() {
    $('profileForm').onsubmit = saveProfile;
    $('nameInput').oninput = () => { $('nameError').textContent = ''; renderSwatches(); };
    $('editProfile').onclick = () => showGate(true);
    $('cancelProfile').onclick = hideGate;

    $('newRoomBtn').onclick = () => { $('roomInput').value = ''; $('roomError').textContent = ''; $('roomDialog').showModal(); };
    $('roomForm').onsubmit = createRoom;
    $('newPrivateBtn').onclick = () => openPrivateDialog(null);
    $('privateForm').onsubmit = startPrivate;
    document.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => b.closest('dialog').close(); });
    $('backBtn').onclick = () => switchRoom('General');
    $('inviteDismiss').onclick = () => $('invite').classList.add('hidden');

    $('addGuestBtn').onclick = () => { if (!Demo.add(currentRoom())) toast('Only 2 demo guests are allowed.'); renderAll(); };
    $('removeGuestsBtn').onclick = () => { Demo.removeAll(currentRoom()); renderAll(); };

    $('composer').onsubmit = sendMessage;
    $('msgInput').oninput = onInput;
    $('msgInput').onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) sendMessage(e); };
    $('attachBtn').onclick = () => $('fileInput').click();
    $('fileInput').onchange = (e) => pickImage(e.target.files[0]);
    $('removeImg').onclick = clearImage;

    $('offlineToggle').onchange = toggleOffline;
    $('themeBtn').onclick = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    $('menuBtn').onclick = openDrawer;
    $('backdrop').onclick = closeDrawer;
    window.addEventListener('pagehide', () => {
      state.rooms.forEach((r) => { if (r.joined) send({ t: 'leave', room: r.name, user: state.me }); });
    });
  }

  /* ---------- Boot ---------- */
  Demo.init({
    addMessage,
    systemMsg,
    uuid,
    setTyping,
    toggleReaction,
    currentRoom,
    allRooms: () => [...state.rooms.values()],
    isOffline: () => state.offline
  });

  bindEvents();
  const dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(localStore.get('sc_theme') || (dark ? 'dark' : 'light'));

  try { state.me = JSON.parse(tabStore.get('sc_me')); } catch (_) { state.me = null; }
  if (state.me && !cleanUser(state.me)) state.me = null;
  send({ t: 'hello', userId: myId() });

  if (state.me) {
    state.color = state.me.color;
    showMe();
    hideGate();
    switchRoom('General');
  } else {
    showGate(false);
  }
})();
