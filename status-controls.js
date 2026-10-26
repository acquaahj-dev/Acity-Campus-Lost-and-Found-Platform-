/* 
   Group 6 – User Activity Dashboard
   Role 4: Status Controls & Resolve Logic
   File:   status-controls.js          (ALWAYS load LAST in dashboard.html)

   What this file does
     1. Adds status badges (Open / Claimed / Resolved) and type badges
        (Lost / Found) to every item card
     2. Adds a "Mark as Resolved / Returned" toggle button to every card
     3. Asks for confirmation in a dialog before changing anything
     4. Moves the card between "Reported Items" and "Resolved"
     5. Updates the summary numbers and the "empty" messages
     6. Saves the change through DashboardStore (dashboard-store.js)

   HOW OTHER ROLES CONNECT TO THIS FILE
     Cards (Role 2):    <article class="item-card" data-item-id data-status data-type>
     Lists (Role 1):    #reported-items-list   and   #resolved-items-list
     Counts (Role 1):   [data-count="open | claimed | resolved | active | total"]
     Empty text:        <p class="empty-state" data-empty-for="LIST_ID" hidden>
     Public API:        StatusControls.refresh()           re-scan cards after re-rendering
                        StatusControls.setStatus(id, s)    change a status from code (Role 3)
                        StatusControls.createStatusBadge() / createTypeBadge()
     Event:             "item-status-changed"  ->  event.detail = { id, from, to }
    */

(function () {
    "use strict";

    /*  Settings  */

    const ACTIVE_LIST_ID = "reported-items-list";
    const RESOLVED_LIST_ID = "resolved-items-list";

    const STATUS = Object.freeze({ OPEN: "Open", CLAIMED: "Claimed", RESOLVED: "Resolved" });

    const store = window.DashboardStore || null; // optional: the page still works without it

    /*  Module state  */

    const memoryPrevious = {}; // fallback "status before resolving" if the store is missing
    let dialogEl = null;       // the confirm dialog (built the first time it is needed)
    let toastEl = null;        // the small message at the bottom of the screen
    let toastTimer = null;
    let pendingAction = null;  // { card, trigger } while the dialog is open

    /*  Small helpers  */

    /** Turn any text into one of the three valid statuses. */
    function normaliseStatus(value) {
        const text = String(value || "").toLowerCase();
        if (text === "resolved" || text === "returned") return STATUS.RESOLVED;
        if (text === "claimed") return STATUS.CLAIMED;
        return STATUS.OPEN;
    }

    function normaliseType(value) {
        return String(value || "").toLowerCase() === "found" ? "found" : "lost";
    }

    /** Lost items are "Resolved"; found items are "Returned" to their owner. */
    function resolveWord(type) {
        return type === "found" ? "Returned" : "Resolved";
    }

    function getCards() {
        return document.querySelectorAll(".item-card[data-item-id]");
    }

    function getCardTitle(card) {
        const heading = card.querySelector(".item-card__title, h2, h3, h4");
        return heading && heading.textContent.trim() ? heading.textContent.trim() : "this item";
    }

    /** Keep the shared mock data in step with the screen. */
    function updateMockItem(id, status) {
        const items = window.dashboardData && window.dashboardData.items;
        if (!Array.isArray(items)) return;
        const item = items.find((entry) => String(entry.id) === String(id));
        if (item) item.status = status;
    }

    /** Status an item had before it was resolved (used by "Reopen item"). */
    function getPreviousStatus(id) {
        const saved = store ? store.getPreviousStatus(id) : null;
        const previous = saved || memoryPrevious[id] || STATUS.OPEN;
        return previous === STATUS.RESOLVED ? STATUS.OPEN : previous;
    }

    /*  Badges (reusable by other roles)  */

    function createStatusBadge(status) {
        const clean = normaliseStatus(status);
        const badge = document.createElement("span");
        badge.className = "badge badge--status badge--" + clean.toLowerCase();
        badge.dataset.statusBadge = "";
        badge.textContent = clean;
        return badge;
    }

    function createTypeBadge(type) {
        const clean = normaliseType(type);
        const badge = document.createElement("span");
        badge.className = "badge badge--type badge--" + clean;
        badge.dataset.typeBadge = "";
        badge.textContent = clean === "found" ? "Found" : "Lost";
        return badge;
    }

    /*  Card setup: badges and button  */

    /** (Re)build the badge row at the top of a card. */
    function ensureBadges(card) {
        let wrapper = card.querySelector(".item-card__badges");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.className = "item-card__badges";
            card.prepend(wrapper);
        }
        wrapper.replaceChildren(createTypeBadge(card.dataset.type), createStatusBadge(card.dataset.status));
    }

    /** Make sure the card has an actions row with exactly one toggle button. */
    function ensureToggleButton(card) {
        let actions = card.querySelector(".item-card__actions");
        if (!actions) {
            actions = document.createElement("div");
            actions.className = "item-card__actions";
            card.append(actions);
        }

        let button = actions.querySelector(".btn-status-toggle");
        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.className = "btn-status-toggle";
            actions.append(button);
        }
        updateToggleButton(card, button);
    }

    /** Set the button's wording to match the card's current status. */
    function updateToggleButton(card, button) {
        const status = normaliseStatus(card.dataset.status);
        const type = normaliseType(card.dataset.type);
        const title = getCardTitle(card);
        const isResolved = status === STATUS.RESOLVED;

        button.textContent = isResolved ? "Reopen item" : "Mark as " + resolveWord(type);
        button.classList.toggle("btn-status-toggle--reopen", isResolved);
        button.setAttribute(
            "aria-label",
            isResolved ? "Reopen " + title : "Mark " + title + " as " + resolveWord(type)
        );
        button.setAttribute("aria-pressed", String(isResolved));
    }

    /*  Moving cards, counts and empty states  */

    function moveCard(card, status) {
        const targetId = status === STATUS.RESOLVED ? RESOLVED_LIST_ID : ACTIVE_LIST_ID;
        const target = document.getElementById(targetId);
        if (target && card.parentElement !== target) target.append(card);
    }

    function updateCounts() {
        const totals = { open: 0, claimed: 0, resolved: 0 };
        getCards().forEach((card) => {
            totals[normaliseStatus(card.dataset.status).toLowerCase()] += 1;
        });

        const values = {
            open: totals.open,
            claimed: totals.claimed,
            resolved: totals.resolved,
            active: totals.open + totals.claimed, // everything not yet resolved
            total: totals.open + totals.claimed + totals.resolved
        };

        document.querySelectorAll("[data-count]").forEach((element) => {
            const key = element.dataset.count;
            if (key in values) element.textContent = values[key];
        });
    }

    function updateEmptyStates() {
        document.querySelectorAll("[data-empty-for]").forEach((message) => {
            const list = document.getElementById(message.dataset.emptyFor);
            if (list) message.hidden = list.querySelector(".item-card") !== null;
        });
    }

    /*  The core status change  */

    /**
     * Change one card's status everywhere: screen, shared data, saved state.
     * @param {HTMLElement} card
     * @param {string} newStatus
     */
    function applyStatus(card, newStatus) {
        const id = card.dataset.itemId;
        const oldStatus = normaliseStatus(card.dataset.status);
        const status = normaliseStatus(newStatus);

        // Remember what the item was, so "Reopen" can restore it.
        let previous = null;
        if (status === STATUS.RESOLVED) {
            previous = oldStatus !== STATUS.RESOLVED ? oldStatus : getPreviousStatus(id);
            memoryPrevious[id] = previous;
        }

        card.dataset.status = status;
        ensureBadges(card);
        updateToggleButton(card, card.querySelector(".btn-status-toggle"));
        moveCard(card, status);

        updateMockItem(id, status);
        if (store) store.saveItemStatus(id, status, previous);

        updateCounts();
        updateEmptyStates();

        const type = normaliseType(card.dataset.type);
        announce(
            status === STATUS.RESOLVED
                ? getCardTitle(card) + " marked as " + resolveWord(type).toLowerCase() + "."
                : getCardTitle(card) + " is now " + status.toLowerCase() + "."
        );

        // Tell other scripts (Role 3 hides claims for resolved items).
        document.dispatchEvent(new CustomEvent("item-status-changed", {
            detail: { id, from: oldStatus, to: status }
        }));
    }

    /** Button action: Open/Claimed -> Resolved, or Resolved -> what it was before. */
    function toggleStatus(card) {
        const isResolved = normaliseStatus(card.dataset.status) === STATUS.RESOLVED;
        applyStatus(card, isResolved ? getPreviousStatus(card.dataset.itemId) : STATUS.RESOLVED);
    }

    /*  Confirm dialog  */

    function buildDialog() {
        if (dialogEl) return;

        dialogEl = document.createElement("dialog");
        dialogEl.className = "confirm-dialog";
        dialogEl.setAttribute("aria-labelledby", "confirm-dialog-title");
        dialogEl.innerHTML =
            '<div class="confirm-dialog__body">' +
            '  <h2 id="confirm-dialog-title" class="confirm-dialog__title"></h2>' +
            '  <p class="confirm-dialog__text"></p>' +
            '  <div class="confirm-dialog__buttons">' +
            '    <button type="button" class="confirm-dialog__cancel">Cancel</button>' +
            '    <button type="button" class="confirm-dialog__confirm"></button>' +
            "  </div>" +
            "</div>";
        document.body.append(dialogEl);

        dialogEl.querySelector(".confirm-dialog__cancel").addEventListener("click", () => closeDialog(false));
        dialogEl.querySelector(".confirm-dialog__confirm").addEventListener("click", () => closeDialog(true));

        // Fires after Cancel, Confirm and the Esc key: put focus somewhere sensible.
        dialogEl.addEventListener("close", () => {
            restoreFocus(pendingAction && pendingAction.trigger);
            pendingAction = null;
        });
    }

    function openDialog(card, trigger) {
        const status = normaliseStatus(card.dataset.status);
        const type = normaliseType(card.dataset.type);
        const title = getCardTitle(card);
        const word = resolveWord(type).toLowerCase();
        const isReopen = status === STATUS.RESOLVED;

        pendingAction = { card, trigger };

        // Very old browsers have no <dialog>: fall back to a plain confirm box.
        if (typeof HTMLDialogElement !== "function") {
            const question = isReopen ? 'Reopen "' + title + '"?' : 'Mark "' + title + '" as ' + word + "?";
            if (window.confirm(question)) toggleStatus(card);
            pendingAction = null;
            return;
        }

        buildDialog();
        dialogEl.querySelector(".confirm-dialog__title").textContent = isReopen
            ? "Reopen this item?"
            : "Mark as " + word + "?";
        dialogEl.querySelector(".confirm-dialog__text").textContent = isReopen
            ? '"' + title + '" will move back to your active reported items.'
            : '"' + title + '" will move to your resolved items. You can reopen it at any time.';
        dialogEl.querySelector(".confirm-dialog__confirm").textContent = isReopen
            ? "Reopen item"
            : "Yes, mark as " + word;

        dialogEl.showModal();
        dialogEl.querySelector(".confirm-dialog__cancel").focus();
    }

    function closeDialog(confirmed) {
        const action = pendingAction;
        dialogEl.close();
        if (confirmed && action) toggleStatus(action.card);
    }

    /**
     * After the dialog closes, return focus to the button that opened it.
     * If that button is now inside a hidden tab (the card moved), focus the
     * heading of the tab the user is looking at instead of losing focus.
     */
    function restoreFocus(trigger) {
        if (trigger && trigger.isConnected && trigger.offsetParent !== null) {
            trigger.focus();
            return;
        }
        const heading = document.querySelector("[data-tab-panel]:not([hidden]) h2");
        if (heading) {
            heading.tabIndex = -1;
            heading.focus();
        }
    }

    /*  Message at the bottom of the screen  */

    function announce(message) {
        if (!toastEl) {
            toastEl = document.createElement("div");
            toastEl.className = "status-toast";
            toastEl.setAttribute("role", "status"); // read aloud by screen readers
            toastEl.setAttribute("aria-live", "polite");
            document.body.append(toastEl);
        }
        toastEl.textContent = message;
        toastEl.classList.add("status-toast--visible");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove("status-toast--visible"), 3500);
    }

    /*  Start up and public API  */

    /** Scan every card: add badges and buttons, put it in the right list. */
    function refresh() {
        getCards().forEach((card) => {
            ensureBadges(card);
            ensureToggleButton(card);
            moveCard(card, normaliseStatus(card.dataset.status));
        });
        updateCounts();
        updateEmptyStates();
    }

    function init() {
        refresh();

        // One listener handles every button, so cards added later still work.
        document.addEventListener("click", (event) => {
            const button = event.target.closest(".btn-status-toggle");
            const card = button && button.closest(".item-card[data-item-id]");
            if (card) openDialog(card, button);
        });
    }

    window.StatusControls = {
        init,
        refresh,
        createStatusBadge,
        createTypeBadge,
        /** Change an item's status from code, e.g. Role 3 after approving a claim. */
        setStatus(itemId, status) {
            const card = document.querySelector('.item-card[data-item-id="' + itemId + '"]');
            if (card && normaliseStatus(card.dataset.status) !== normaliseStatus(status)) {
                applyStatus(card, status);
            }
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
