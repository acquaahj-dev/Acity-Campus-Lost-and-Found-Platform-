// DAMIEN - hub cards, built from HUBS so hours and details are never typed twice.
// Needs: group5.js (HUBS, g5Url) and princess-item-directory.js (HoursStatus fills the badge + hours text).
(function () {
    const list = document.getElementById('hub-cards');
    if (!list) return;
    list.classList.add('hub-list');

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function detailRow(label, valueNode) {
        const p = el('p', 'card-detail');
        p.append(el('strong', '', label + ' '), valueNode);
        return p;
    }
    HUBS.forEach(function (hub) {
        const card = el('article', 'hub-card');
        card.dataset.hubId = hub.id;

        // photo + live status badge
        const imgWrap = el('div', 'card-image-wrapper');
        const img = el('img', 'card-image');
        img.src = g5Url(hub.image);
        img.alt = hub.name + " location at Academic City";
        img.loading = 'lazy';
        img.addEventListener('error', function () {
            if (!img.dataset.campusPhotoFallback) {
                img.dataset.campusPhotoFallback = 'true';
                img.src = 'https://acity.edu.gh/wp-content/uploads/2026/08/IMG_1261-scaled-960x480.jpg';
                img.alt = 'Academic City campus';
                return;
            }
            imgWrap.classList.add('is-missing');
        });
        const statusWrap = el('div', 'card-status');
        const status = el('span');
        status.setAttribute('data-hub-status', hub.id);   // Princess's engine fills this in
        statusWrap.appendChild(status);
        imgWrap.append(img, statusWrap);

        // text + route button
        const hours = el('span');
        hours.setAttribute('data-hub-hours', hub.id);      // Princess's engine fills this in
        const btn = el('button', 'btn-navigate', 'View Route on Map');
        btn.type = 'button';
        btn.addEventListener('click', function () {
            if (window.showGoogleRouteTo) window.showGoogleRouteTo(hub.id);
            else if (window.showTrailTo) window.showTrailTo(hub.id);
            // on phones the sidebar covers the map, so close it to reveal the trail
            if (window.matchMedia('(max-width: 700px)').matches && window.closePanels) window.closePanels();
        });

        const body = el('div', 'card-body');
        body.append(
            el('h3', 'card-title', hub.name),
            detailRow('Hours:', hours),
            detailRow('Location:', document.createTextNode(hub.location)),
            el('p', 'card-description', hub.details),
            btn
        );

        card.append(imgWrap, body);
        list.appendChild(card);
    });

    if (window.HoursStatus) HoursStatus.refresh();
})();