/* 
   Group 6 – User Activity Dashboard
   Role 1: Page Shell & Tabs
   File:   dashboard-tabs.js

   Controls the four dashboard tabs (Reported Items / Pending Claims /
   Resolved / Messages) and the small page-level buttons.

   Accessibility (WAI-ARIA tabs pattern):
     - Mouse click or keyboard Left / Right / Home / End arrows switch tabs
     - Only the selected tab is in the Tab key order (roving tabindex)
     - Panels are HIDDEN, never removed, so cards inside a closed tab still
      exist and Role 4's script can keep counting them.
    */

(function () {
    "use strict";

    const tabs = Array.from(document.querySelectorAll('.dash-tabs [role="tab"]'));
    const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));

    if (tabs.length === 0) return; // Not on the dashboard page.

    /*  Showing one tab  */

    /**
     * Select a tab and show its panel.
     * @param {HTMLElement} tab       the tab button to select
     * @param {Object}  [options]
     * @param {boolean} [options.focus=false]      move keyboard focus to the tab
     * @param {boolean} [options.updateHash=true]  write #name into the address bar
     */
    function showTab(tab, { focus = false, updateHash = true } = {}) {
        const name = tab.dataset.tab;

        tabs.forEach((button) => {
            const isActive = button === tab;
            button.setAttribute("aria-selected", String(isActive));
            button.tabIndex = isActive ? 0 : -1;
        });

        panels.forEach((panel) => {
            panel.hidden = panel.dataset.tabPanel !== name;
        });

        if (focus) tab.focus();

        // Lets users bookmark / share dashboard.html#claims
        if (updateHash) {
            try {
                history.replaceState(null, "", "#" + name);
            } catch (error) {
                /* Some browsers block this on file:// pages; the tab still works. */
            }
        }
    }

    function findTabByName(name) {
        return tabs.find((tab) => tab.dataset.tab === name) || null;
    }

    /*  Mouse and keyboard  */

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => showTab(tab));

        tab.addEventListener("keydown", (event) => {
            let target = null;
            if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
            if (event.key === "ArrowLeft") target = tabs[(index - 1 + tabs.length) % tabs.length];
            if (event.key === "Home") target = tabs[0];
            if (event.key === "End") target = tabs[tabs.length - 1];

            if (target) {
                event.preventDefault();
                showTab(target, { focus: true });
            }
        });
    });

    // Back / forward buttons or a manually edited #hash.
    window.addEventListener("hashchange", () => {
        const tab = findTabByName(location.hash.slice(1));
        if (tab) showTab(tab, { updateHash: false });
    });

    /*  Start up  */

    // Open the tab named in the URL (dashboard.html#claims), else the first.
    showTab(findTabByName(location.hash.slice(1)) || tabs[0], { updateHash: false });

    /*  Page-level controls  */

    // "Reset demo data": forgets every saved change so the demo starts fresh.
    document.querySelectorAll('[data-action="reset-demo"]').forEach((button) => {
        button.addEventListener("click", () => {
            if (window.DashboardStore) window.DashboardStore.reset();
            location.reload();
        });
    });

    // Public API so other scripts can jump to a tab: DashboardTabs.show("claims")
    window.DashboardTabs = {
        show(name) {
            const tab = findTabByName(name);
            if (tab) showTab(tab, { focus: true });
        }
    };
})();
