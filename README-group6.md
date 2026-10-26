## Group 6 – User Activity Dashboard

A personal portal where a student tracks everything they have done on the
ACity Lost & Found platform: the items they reported, the claims on those
items (and claims they made), conversations about hand-offs, and the status
of every item through to "Resolved / Returned".

**Page:** `dashboard.html` (linked as "My Dashboard" in the global navigation)

### Features

| Feature | What it does |
| --- | --- |
| Summary tiles | Live counts of Open, Claimed, Resolved and Total reports |
| My Reported Items | Cards with image, title, location, date, Lost/Found badge and status badge |
| Pending Claims | Claims on my items (Approve / Reject) and claims I made (read-only status) |
| Status controls | "Mark as Resolved / Returned" with a confirm dialog, "Reopen item", items move to the Resolved tab |
| Messages panel | Anonymous conversation summary, mark read / unread, link to Group 4's chat |
| Persistence | Changes are remembered in `localStorage` (no backend). "Reset demo data" clears them |
| Accessibility | Semantic HTML5, ARIA tabs with keyboard support, focus rings, screen-reader announcements |
| Responsive | Mobile, tablet and desktop (CSS Grid, Flexbox, media queries at 900px and 700px) |

### How to run

1. Open the project folder in VS Code.
2. Install the **Live Server** extension, right-click `dashboard.html` and choose **Open with Live Server**.
3. (Or simply double-click `dashboard.html` to open it in a browser. No build step.)

### Files

| File | Role | Purpose |
| --- | --- | --- |
| `dashboard.html` | 1 | Page structure, tabs, header and footer from Group 7 |
| `dashboard.css` | 1 | Design tokens, layout, summary tiles, tabs |
| `dashboard-tabs.js` | 1 | Accessible tab switching, reset button |
| `reported-items.js` / `.css` | 2 | Draws and styles the item cards |
| `pending-claims.js` / `.css` | 3 | Claims lists, Approve / Reject |
| `status-controls.js` / `.css` | 4 | Badges, resolve toggle, confirm dialog, moving items |
| `mock-data.js` | 5 | Sample users, items, claims, messages and helpers |
| `messages-panel.js` / `.css` | 5 | Messages summary |
| `dashboard-store.js` | Shared | Saves and restores user changes in `localStorage` |
| `images/items/*.svg` | 5 | Placeholder pictures for the sample items |

Scripts load in this order (the last one must stay last):
`mock-data.js` → `dashboard-store.js` → `dashboard-tabs.js` → `reported-items.js` → `pending-claims.js` → `messages-panel.js` → `status-controls.js`

### Mock data format

```js
// items:    { id, title, type: "lost"|"found", status: "Open"|"Claimed"|"Resolved", date: "YYYY-MM-DD", location, image, reportedBy }
// claims:   { id, itemId, claimant, status: "Pending"|"Approved"|"Rejected", date, details }
// messages: { id, itemId, from, preview, date, unread }
```

People are always shown by an anonymous alias (privacy requirement).

### Integration hooks (for Group 8)

Every connection to another group is configured in **one place**:
`mock-data.js` → `dashboardData.links`.

| Hook | Group | Where it is used | Expected by Group 6 |
| --- | --- | --- | --- |
| `links.itemDetails` | 3 | Item cards, claim rows | `item-details.html?id=ITEM_ID` |
| `links.messages` | 4 | Messages panel, approved claims | `messages.html?item=ITEM_ID` |
| `links.reportLost` / `links.reportFound` | 1 | Hero buttons, empty state | `report.html`, `found.html` |
| `links.browseItems` | 2 | (available for future use) | `items.html` |
| Header / nav / footer | 7 | Top and bottom of `dashboard.html` | Copy of Group 7's `index.html` header and footer |
| `dashboardData.items` | 1 / 2 | `mock-data.js` | Replace with the shared item store, keeping the field names |

Search the Group 6 files for the word **HOOK** to find every place.

### Team

| Role | Part | Member |
| --- | --- | --- |
| 1 | Page Shell & Tabs | |
| 2 | My Reported Items | |
| 3 | Pending Claims | |
| 4 | Status Controls & Resolve Logic | |
| 5 | Mock Data, Messages Panel & README | |
