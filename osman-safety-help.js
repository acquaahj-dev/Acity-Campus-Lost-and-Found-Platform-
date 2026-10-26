// OSMAN - safety guidelines: expand/collapse all + "Which hub should I use?" helper.
// Needs: group5.js (HUBS). Optional: princess-item-directory.js (HoursStatus) so the helper knows who is open now.
(function () {
    const root = document.getElementById('guidelines');
    if (!root) return;

    /* ---------- expand / collapse all ---------- */
    const toggle = document.getElementById('guidelines-toggle');
    const items = root.querySelectorAll('details.guideline');
    let allOpen = false;
    toggle.addEventListener('click', function () {
        allOpen = !allOpen;
        items.forEach(function (d) { d.open = allOpen; });
        toggle.textContent = allOpen ? 'Collapse all' : 'Expand all';
    });

    /* ---------- hub helper ---------- */
    const itemSelect = document.getElementById('helper-item');
    const darkSelect = document.getElementById('helper-dark');
    const goBtn = document.getElementById('helper-go');
    const out = document.getElementById('helper-result');

    function stateOf(hub) {
        return window.HoursStatus ? HoursStatus.getHubStatus(hub).state : 'open';
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function recommend() {
        const valuable = itemSelect.value === 'valuable';
        const dark = darkSelect.value === 'yes';
        let picks;
        let reason;

        if (valuable || dark) {
            picks = HUBS.filter(function (h) { return h.hours.allDay; });
            reason = dark
                ? 'After dark, only use a hub that is staffed 24 hours:'
                : 'Valuable items should go through a hub that is staffed 24 hours:';
        } else {
            picks = HUBS.filter(function (h) { return stateOf(h) !== 'closed'; });
            reason = 'These hubs are open right now:';
            if (!picks.length) {
                picks = HUBS.filter(function (h) { return h.hours.allDay; });
                reason = 'Everything else is closed, so use a 24-hour hub:';
            }
        }

        out.textContent = '';
        out.appendChild(el('p', 'helper__reason', reason));
        const list = el('ul', 'helper__list');
        picks.forEach(function (hub) {
            const li = el('li', 'helper__item');
            const btn = el('button', '', 'Show route');
            btn.type = 'button';
            btn.addEventListener('click', function () {
                if (window.showGoogleRouteTo) window.showGoogleRouteTo(hub.id);
                else if (window.showTrailTo) window.showTrailTo(hub.id);
            });
            li.append(el('span', '', hub.name), btn);
            list.appendChild(li);
        });
        out.appendChild(list);
    }

    goBtn.addEventListener('click', recommend);
})();