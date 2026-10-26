# Acity Campus Lost and Found Platform

A streamlined go-to platform for finding lost items or reporting found belongings on campus.

This repository is built by several groups. **Group 1** owns the reporting flow: choosing a report type, filling in the form, reviewing, submitting, and finding a report again with a reference ID.

---

## 🔗 Teammates: how to link to our pages

### 1. The page map

All pages sit in the **project root**, so links are just the file name.

| Page | File | What it is | How to reach it |
|---|---|---|---|
| Home | `index.html` | Landing page (owned by agroup 7) | `<a href="index.html">` |
| Choose report type | `report-type.html` | Choose "Lost" or "Found" | `<a href="report-type.html">` |
| Report form | `report.html` | The Lost / Found form | `report.html?type=lost` or `report.html?type=found` |
| Review | `review.html` | Check answers, then submit | Reached automatically from the form |
| Find a report | `find-report.html` | Look up a report by reference ID | `find-report.html` or `find-report.html?id=LF-XXXXXX` |

### 2. Linking **to** our pages from yours

Copy any of these into your HTML:

```html
<!-- Start a report (lets the user choose Lost or Found) -->
<a href="report-type.html">Report an item</a>

<!-- Jump straight to the Lost form -->
<a href="report.html?type=lost">Report a lost item</a>

<!-- Jump straight to the Found form -->
<a href="report.html?type=found">Report a found item</a>

<!-- Look up a report -->
<a href="find-report.html">Find my report</a>

<!-- Open a specific report directly (ID is filled in and searched automatically) -->
<a href="find-report.html?id=LF-K7M2QX">View report LF-K7M2QX</a>
```

> **Tip:** the `?type=lost` / `?type=found` part is what picks the form. Without it, `report.html` shows the Lost form (or whatever the user last had in progress).

### 3. Linking **from** our pages to the rest of the app

Our pages already link to each other. The links to other groups' pages are in the **shared header**, controlled by one file: `js/layout.js`.

Open `js/layout.js` and edit the `menuLinks` list:

```js
const menuLinks = [
  { text: "Home",               file: "index.html" },
  { text: "Report Lost Items",  file: "report.html" },
  { text: "Report Found Items", file: "report.html" },
  { text: "Browse Items",       file: "dashboard.html" },
  { text: "Item Details",       file: "items.html" },
  { text: "Messages",           file: "chat.html" },
  { text: "Collection Points",  file: "safe-zones.html" },
  { text: "Dashboard",          file: "items.html" }
];

// The red "Report Item" button
const reportButtonFile = "report-type.html";
```

Change a `file` value and **every page updates**. You don't need to touch each page's header. The current page is highlighted automatically by comparing the file name.

### 4. Adding the shared header/footer to a new page

Every page needs the same skeleton. Copy this into your new page:

```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/global.css">   <!-- shared styles first -->
  <link rel="stylesheet" href="css/report.css">   <!-- only if you reuse our components -->
</head>
<body>
  <div id="site-header"></div>   <!-- header appears here -->

  <main id="main"> ...your content... </main>

  <div id="site-footer"></div>   <!-- footer appears here -->

  <script src="js/layout.js"></script>   <!-- always first -->
</body>
```

### 5. Reading our data from your pages

Submitted reports are saved in the browser (see [How data is stored](#how-data-is-stored)). To use them on your page, load `storage.js` **after** `layout.js`:

```html
<script src="js/layout.js"></script>
<script src="js/storage.js"></script>
```

Then you can call:

| Function | Returns |
|---|---|
| `getAllReports()` | Array of every submitted report |
| `findReportById("LF-K7M2QX")` | One report, or `null` |
| `formatDate("2026-10-10")` | `"10/10/2026"` |
| `getLocationText(report)` | Location as text (handles "Other") |
| `fillReportDetails(report, dlElement, photoElement)` | Renders a report into a `<dl>` and a photo box |

A saved report looks like this:

```js
{
  reportType: "lost" | "found",
  itemName: "Android Charger",
  category: "Electronics",
  description: "…",
  location: "Library",
  otherLocation: "",            // only filled when location is "Other"
  handoffLocation: "",          // only for found items
  date: "2026-10-10",           // YYYY-MM-DD
  photo: "data:image/jpeg;base64,…",   // "" if there is no photo
  photoName: "charger.jpg",
  referenceId: "LF-K7M2QX",
  status: "Open",
  submittedOn: "10/26/2026"
}
```

---

## ✨ Features

### Choose a report type (`report-type.html`)
- Two clear cards: **Report a lost item** and **Report a found item**
- Each card opens the form already set to the right type
- A link for people who already submitted: "Find it with your reference ID"

### Report form (`report.html` + `js/report.js`)
- **One form, two modes.** Switch between *I lost an item* and *I found an item*. Labels update automatically ("Where did you lose it?" / "Where did you find it?").
- **Fields:** item name, category, description, location, date, optional photo.
- **Found-only field:** a *hand-off location* (SCA Office, Library Frontdesk, security desks, hostel receptions).
- **"Other" location:** choosing *Other* reveals a box to type the specific place, and moves the cursor into it.
- **Date picker:** calendar pop-up that blocks future dates and dates before 2000.
- **Photo upload (optional):**
  - JPG or PNG only, maximum 5MB
  - Live preview with a *Remove image* button
  - Photos are shrunk in the browser (max 1280px, ≤ 300KB) so they fit in browser storage
- **Validation with clear messages**, all shown at once, with the cursor moved to the first mistake:
  - Item name required
  - Category required
  - Description at least 20 characters
  - Location required (and at least 3 characters if "Other")
  - Hand-off location required (found items)
  - Date required, not in the future
  - Photo must finish processing and have no error
- **Draft saving.** If the user clicks *Back to edit* from the review page, all their answers (including the photo) are restored.
- **Cancel** clears the draft and returns to the report type page.
- Accessible: `aria-invalid` on bad fields, `aria-pressed` on the toggle, labelled inputs.

### Review page (`review.html` + `js/review.js`)
- Shows everything the user entered, plus the photo (or "No image added")
- **Edit / Back to edit** returns to the form with answers kept
- **Submit report** generates a unique reference ID like `LF-K7M2QX`
  - Characters that look alike (`0 O 1 I`) are left out
  - The ID is checked so it is never reused
- **Success pop-up** with the reference ID, a **Copy ID** button, and links to *View my report*, *Submit another report* and *Back to home*
- Friendly empty state if someone opens the page with nothing to review

### Find a report (`find-report.html` + `js/find-report.js`)
- Enter a reference ID to see the full report and its status
- Case-insensitive (`lf-k7m2qx` works)
- Works from a link: `find-report.html?id=LF-K7M2QX` fills in the ID and searches straight away
- Messages for an empty field and for "not found"

### Shared header and footer (`js/layout.js`)
- One file builds the header and footer for every page
- Highlights the current page in the menu
- Mobile hamburger menu with `aria-expanded` support

### Styling (`css/`)
- `global.css`: shared colors, typography and components (used by all groups)
- `report.css`: styles for the reporting flow

---

## 🗂 Project structure

```
├── index.html            (Home — other group)
├── report-type.html      Choose Lost / Found
├── report.html           The report form
├── review.html           Review + submit
├── find-report.html      Look up a report
├── css/
│   ├── global.css        Shared styles
│   └── report.css        Report flow styles
└── js/
    ├── layout.js         Shared header / footer / menu
    ├── storage.js        Saving + finding reports
    ├── report.js         Form logic (current version)
    ├── report-old.js     Earlier form logic (no photo compression)
    ├── review.js         Review + submit logic
    └── find-report.js    Lookup logic
```

---

## 💾 How data is stored

There is no server yet, so everything lives in the browser:

| What | Where | Lasts |
|---|---|---|
| Report being filled in (draft) | `sessionStorage` key `lostFoundDraft` | Until the tab is closed |
| Submitted reports | `localStorage` key `lostFoundReports` | Until browser data is cleared |

**Important for teammates:**
- Data is **per browser and per device**. A report submitted on one computer will **not** appear on a teammate's computer, even when you share the same code. To test each other's pages, submit a report on your own machine.
- Photos are saved as base64 text, which is large. If a photo does not fit, `storage.js` saves the report **without** the photo rather than failing.

---

## 🚀 Running locally

No build step. Open the folder with the VS Code **Live Server** extension (configured for port `5501` in `.vscode/settings.json`) and start from `report-type.html` or `index.html`.

Opening files directly (`file://`) works for most things, but Live Server is recommended.

---

## ⚠️ Known issues (please read before pushing)

1. **`report.html` loads the old script.** It currently includes `js/report-old.js`, not `js/report.js`. The old version has **no photo compression and no "Other" location box**, which is the most likely reason images go missing. Fix: in `report.html`, change
   ```html
   <script src="js/report-old.js"></script>
   ```
   to
   ```html
   <script src="js/report.js"></script>
   ```
   Then delete `report-old.js` once you're happy.
2. **The header's "Report Item" button is broken.** In `js/layout.js` the line
   ```js
   <a class="btn btn--small" href="$
   ```
   is cut off. It should be:
   ```js
   <a class="btn btn--small" href="${reportButtonFile}">Report Item</a>
   ```
3. **Menu links for Lost and Found both point to `report.html`**, so the user always gets the same form. Use `report.html?type=lost` and `report.html?type=found`. Note that the "current page" highlight compares file names only, so a link with a query string will not be highlighted until `getCurrentFileName()` is adjusted.
4. **PNG transparency:** photos are converted to JPEG, so transparent areas turn black. Fix by filling the canvas white before `drawImage` in `preparePhoto()`.
5. **`index.html` and the other groups' pages** (`dashboard.html`, `items.html`, `chat.html`, `safe-zones.html`) are linked in the menu but not in this branch yet.

---

## 👥 Branches

| Branch | Group |
|---|---|
| `feature/group1-form-validation` | Group 1: Reporting flow (this README) |
| `feature/group2-search-filters` | Group 2: Search and filters |
| `feature/group3-claim-modal` | Group 3: Claim modal |
| `feature/group4-chat-ui` | Group 4: Chat |
| `feature/group5-safe-zones-map` | Group 5: Collection points / map |
| `feature/group6-dashboard` | Group 6: Dashboard |
| `feature/group7-navigation` | Group 7: Navigation |
| `feature/group8-integration` | Group 8: Integration |

---

© 2026 Academic City University. All rights reserved.
