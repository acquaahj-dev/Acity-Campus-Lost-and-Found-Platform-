/* 
   Group 6 – User Activity Dashboard
   Role 3: Pending Claims
   File:   pending-claims.js

   Reads  : window.dashboardData.claims / items      (mock-data.js, Role 5)
   Writes : #claims-list                             (dashboard.html, Role 1)
   Calls  : StatusControls.setStatus(itemId, "Claimed")      (Role 4)
   Listens: "item-status-changed" event                      (Role 4)
   Saves  : DashboardStore.saveClaimStatus()                 (dashboard-store.js)

   The Claims tab shows two groups:
     1. "Claims on my items"  other students claim something I reported.
                             I can Approve or Reject pending ones.
     2. "Claims I've made"   I claim something someone else reported.
                                I can only wait for their decision.

   Claim statuses: "Pending", "Approved", "Rejected".
   Claim rows never use the .item-card class, so Role 4's script ignores them.
    */

(function () {
    "use strict";

    const container = document.getElementById("claims-list");
    if (!container) return; // Role 1's container is missing: nothing to draw into.

    const data = window.dashboardData;
    const helpers = window.dashboardHelpers;
    const store = window.DashboardStore || null;

    if (!data || !helpers) {
        console.warn("pending-claims.js: mock-data.js must load before this script.");
        return;
    }

    const CLAIM = Object.freeze({ PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" });
    const SORT_ORDER = { Pending: 0, Approved: 1, Rejected: 2 };

    /* Small DOM helper */

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    /* Page pieces that are created once */

    const summaryEl = createElement("p", "claim-summary");
    const liveRegion = createElement("p", "claim-sr-only"); // read aloud by screen readers
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    const groupsEl = createElement("div", "claim-groups"); // rebuilt on every render()

    container.append(summaryEl, liveRegion, groupsEl);

    /* Rules */

    /** A pending claim on an item that is already Resolved is no longer relevant. */
    function isRelevant(claim) {
        const item = helpers.getItem(claim.itemId);
        return !(claim.status === CLAIM.PENDING && item && item.status === "Resolved");
    }

    /** True once any claim on this item has been approved (the item has its owner). */
    function hasApprovedClaim(itemId) {
        return data.claims.some((claim) => claim.itemId === itemId && claim.status === CLAIM.APPROVED);
    }

    /** Pending first, then newest first. */
    function sortClaims(claims) {
        return claims.slice().sort((a, b) =>
            SORT_ORDER[a.status] - SORT_ORDER[b.status] || b.date.localeCompare(a.date)
        );
    }

    /* Building one claim row */

    /**
     * @param {Object} claim
     * @param {"owner"|"claimant"} role  "owner" = claim on my item,
     *                                   "claimant" = a claim I made
     */
    function buildRow(claim, role) {
        const item = helpers.getItem(claim.itemId);
        const title = item ? item.title : "Unknown item";

        const row = createElement("article", "claim-row");
        row.dataset.claimId = claim.id;
        row.dataset.itemId = claim.itemId;
        row.dataset.status = claim.status;
        row.tabIndex = -1; // lets us move focus here after a decision

        // Header: item title (links to Group 3) + status badge
        const header = createElement("div", "claim-row__header");
        const heading = createElement("h4", "claim-row__title");
        const link = createElement("a", "claim-row__link", title);
        link.href = helpers.itemDetailsUrl(claim.itemId);
        heading.append(link);
        header.append(heading, createElement("span", "claim-badge claim-badge--" + claim.status.toLowerCase(), claim.status));

        // Details: aliases only, never real names or contact details
        const whoLabel = role === "owner" ? "Claimant:" : "Reported by:";
        const whoValue = role === "owner"
            ? helpers.getDisplayName(claim.claimant)
            : helpers.getDisplayName(item ? item.reportedBy : "");

        const meta = createElement("div", "claim-row__meta");
        meta.append(
            createMetaLine(whoLabel, whoValue),
            createMetaLine("Claimed on:", helpers.formatDate(claim.date))
        );

        const note = createElement("p", "claim-row__note");
        note.append(createElement("span", "claim-row__label", "Ownership details: "), document.createTextNode(claim.details || "No details given."));

        row.append(header, meta, note, buildActions(claim, role, title));
        return row;
    }

    function createMetaLine(label, value) {
        const line = createElement("p", "claim-row__line");
        line.append(createElement("span", "claim-row__label", label + " "), document.createTextNode(value));
        return line;
    }

    /** Buttons for a pending claim I can decide, otherwise a short message. */
    function buildActions(claim, role, title) {
        const box = createElement("div", "claim-row__actions");

        // 1. Pending claim on MY item: I decide.
        if (role === "owner" && claim.status === CLAIM.PENDING && !hasApprovedClaim(claim.itemId)) {
            const who = helpers.getDisplayName(claim.claimant);
            box.append(
                buildButton("Approve", "claim-btn claim-btn--approve", "Approve claim by " + who + " for " + title, () => decide(claim, CLAIM.APPROVED)),
                buildButton("Reject", "claim-btn claim-btn--reject", "Reject claim by " + who + " for " + title, () => decide(claim, CLAIM.REJECTED))
            );
            return box;
        }

        // 2. Everything else: a short outcome message.
        const messages = {
            owner: {
                Approved: "Approved. This item is now marked as Claimed.",
                Rejected: "Rejected. The item stays as it was."
            },
            claimant: {
                Pending: "Waiting for the owner to review your claim.",
                Approved: "Approved by the owner. Arrange the hand-off in Messages.",
                Rejected: "The owner could not verify this claim."
            }
        };
        const blocked = role === "owner" && claim.status === CLAIM.PENDING;
        box.append(createElement("p", "claim-row__outcome",
            blocked ? "Another claim on this item was already approved." : messages[role][claim.status]));

        // Approved claims lead to a hand-off, so link to Group 4's messaging page.
        if (claim.status === CLAIM.APPROVED) {
            const messageLink = createElement("a", "claim-btn claim-btn--link", "Open messages");
            messageLink.href = helpers.messagesUrl(claim.itemId); // HOOK: Group 4
            box.append(messageLink);
        }
        return box;
    }

    function buildButton(label, className, ariaLabel, onClick) {
        const button = createElement("button", className, label);
        button.type = "button";
        button.setAttribute("aria-label", ariaLabel);
        button.addEventListener("click", onClick);
        return button;
    }

    /* Building a group of rows */

    function buildGroup(title, intro, claims, role, emptyText) {
        const group = createElement("section", "claim-group");
        group.append(createElement("h3", "claim-group__title", title), createElement("p", "claim-group__intro", intro));

        if (claims.length === 0) {
            group.append(createElement("p", "claim-empty", emptyText));
            return group;
        }

        const list = createElement("div", "claim-list");
        sortClaims(claims).forEach((claim) => list.append(buildRow(claim, role)));
        group.append(list);
        return group;
    }

    /* Drawing everything */

    function render() {
        const onMyItems = helpers.getClaimsOnMyItems().filter(isRelevant);
        const madeByMe = helpers.getClaimsMadeByMe();

        groupsEl.replaceChildren(
            buildGroup(
                "Claims on my items",
                "Other students who say an item you reported belongs to them.",
                onMyItems,
                "owner",
                "No one has claimed your items yet."
            ),
            buildGroup(
                "Claims I've made",
                "Items reported by other students that you have claimed.",
                madeByMe,
                "claimant",
                "You have not claimed any items yet."
            )
        );

        // Summary line and the number shown on the tab.
        const waiting = onMyItems.filter((claim) => claim.status === CLAIM.PENDING).length;
        summaryEl.textContent = waiting === 1
            ? "1 claim is waiting for your decision."
            : waiting + " claims are waiting for your decision.";

        document.querySelectorAll('[data-tab-count="claims"]').forEach((badge) => {
            badge.textContent = waiting;
        });
    }

    /* Approve / Reject */

    function decide(claim, newStatus) {
        // Safety net: never approve a second claim for the same item.
        if (newStatus === CLAIM.APPROVED && hasApprovedClaim(claim.itemId)) return;

        claim.status = newStatus;
        if (store) store.saveClaimStatus(claim.id, newStatus);

        // Approving a claim makes the item "Claimed" (Role 4's function).
        // Rejecting a claim leaves the item exactly as it was.
        if (newStatus === CLAIM.APPROVED) {
            // Only one person can get the item, so reject every other pending claim on it.
            data.claims.forEach((other) => {
                if (other.itemId === claim.itemId && other.id !== claim.id && other.status === CLAIM.PENDING) {
                    other.status = CLAIM.REJECTED;
                    if (store) store.saveClaimStatus(other.id, CLAIM.REJECTED);
                }
            });
            if (window.StatusControls) {
                window.StatusControls.setStatus(claim.itemId, "Claimed");
            } else {
                console.warn("pending-claims.js: StatusControls is not loaded, item status was not changed.");
            }
        }

        render();

        const item = helpers.getItem(claim.itemId);
        liveRegion.textContent =
            "Claim by " + helpers.getDisplayName(claim.claimant) + " for " + (item ? item.title : "the item") +
            " was " + newStatus.toLowerCase() + ".";

        // The clicked button was removed by render(), so move focus to its row.
        const row = groupsEl.querySelector('[data-claim-id="' + claim.id + '"]');
        if (row) row.focus();
    }

    /* Start up */

    // Resolving or reopening an item elsewhere can hide / show its pending claims.
    document.addEventListener("item-status-changed", render);

    render();
})();
