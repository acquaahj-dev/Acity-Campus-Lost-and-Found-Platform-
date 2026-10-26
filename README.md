# Acity Campus Lost and Found Platform

A simple platform for reporting lost items and found belongings on campus.

This part of the project (Group 1) covers reporting an item, reviewing it, and finding it again with a reference ID.

## How to link to our pages

All pages are in the project root, so a link is just the file name.

| Choose Lost or Found | `report-type.html` |
| Lost form | `report.html` | `<a href="report.html?type=lost">Report lost</a>` |
| Found form | `report.html` | `<a href="report.html?type=found">Report found</a>` |
| Find a report | `find-report.html` | `<a href="find-report.html">Find my report</a>` |


## How to link to other pages of the app

The menu in the header is shared by every page. To add or change a link, edit the `menuLinks` list in `js/layout.js`:

```js
const menuLinks = [
  { text: "Home", file: "index.html" },
  { text: "Report Items", file: "report-type.html" },
  // add or change links here
];
```

To use the shared header and footer on a new page, add this:

```html
<link rel="stylesheet" href="css/global.css">

<div id="site-header"></div>
<main> your content </main>
<div id="site-footer"></div>
<script src="js/layout.js"></script>
```

## Project structure

```
report-type.html    Choose Lost or Found
report.html         The report form with validation
review.html         Review and submit with reference ID
find-report.html    Find a report by ID
css/                global.css (shared), report.css
js/                 layout.js, storage.js, report.js, review.js, find-report.js
```

## How data is saved

There is no server yet. Reports are saved in the browser's localStorage, so they only show up on the computer where they were submitted. Teammates won't see each other's reports.

## Running the project

Open the folder in VS Code and run it with the **Live Server** extension.