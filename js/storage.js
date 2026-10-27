"use strict";

/* =====================================================
   STORAGE: saving and finding reports
   There is no server, so we save things in the browser.
     - sessionStorage = the report being filled in (a "draft").
       It is forgotten when the tab is closed.
     - localStorage   = reports that were submitted.
       They stay until the browser data is cleared.
   ===================================================== */

const DRAFT_KEY = "lostFoundDraft";
const REPORTS_KEY = "lostFoundReports";

// Letters and numbers used in reference IDs.
// We leave out ones that look alike (0, O, 1, I).
const ID_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function readStoredJson(storageName, key, description) {
  let text;
  try {
    text = window[storageName].getItem(key);
  } catch (error) {
    throw new Error(`Your browser could not access the saved ${description}.`);
  }

  if (text === null) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`The saved ${description} could not be read. Clear the browser's saved data and try again.`);
  }
}

function writeStoredJson(storageName, key, value, description) {
  try {
    window[storageName].setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error(`Your browser could not save the ${description}. Check available storage and try again.`);
  }
}

/* ---------- Draft (the report being filled in) ---------- */

function saveDraft(report) {
  writeStoredJson("sessionStorage", DRAFT_KEY, report, "report draft");
}

function getDraft() {
  const draft = readStoredJson("sessionStorage", DRAFT_KEY, "report draft");
  if (draft !== null && (typeof draft !== "object" || Array.isArray(draft))) {
    throw new Error("The saved report draft has an invalid format. Clear the browser's saved data and try again.");
  }
  return draft;
}

function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
    return true;
  } catch (error) {
    return false;
  }
}

/* ---------- Submitted reports ---------- */

// Returns a list of every submitted report
function getAllReports() {
  const reports = readStoredJson("localStorage", REPORTS_KEY, "submitted reports") ?? [];
  if (!Array.isArray(reports) || reports.some((report) =>
    report === null || typeof report !== "object" || typeof report.referenceId !== "string"
  )) {
    throw new Error("The saved reports have an invalid format. Clear the browser's saved data and try again.");
  }
  return reports;
}

function saveSubmittedReport(report) {
  const allReports = getAllReports();
  writeStoredJson("localStorage", REPORTS_KEY, [...allReports, report], "report");
}

// Looks for a report with this reference ID. Returns null if there is none.
function findReportById(referenceId) {
  const searchId = referenceId.trim().toUpperCase();

  // .find() gives back the first report that matches, or undefined.
  // "?? null" changes undefined into null.
  return getAllReports().find((report) => report.referenceId === searchId) ?? null;
}

/* ---------- Reference ID ---------- */

// Makes an ID like LF-K7M2QX
function makeReferenceId() {
  let randomPart = "";

  for (let i = 0; i < 6; i++) {
    const randomPosition = Math.floor(Math.random() * ID_CHARACTERS.length);
    randomPart += ID_CHARACTERS[randomPosition];
  }

  return `LF-${randomPart}`;
}

// Keeps making IDs until we get one nobody has used
function makeUniqueReferenceId() {
  let newId = makeReferenceId();

  while (findReportById(newId) !== null) {
    newId = makeReferenceId();
  }

  return newId;
}

/* ---------- Showing a report on the page ---------- */

// Turns "2026-10-10" into "10/10/2026"
function formatDate(dateText) {
  if (!dateText) {
    return "";
  }
  const [year, month, day] = dateText.split("-");   // splits the text into 3 parts
  return `${day}/${month}/${year}`;
}

// Gives the location as text. If the person chose "Other",
// we show the place they typed.
function getLocationText(report) {
  if (report.location === "Other" && report.otherLocation) {
    return `Other: ${report.otherLocation}`;
  }
  return report.location;
}

// Fills a <dl> list and a photo box with the details of a report.
// Used by the review page and the find-report page.
function fillReportDetails(report, detailsList, photoArea) {
  const isFound = report.reportType === "found";
  const dateLabel = isFound ? "Date found" : "Date lost";

  // Each row is [label, value]
  const rows = [];
  if (report.referenceId) {
    rows.push(["Reference ID", report.referenceId]);
    rows.push(["Status", report.status]);
  }
  rows.push(["Item name", report.itemName]);
  rows.push(["Description", report.description]);
  rows.push(["Category", report.category]);
  rows.push([dateLabel, formatDate(report.date)]);
  rows.push(["Location", getLocationText(report)]);
  if (isFound) {
    rows.push(["Hand-off location", report.handoffLocation]);
  }

  // Build the list. replaceChildren() empties it first.
  detailsList.replaceChildren();
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    detailsList.append(term, description);
  }

  // Show the photo, or a message if there is none
  photoArea.replaceChildren();
  if (report.photo) {
    const picture = document.createElement("img");
    picture.src = report.photo;
    picture.alt = `Photo of ${report.itemName}`;
    photoArea.append(picture);
  } else {
    photoArea.textContent = "No image added";
  }
}
