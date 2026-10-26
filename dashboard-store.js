/* ==========================================================================
   Group 6 – User Activity Dashboard
   Shared: Dashboard Store
   File:   dashboard-store.js     (load SECOND, right after mock-data.js)

   WHY THIS FILE EXISTS
   Before, each role saved its own data in localStorage in its own way, and
   item statuses were "forgotten" by the mock data after a refresh. This file
   is now the single place that saves and restores the changes a user makes:

       - item statuses       (Role 4: Mark as Resolved / Returned, Reopen)
       - claim decisions     (Role 3: Approve / Reject)
       - read / unread flags (Role 5: messages panel)

   As soon as this file loads it copies the saved changes back into
   window.dashboardData, so every script that renders afterwards sees the
   correct, up-to-date values. No backend: everything lives in localStorage.
   ========================================================================== */

(function () {
    "use strict";

    const STORAGE_KEY = "lf.group6.dashboardState";

    // Allowed values, so a corrupted save can never put bad text into the data.
    const ITEM_STATUSES = ["Open", "Claimed", "Resolved"];
    const CLAIM_STATUSES = ["Pending", "Approved", "Rejected"];

    /* ---------- Reading and writing localStorage safely ---------- */

    const createEmptyState = () => ({ items: {}, claims: {}, messages: {} });

    function readState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && typeof saved === "object") {
                return Object.assign(createEmptyState(), saved);
            }
        } catch (error) {
            /* Storage blocked or data corrupted: start fresh. */
        }
        return createEmptyState();
    }

    function writeState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            /* Storage unavailable: the page still works for this visit. */
        }
    }

    let state = readState();

    /* ---------- Saving changes ---------- */

    /**
     * Remember an item's status.
     * `previous` is only used when resolving, so "Reopen" can put the item
     * back to what it was before (Open or Claimed).
     */
    function saveItemStatus(itemId, status, previous) {
        state.items[itemId] = { status, previous: previous || null };
        writeState(state);
    }

    function saveClaimStatus(claimId, status) {
        state.claims[claimId] = status;
        writeState(state);
    }

    function saveMessageUnread(messageId, unread) {
        state.messages[messageId] = Boolean(unread);
        writeState(state);
    }

    /** Status an item had before it was resolved (or null if unknown). */
    function getPreviousStatus(itemId) {
        const record = state.items[itemId];
        return record && record.previous ? record.previous : null;
    }

    /* ---------- Restoring saved changes into the mock data ---------- */

    function hydrate(data) {
        if (!data) return;

        (data.items || []).forEach((item) => {
            const record = state.items[item.id];
            if (record && ITEM_STATUSES.includes(record.status)) {
                item.status = record.status;
            }
        });

        (data.claims || []).forEach((claim) => {
            const saved = state.claims[claim.id];
            if (CLAIM_STATUSES.includes(saved)) {
                claim.status = saved;
            }
        });

        (data.messages || []).forEach((message) => {
            if (typeof state.messages[message.id] === "boolean") {
                message.unread = state.messages[message.id];
            }
        });
    }

    /** Forget every saved change (used by the "Reset demo data" button). */
    function reset() {
        state = createEmptyState();
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            /* Nothing to clear. */
        }
    }

    window.DashboardStore = {
        saveItemStatus,
        saveClaimStatus,
        saveMessageUnread,
        getPreviousStatus,
        hydrate,
        reset
    };

    // Apply saved changes immediately so scripts loaded later render correctly.
    hydrate(window.dashboardData);
})();
