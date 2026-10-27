"use strict";

/* =====================================================
   REVIEW PAGE (review.html)
   What this file does:
     1. Shows the answers from the form
     2. When the person clicks Submit: makes a reference ID,
        saves the report and shows the success pop-up
   ===================================================== */

/* ---------- Find the parts of the page ---------- */
const reviewTitle = document.getElementById("review-title");
const reviewIntro = document.getElementById("review-intro");
const emptyMessage = document.getElementById("empty-message");
const reviewCard = document.getElementById("review-card");
const photoArea = document.getElementById("photo-area");
const detailsList = document.getElementById("details-list");
const buttonsArea = document.getElementById("buttons-area");
const submitButton = document.getElementById("submit-button");
const submittedNote = document.getElementById("submitted-note");
const submitError = document.getElementById("submit-error");
const draftStorageNote = document.getElementById("draft-storage-note");

const successBox = document.getElementById("success-box");
const referenceIdText = document.getElementById("reference-id-text");
const copyButton = document.getElementById("copy-button");
const copyMessage = document.getElementById("copy-message");
const viewReportLink = document.getElementById("view-report-link");

/* ---------- Get the answers saved by the form page ---------- */
let draft = null;
try {
  draft = getDraft();
  draftStorageNote.hidden = !isDraftStorageFallbackInUse();
} catch (error) {
  submitError.textContent = "We could not load your saved draft. Start a new report or clear the browser's saved data and try again.";
  submitError.hidden = false;
  console.error("Failed to load the report draft for review:", error);
}

/* ---------- If there is nothing to review ---------- */
function showNothingToReview() {
  emptyMessage.hidden = false;
  reviewCard.hidden = true;
  buttonsArea.hidden = true;
  reviewTitle.hidden = true;
  reviewIntro.hidden = true;
}

/* ---------- Submit the report ---------- */
function submitReport() {
  submitError.hidden = true;
  let submittedReport;
  try {
    submittedReport = {
      ...draft,
      referenceId: makeUniqueReferenceId(),
      status: "Open",
      submittedOn: new Date().toLocaleDateString()
    };
    saveSubmittedReport(submittedReport);
  } catch (error) {
    submitError.textContent = `${error.message} Your report has not been submitted.`;
    submitError.hidden = false;
    console.error("Failed to save the submitted report:", error);
    return;
  }

  const draftCleared = clearDraft();

  // Show the reference ID in the pop-up
  referenceIdText.textContent = submittedReport.referenceId;
  viewReportLink.href = `find-report.html?id=${submittedReport.referenceId}`;

  // Keep a note on the page in case the pop-up is closed
  submittedNote.textContent = draftCleared
    ? `Submitted. Your reference ID is ${submittedReport.referenceId}.`
    : `Submitted. Your reference ID is ${submittedReport.referenceId}. The browser could not clear the saved draft.`;
  submittedNote.hidden = false;
  buttonsArea.hidden = true;

  successBox.showModal();
}

/* ---------- Copy the reference ID ---------- */
// "async" and "await" let us wait for the copy to finish
async function copyReferenceId() {
  if (!navigator.clipboard) {
    copyMessage.textContent = "Copy is not available. Please write the ID down.";
    return;
  }

  try {
    await navigator.clipboard.writeText(referenceIdText.textContent);
    copyMessage.textContent = "Copied!";
  } catch (error) {
    copyMessage.textContent = "Could not copy. Please write the ID down.";
    console.error("Failed to copy the report reference ID:", error);
  }
}

/* ---------- Start the page ---------- */
if (!submitError.hidden) {
  emptyMessage.hidden = true;
  reviewCard.hidden = true;
  buttonsArea.hidden = true;
  reviewTitle.hidden = true;
  reviewIntro.hidden = true;
} else if (draft === null || !draft.itemName) {
  showNothingToReview();
} else {
  reviewTitle.textContent =
    draft.reportType === "found" ? "Review your found item" : "Review your lost item";
  document.title = `${reviewTitle.textContent} - Acity Lost and Found`;

  fillReportDetails(draft, detailsList, photoArea);
  submitButton.addEventListener("click", submitReport);
  copyButton.addEventListener("click", copyReferenceId);
}
