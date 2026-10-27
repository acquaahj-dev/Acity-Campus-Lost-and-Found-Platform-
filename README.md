# ACity Campus Lost & Found Platform

A frontend-only campus lost-and-found application assembled for Group 8's integration assignment. The app combines the seven group modules into a shared, navigable experience using HTML5, CSS3, and vanilla JavaScript. All content is mock data or browser-local demo data; there is no backend.

## Features

- **Item reporting:** lost/found report forms, validation, optional image preview, review/submit flow, reference IDs, and browser-local report lookup.
- **Search and catalog:** keyword search, dynamic category and location filters, status/date/type/colour filters, sorting, item cards, and an item-details dialog.
- **Item details and claim demo:** reports from the catalog link to the detail/ownership-check page. Claims are a demo interaction, not authoritative verification.
- **Anonymous messaging demo:** browser-only profile gate, conversation list, message thread, and privacy reminders. It does not provide server-backed delivery or end-to-end encryption.
- **Safe zones:** campus map views, hand-off hub directory and hours, safety guidance, and claim/handoff checklist.
- **Activity dashboard:** reported items, pending-claim and message panels, and status controls synchronized with locally saved reports.
- **Shared shell:** consistent header, responsive navigation, footer, skip links, and active-page indicators across all pages.

## Pages and shared files

- `index.html` — integrated landing page.
- `report-type.html`, `report.html`, `review.html`, `find-report.html` — Group 1 reporting flow.
- `catalog.html` — Group 2 search and filter catalog.
- `item.html` — Group 3 item list and mock ownership-check dialog.
- `messages.html` — Group 4 anonymous chat demonstration.
- `safe-zones.html` — Group 5 campus safe-zone map and hub tools.
- `dashboard.html` — Group 6 activity dashboard.
- `ux-ui.css`, `css/global.css`, `css/report.css`, `css/integration.css` — shared design system, reporting baseline, common navigation, and integration styles.
- `js/layout.js` — shared header, responsive navigation, and footer.
- `js/platform-data.js` — combines Group 2 fixtures with reports saved by Group 1.
- `js/platform-dashboard-bridge.js` — adapts the report store to the dashboard and syncs status changes.
- `data/mock-catalog-items.js` — separate catalog demo fixtures.

The original group folders are not required to run the integrated application.

## Run locally

Run the project from a local static web server; do not open pages with `file://`. In VS Code, install/enable Live Server, open this folder, right-click `index.html`, and select **Open with Live Server**. Alternatively, from this folder run:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`. Node.js can be used to check JavaScript syntax:

```powershell
Get-ChildItem .\js\*.js | ForEach-Object { node --check $_.FullName }
```

## Data, privacy, and demo limitations

- Reports, dashboard status changes, and chat settings are held in browser storage. They are not shared between users or devices and may be removed by clearing site data.
- The claim form only demonstrates a user interface. It does not authenticate a claimant, prove ownership, or send a claim to an item owner.
- The chat is not end-to-end encrypted and has no backend. Do not enter real names, phone numbers, email addresses, or other sensitive information.
- Safe-zone maps use external campus/map services. An internet connection may be needed for map tiles, embeds, fonts, and Leaflet. The displayed hub hours are placeholders and must be confirmed with campus staff before real-world use.
- This project is not suitable for real personal data or operational lost-property handling until a secure backend and trusted verification process are implemented.

## Group 8 integration and GitHub workflow

The Group 8 integration branch name is `feature/group8-integration`. Keep `main` deployable; work on feature branches and submit pull requests rather than pushing feature work directly to `main`.

Before merging a pull request:

1. Confirm the change is limited to the agreed module and does not break another page's styles or routes.
2. Check keyboard navigation, responsive layouts, and accessible names/status messages.
3. Run the JavaScript syntax command above and test affected user flows using the local server.
4. Review the changed files and links; resolve review comments and obtain the team's required approval before merging.

The published site is [https://boredcreator124.github.io/Acity-Campus-Lost-and-Found-Platform-/](https://boredcreator124.github.io/Acity-Campus-Lost-and-Found-Platform-/). During integration, GitHub Pages publishes the `feature/group8-integration` branch from the repository root. After merging this work into `main`, switch the Pages publishing source under **Settings > Pages > Build and deployment** to **Deploy from a branch**, select `main` and `/(root)`, and save. GitHub will automatically publish future commits pushed to that branch.
