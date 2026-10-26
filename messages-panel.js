/* .
   Group 6 – User Activity Dashboard
   Role 5: Messages Panel
   File:   messages-panel.js

   Reads  : window.dashboardData.messages            (mock-data.js)
   Writes : #messages-panel                          (dashboard.html, Role 1)
   Saves  : DashboardStore.saveMessageUnread()       (dashboard-store.js)

   This is only a SUMMARY of recent conversations. The real chat screen is
   Group 4's page, so every conversation links there.

   HOOK (Group 4): the link paths come from dashboardData.links.messages in
   mock-data.js. Each conversation opens  messages.html?item=ITEM_ID.
   . */

(function () {
    "use strict";

    const container = document.getElementById("messages-panel");
    if (!container) return;

    const data = window.dashboardData;
    const helpers = window.dashboardHelpers;
    const store = window.DashboardStore || null;

    if (!data || !helpers) {
        console.warn("messages-panel.js: mock-data.js must load before this script.");
        return;
    }

    /*  Small DOM helper  */

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    /*  Page pieces that are created once  */

    const liveRegion = createElement("p", "messages-sr-only");
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");

    const contentEl = createElement("div", "messages-content"); // rebuilt on every render()
    container.append(liveRegion, contentEl);

    /*  Building the pieces  */

    /** Top bar: unread count, "Mark all as read" and the link to Group 4. */
    function buildToolbar(unreadCount) {
        const toolbar = createElement("div", "messages-toolbar");

        const summary = createElement(
            "p",
            "messages-toolbar__summary",
            unreadCount === 0 ? "You are all caught up." : unreadCount + " unread " + (unreadCount === 1 ? "conversation" : "conversations")
        );

        const actions = createElement("div", "messages-toolbar__actions");

        if (unreadCount > 0) {
            const markAll = createElement("button", "messages-btn messages-btn--ghost", "Mark all as read");
            markAll.type = "button";
            markAll.addEventListener("click", markAllAsRead);
            actions.append(markAll);
        }

        // HOOK: Group 4's secure messaging page
        const openAll = createElement("a", "messages-btn messages-btn--primary", "Open secure messaging");
        openAll.href = helpers.messagesUrl();
        actions.append(openAll);

        toolbar.append(summary, actions);
        return toolbar;
    }

    /** Reminder that supports the project's privacy rules. */
    function buildNotice() {
        return createElement(
            "p",
            "messages-notice",
            "Messages are anonymous. Never share your phone number, email or home address. Arrange hand-offs at a campus collection point."
        );
    }

    /** One conversation row. */
    function buildRow(message) {
        const item = helpers.getItem(message.itemId);
        const sender = helpers.getDisplayName(message.from);
        const itemTitle = item ? item.title : "Unknown item";

        const row = createElement("li", "messages-item");
        row.dataset.messageId = message.id;
        row.dataset.unread = String(message.unread);

        // Clickable area: opens Group 4's page for this item.
        const link = createElement("a", "messages-item__link");
        link.href = helpers.messagesUrl(message.itemId); // HOOK: Group 4
        link.setAttribute("aria-label", "Open conversation with " + sender + " about " + itemTitle);

        const avatar = createElement("span", "messages-item__avatar", sender.replace("Anonymous Student ", "").charAt(0));
        avatar.setAttribute("aria-hidden", "true");

        const text = createElement("span", "messages-item__text");
        text.append(
            createElement("span", "messages-item__name", sender),
            createElement("span", "messages-item__item", "About: " + itemTitle),
            createElement("span", "messages-item__preview", message.preview)
        );

        // Right-hand column: date and the unread dot
        const side = createElement("span", "messages-item__side");
        const dot = createElement("span", "messages-item__dot");
        dot.setAttribute("aria-hidden", "true");
        side.append(createElement("span", "messages-item__date", helpers.formatDate(message.date)), dot);

        // Screen-reader-only read state (the dot is purely visual)
        const readState = createElement("span", "messages-sr-only", message.unread ? "Unread. " : "Read. ");

        link.append(avatar, text, side, readState);

        // Separate button so toggling read state never navigates away.
        const toggle = createElement("button", "messages-item__toggle", message.unread ? "Mark as read" : "Mark as unread");
        toggle.type = "button";
        toggle.setAttribute("aria-label", (message.unread ? "Mark as read: " : "Mark as unread: ") + itemTitle);
        toggle.addEventListener("click", () => setUnread(message, !message.unread));

        row.append(link, toggle);
        return row;
    }

    /*  Drawing everything  */

    function render() {
        const unread = helpers.getUnreadCount();
        const messages = data.messages.slice().sort((a, b) => b.date.localeCompare(a.date));

        const content = [buildToolbar(unread), buildNotice()];

        if (messages.length === 0) {
            content.push(createElement("p", "empty-state", "No conversations yet. Messages about your items will appear here."));
        } else {
            const list = createElement("ul", "messages-list");
            messages.forEach((message) => list.append(buildRow(message)));
            content.push(list);
        }

        contentEl.replaceChildren(...content);

        // Number shown on the Messages tab.
        document.querySelectorAll('[data-tab-count="messages"]').forEach((badge) => {
            badge.textContent = unread;
        });
    }

    /*  Managing messages  */

    function setUnread(message, unread) {
        message.unread = unread;
        if (store) store.saveMessageUnread(message.id, unread);
        render();
        liveRegion.textContent = unread ? "Conversation marked as unread." : "Conversation marked as read.";
    }

    function markAllAsRead() {
        data.messages.forEach((message) => {
            message.unread = false;
            if (store) store.saveMessageUnread(message.id, false);
        });
        render();
        liveRegion.textContent = "All conversations marked as read.";
    }

    render();
})();
