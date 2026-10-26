/**
 * demo.js - Demo guests
 *
 * Exactly 2 fake users. Nothing here runs until "+ Demo guest" is clicked,
 * and the timer stops once every guest has been removed.
 * Demo activity stays in this tab; it is never sent to other tabs.
 */
window.Demo = (function () {
  'use strict';

  const USERS = [
    { id: 'demo-kofi', name: 'Kofi Mensah', color: '#B71C1C', demo: true },
    { id: 'demo-ama', name: 'Ama Serwaa', color: '#374151', demo: true }
  ];

  const LINES = {
    General: ['How is everyone doing today?', 'Image sharing works nicely.', 'Checking in from Accra.', 'Invite me to a private room to test 1-on-1 chat.'],
    Random: ['Anyone tried the new coffee place on Oxford Street?', 'Listening to highlife while I work.', 'Friday deploy? Brave or reckless?'],
    Help: ['Hover a member and click "Private" to start a 1-on-1 room.', 'Use the picture button to share an image.', 'Click a message to react with an emoji.'],
    private: ['Just us in here. What did you want to talk about?', 'Anything else on your mind?'],
    other: ['Nice room!', 'Happy to be here.']
  };
  const GREETINGS = ['Hi everyone, just joined.', 'Hello! What are we talking about?', 'Hey, good to be here.'];
  const REPLIES = ['Totally agree.', 'Thanks for sharing.', 'Makes sense to me.', 'Can you say more?'];
  const IMAGE_REPLIES = ['Got the image. Looks good.', 'Nice picture!'];
  const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '🙏'];

  let app = null;     // functions provided by app.js
  let timer = null;

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const guestsIn = (room) => USERS.filter((u) => room.guests.has(u.id));
  const anyActive = () => app.allRooms().some((r) => r.guests.size > 0);

  function init(api) { app = api; }

  // Add the next free guest to a public room. Returns false when both are already there.
  function add(room) {
    const guest = USERS.find((u) => !room.guests.has(u.id));
    if (!guest) return false;
    enter(room, guest, pick(GREETINGS));
    return true;
  }

  function enter(room, guest, greeting) {
    room.guests.add(guest.id);
    room.members.set(guest.id, guest);
    app.addMessage(room, app.systemMsg(`${guest.name} joined (demo guest)`));
    say(room, guest, greeting, 800);
    startTimer();
  }

  function removeAll(room) {
    guestsIn(room).forEach((g) => {
      room.guests.delete(g.id);
      room.members.delete(g.id);
      app.setTyping(g.id, g.name, false);
      app.addMessage(room, app.systemMsg(`${g.name} left`));
    });
    if (!anyActive()) stopTimer();
  }

  // Show "typing..." for a moment, then post the message.
  function say(room, guest, text, delay) {
    setTimeout(() => {
      if (app.isOffline() || !room.guests.has(guest.id)) return;
      app.setTyping(guest.id, guest.name, true, room);
      setTimeout(() => {
        app.setTyping(guest.id, guest.name, false, room);
        if (app.isOffline() || !room.guests.has(guest.id)) return;
        app.addMessage(room, { id: app.uuid(), from: guest, text, img: null, ts: Date.now(), reactions: {} });
      }, 1200 + Math.random() * 1000);
    }, delay);
  }

  // Called after the user sends a message.
  function reply(room, msg) {
    const guests = guestsIn(room);
    if (!guests.length) return;
    if (!room.isPrivate && !msg.img && Math.random() > 0.6) return;
    const guest = pick(guests);
    say(room, guest, pick(msg.img ? IMAGE_REPLIES : REPLIES), 700 + Math.random() * 1200);
    if (Math.random() < 0.35) setTimeout(() => react(room, guest, msg), 1500);
  }

  function react(room, guest, msg) {
    if (app.isOffline() || !room.guests.has(guest.id)) return;
    const emoji = pick(EMOJIS);
    const who = msg.reactions[emoji] || {};
    if (!who[guest.id]) app.toggleReaction(room, msg, emoji, guest);
  }

  // Background chatter, only in the room you are looking at.
  function tick() {
    const room = app.currentRoom();
    const guests = room ? guestsIn(room) : [];
    if (!guests.length || app.isOffline()) return;
    const guest = pick(guests);
    const recent = room.msgs.filter((m) => m.from && m.from.id !== guest.id).slice(-4);
    if (recent.length && Math.random() < 0.3) return react(room, guest, pick(recent));
    const pool = room.isPrivate ? LINES.private : LINES[room.name] || LINES.other;
    say(room, guest, pick(pool), 0);
  }

  function startTimer() {
    if (timer) return;
    const next = () => {
      timer = setTimeout(() => {
        timer = null;
        if (!anyActive()) return;
        tick();
        next();
      }, 7000 + Math.random() * 7000);
    };
    next();
  }

  function stopTimer() {
    clearTimeout(timer);
    timer = null;
  }

  return {
    USERS,
    init,
    add,
    enter,
    removeAll,
    reply,
    count: (room) => room.guests.size,
    max: USERS.length,
    isGuest: (id) => USERS.some((u) => u.id === id)
  };
})();
