/* PRINCESS - princess-item-directory.js
   PART 1: HoursStatus engine. Works out Open / Closing soon / Closed for every hub from its hours.
           (Built on the hours-status module delivered earlier. Read it so you can explain it in the viva.)
   PART 2: Hub directory with search box and filter chips (All / Open now / 24/7).
   Needs: group5.js (HUBS) loaded first.
   Other files use the engine: HoursStatus.getHubStatus(hub), HoursStatus.refresh(). */

/* ================= PART 1: HoursStatus engine ================= */
(function (root) {
    'use strict';

    const TIME_ZONE = 'Africa/Accra';       // always judge by campus time, not the visitor's device clock
    const CLOSING_SOON_MINUTES = 30;
    const REFRESH_MS = 60 * 1000;
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    function toMinutes(hhmm) {
        const parts = hhmm.split(':').map(Number);
        return parts[0] * 60 + parts[1];
    }

    function formatTime(hhmm) {
        const total = toMinutes(hhmm) % 1440;
        const h = Math.floor(total / 60);
        const m = total % 60;
        const suffix = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return h12 + ':' + String(m).padStart(2, '0') + ' ' + suffix;
    }

    /* Day of week (0 = Sunday) and minutes since midnight, in campus time. */
    function getCampusNow(date) {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: TIME_ZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(date || new Date());
        const get = function (type) {
            return parts.find(function (p) { return p.type === type; }).value;
        };
        return { day: WEEKDAY_INDEX[get('weekday')], minutes: Number(get('hour')) * 60 + Number(get('minute')) };
    }

    /* Minutes until closing if the hub is open right now, otherwise null. Handles windows past midnight. */
    function minutesUntilClose(schedule, now) {
        const prevDay = (now.day + 6) % 7;
        for (let i = 0; i < schedule.length; i++) {
            const w = schedule[i];
            const o = toMinutes(w.open);
            const c = toMinutes(w.close);
            const overnight = c <= o;
            if (w.days.indexOf(now.day) !== -1) {
                if (!overnight && now.minutes >= o && now.minutes < c) return c - now.minutes;
                if (overnight && now.minutes >= o) return 1440 - now.minutes + c;
            }
            if (overnight && w.days.indexOf(prevDay) !== -1 && now.minutes < c) return c - now.minutes;
        }
        return null;
    }

    /* Next opening as { offset: days from today, time: "HH:MM", day }, or null. */
    function nextOpening(schedule, now) {
        let best = null;
        for (let offset = 0; offset <= 7; offset++) {
            const day = (now.day + offset) % 7;
            for (let i = 0; i < schedule.length; i++) {
                const w = schedule[i];
                if (w.days.indexOf(day) === -1) continue;
                const start = offset * 1440 + toMinutes(w.open);
                if (start <= now.minutes) continue;
                if (best === null || start < best.start) best = { start: start, offset: offset, time: w.open, day: day };
            }
        }
        return best;
    }

    function describeNextOpening(next) {
        if (!next) return 'Closed';
        const when = next.offset === 0 ? 'today' : next.offset === 1 ? 'tomorrow' : DAY_NAMES[next.day];
        return 'Opens ' + when + ' at ' + formatTime(next.time);
    }

    function formatCloseIn(mins) {
        return mins < 60 ? mins + ' min' : Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min';
    }

    /* Returns { state: 'open' | 'closing-soon' | 'closed', label, detail } */
    function getHubStatus(hub, date) {
        if (hub.hours.allDay) return { state: 'open', label: 'Open', detail: 'Open 24/7' };
        const now = getCampusNow(date);
        const left = minutesUntilClose(hub.hours.schedule, now);
        if (left !== null) {
            if (left <= CLOSING_SOON_MINUTES) {
                return { state: 'closing-soon', label: 'Closing soon', detail: 'Closes in ' + formatCloseIn(left) };
            }
            return { state: 'open', label: 'Open', detail: 'Open now' };
        }
        return { state: 'closed', label: 'Closed', detail: describeNextOpening(nextOpening(hub.hours.schedule, now)) };
    }

    function formatDays(days) {
        if (days.length === 7) return 'Daily';
        return days.map(function (d) { return DAY_SHORT[d]; }).join(', ');
    }

    /* e.g. "8:00 AM - 10:00 PM (Daily)"; several windows are joined with " | " */
    function formatHoursSummary(hub) {
        if (hub.hours.allDay) return '24 hours (Daily)';
        return hub.hours.schedule.map(function (w) {
            return formatTime(w.open) + ' - ' + formatTime(w.close) + ' (' + formatDays(w.days) + ')';
        }).join(' | ');
    }


    function renderStatus(el, hub) {
        const s = getHubStatus(hub);
        const signature = s.state + '|' + s.detail;
        if (el.getAttribute('data-rendered') === signature) return;   
        el.setAttribute('data-rendered', signature);
        el.className = 'status-badge status-' + s.state;
        el.textContent = '';
        const dot = document.createElement('span');
        dot.className = 'status-dot';
        dot.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.className = 'status-text';
        text.textContent = s.label;
        const detail = document.createElement('span');
        detail.className = 'status-detail';
        detail.textContent = s.detail;
        el.append(dot, text, detail);
    }

    /* Fills every [data-hub-status="id"] badge and [data-hub-hours="id"] text on the page. */
    function updateAll(hubs) {
        hubs.forEach(function (hub) {
            document.querySelectorAll('[data-hub-status="' + hub.id + '"]').forEach(function (el) { renderStatus(el, hub); });
            document.querySelectorAll('[data-hub-hours="' + hub.id + '"]').forEach(function (el) {
                el.textContent = formatHoursSummary(hub);
            });
        });
    }

    function refresh() { if (typeof HUBS !== 'undefined') updateAll(HUBS); }

    root.HoursStatus = {
        getCampusNow: getCampusNow, getHubStatus: getHubStatus,
        formatHoursSummary: formatHoursSummary, formatTime: formatTime,
        updateAll: updateAll, refresh: refresh
    };
    setInterval(refresh, REFRESH_MS);   
})(window);


/* ================= PART 2: Hub directory ================= */
(function () {
    const list = document.getElementById('directory-list');
    if (!list) return;                              // this page has no directory
    const search = document.getElementById('directory-search');
    const count = document.getElementById('directory-count');
    const chips = document.querySelectorAll('.directory__filters .chip');
    let filter = 'all';

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function matchesSearch(hub, q) {
        if (!q) return true;
        return (hub.name + ' ' + hub.shortName + ' ' + hub.location).toLowerCase().indexOf(q) !== -1;
    }

    function passesFilter(hub) {
        if (filter === '247') return !!hub.hours.allDay;
        if (filter === 'open') return HoursStatus.getHubStatus(hub).state !== 'closed';
        return true;
    }

    function render() {
        const q = search.value.trim().toLowerCase();
        const shown = HUBS.filter(function (h) { return passesFilter(h) && matchesSearch(h, q); });

        list.textContent = '';
        shown.forEach(function (hub) {
            const li = el('li', 'directory-item');
            const hours = el('p', 'directory-item__hours');
            const hoursText = el('span');
            hoursText.setAttribute('data-hub-hours', hub.id);
            hours.appendChild(hoursText);

            const status = el('span');
            status.setAttribute('data-hub-status', hub.id);

            const btn = el('button', 'directory-item__btn', 'Show on map');
            btn.type = 'button';
            btn.addEventListener('click', function () {
                if (window.showTrailTo) window.showTrailTo(hub.id);
            });

            const row = el('div', 'directory-item__row');
            row.append(status, btn);
            li.append(el('h3', '', hub.name), el('p', 'directory-item__place', hub.location), hours, row);
            list.appendChild(li);
        });

        if (!shown.length) list.appendChild(el('li', 'directory__empty', 'No hubs match. Try a different search or filter.'));

        const message = shown.length + ' of ' + HUBS.length + ' hubs shown';
        if (count.textContent !== message) count.textContent = message;   
        HoursStatus.refresh();
    }

    search.addEventListener('input', render);
    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            filter = chip.dataset.filter;
            chips.forEach(function (c) {
                const on = c === chip;
                c.classList.toggle('is-active', on);
                c.setAttribute('aria-pressed', String(on));
            });
            render();
        });
    });

    render();
    setInterval(function () { if (filter === 'open') render(); }, 60 * 1000);   
})();