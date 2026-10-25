"use strict";

/* =====================================================
   FIND A REPORT (find-report.html)
   The person types their reference ID and we show
   their report. The link from the success pop-up
   (find-report.html?id=LF-XXXXXX) fills the ID in for them.
   ===================================================== */

/* ---------- Find the parts of the page ---------- */
const findForm = document.getElementById("find-form");
const referenceInput = document.getElementById("reference-input");
const referenceError = document.getElementById("reference-error");
const notFoundMessage = document.getElementById("not-found-message");
const resultCard = document.getElementById("result-card");
const resultPhoto = document.getElementById("result-photo");
const resultList = document.getElementById("result-list");

/* ---------- Look for a report and show the answer ---------- */
function showReportForId(referenceId) {
  // Hide the old answer first
  resultCard.hidden = true;
  notFoundMessage.hidden = true;
  referenceError.textContent = "";
  referenceInput.setAttribute("aria-invalid", "false");

  // Nothing typed
  if (referenceId.trim() === "") {
    referenceError.textContent = "Please enter your reference ID.";
    referenceInput.setAttribute("aria-invalid", "true");
    return;
  }

  const report = findReportById(referenceId);

  if (report === null) {
    notFoundMessage.textContent = "We could not find a report with that ID. Check the ID and try again.";
    notFoundMessage.hidden = false;
    return;
  }

  fillReportDetails(report, resultList, resultPhoto);
  resultCard.hidden = false;
}

findForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showReportForId(referenceInput.value);
});

/* ---------- Start the page ---------- */
// If the link has an ID in it, fill it in and search straight away
const idFromUrl = new URLSearchParams(window.location.search).get("id");

if (idFromUrl !== null) {
  referenceInput.value = idFromUrl;
  showReportForId(idFromUrl);
}
