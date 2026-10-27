/* 
   Group 6 – User Activity Dashboard
   Role 2: My Reported Items
   File:   reported-items.js

   Reads  : window.dashboardHelpers.getMyItems()   (mock-data.js, Role 5)
   Writes : one card per item into
              #reported-items-list  (items that are Open or Claimed)
              #resolved-items-list  (items that are Resolved)
   Leaves : the status badges and the "Mark as Resolved" button to
            status-controls.js (Role 4). This script does NOT create them,
            otherwise every card would show duplicates.

   Card contract shared with Role 4 (do not change these attributes):
     <article class="item-card" data-item-id data-status data-type>
    */

(function () {
    "use strict";

    const ACTIVE_LIST_ID = "reported-items-list";
    const RESOLVED_LIST_ID = "resolved-items-list";

    /* Picture shown when an item has no image or the image file is missing. */
    const FALLBACK_IMAGE =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
            '<rect width="640" height="480" fill="#F3EEE6"/>' +
            '<text x="320" y="250" font-family="sans-serif" font-size="26" fill="#8A857C" text-anchor="middle">No image added</text>' +
            "</svg>"
        );

    /* Small DOM helper */

    /** Create an element with an optional class name and text. */
    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text; // textContent is XSS-safe
        return element;
    }

    /** "Label: value" line used for location and date. */
    function createMetaLine(label, value) {
        const line = createElement("p", "item-card__meta");
        line.append(createElement("span", "item-card__label", label + " "), document.createTextNode(value));
        return line;
    }

    /* Building one card */

    function buildCard(item, helpers) {
        const card = createElement("article", "item-card");
        card.dataset.itemId = item.id;
        card.dataset.status = item.status;
        card.dataset.type = item.type;

        // Image (falls back to a plain placeholder if the file fails to load)
        const image = createElement("img", "item-card__image");
        image.alt = item.title;
        image.loading = "lazy";
        image.src = item.image || FALLBACK_IMAGE;
        image.addEventListener("error", () => { image.src = FALLBACK_IMAGE; }, { once: true });

        // Text content
        const body = createElement("div", "item-card__body");
        const title = createElement("h3", "item-card__title", item.title);

        // Link to Group 3's item detail page (path is configured in mock-data.js)
        const link = createElement("a", "item-card__link", "View details");
        link.href = helpers.itemDetailsUrl(item.id);
        link.setAttribute("aria-label", "View details for " + item.title);

        body.append(
            title,
            createMetaLine("Location:", item.location),
            createMetaLine("Reported:", helpers.formatDate(item.date)),
            link
        );

        card.append(image, body);
        return card;
    }

    /* Drawing every card */

    function render() {
        const helpers = window.dashboardHelpers;
        const activeList = document.getElementById(ACTIVE_LIST_ID);
        const resolvedList = document.getElementById(RESOLVED_LIST_ID);

        if (!helpers || !activeList || !resolvedList) {
            console.warn("reported-items.js: mock-data.js or a list container is missing.");
            return;
        }

        // Clear first so calling render() again never creates duplicates.
        activeList.replaceChildren();
        resolvedList.replaceChildren();

        helpers.getMyItems().forEach((item) => {
            const targetList = item.status === "Resolved" ? resolvedList : activeList;
            targetList.append(buildCard(item, helpers));
        });

        // If Role 4's script is already running, let it add badges and buttons.
        if (window.StatusControls) window.StatusControls.refresh();
    }

    window.ReportedItems = { render };

    // Run once the page is ready.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", render);
    } else {
        render();
    }
})();
