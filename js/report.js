"use strict";

/*
   What this file does:
     1. Switches between the Lost form and the Found form
     2. Shows a preview of the chosen photo
     3. Checks every box and shows errors
     4. Saves the answers and goes to the review page
*/


const pageTitle = document.getElementById("page-title");
const lostButton = document.getElementById("lost-button");
const foundButton = document.getElementById("found-button");
const reportForm = document.getElementById("report-form");

const itemNameInput = document.getElementById("item-name");
const itemNameError = document.getElementById("item-name-error");

const categorySelect = document.getElementById("category");
const categoryError = document.getElementById("category-error");

const descriptionInput = document.getElementById("description");
const descriptionError = document.getElementById("description-error");

const locationLabel = document.getElementById("location-label");
const locationSelect = document.getElementById("location");
const locationError = document.getElementById("location-error");

const otherLocationBox = document.getElementById("other-location-box");
const otherLocationInput = document.getElementById("other-location");
const otherLocationError = document.getElementById("other-location-error");

const handoffBox = document.getElementById("handoff-box");
const handoffSelect = document.getElementById("handoff");
const handoffError = document.getElementById("handoff-error");

const dateLabel = document.getElementById("date-label");
const dateInput = document.getElementById("date");
const dateError = document.getElementById("date-error");

const uploadBox = document.getElementById("upload-box");
const photoInput = document.getElementById("photo-input");
const previewBox = document.getElementById("preview-box");
const previewImage = document.getElementById("preview-image");
const removePhotoButton = document.getElementById("remove-photo-button");
const photoError = document.getElementById("photo-error");

const cancelButton = document.getElementById("cancel-button");


/* ---------- 2. Settings and starting values ---------- */
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png"];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_STORED_PHOTO_SIZE = 300 * 1024; // the photo is shrunk to fit this
const MAX_PHOTO_DIMENSION = 1280;
const EARLIEST_DATE = "2000-01-01";

// These values change while the person uses the page, so we use "let"
let reportType = "lost";   // "lost" or "found"
let photoData = "";        // the chosen photo, saved as text
let photoName = "";        // the file name of the photo
let photoPending = false;  // true while a photo is being shrunk
let photoRequest = 0;      // counts photo choices so old ones are ignored

// Did the person come back from the review page? Then we have a saved draft.
let savedDraft = getDraft();

// Did the start page tell us which form to show? (report.html?type=found)
const typeFromUrl = new URLSearchParams(window.location.search).get("type");

if (typeFromUrl === "lost" || typeFromUrl === "found") {
  reportType = typeFromUrl;

  // An old draft of the other type should not be used
  if (savedDraft !== null && savedDraft.reportType !== typeFromUrl) {
    clearDraft();
    savedDraft = null;
  }
} else if (savedDraft?.reportType) {
  // "?." means: only look inside savedDraft if it exists
  reportType = savedDraft.reportType;
}

/* ---------- 3. Lost form or Found form ---------- */
function setReportType(newType) {
  reportType = newType;
  const isFound = newType === "found";

  pageTitle.textContent = isFound ? "Report a found item" : "Report a lost item";
  locationLabel.textContent = isFound ? "Where did you find it?" : "Where did you lose it?";
  dateLabel.textContent = isFound ? "When did you find it?" : "When did you lose it?";
  handoffBox.hidden = !isFound;   // only the Found form has a hand-off location

  lostButton.setAttribute("aria-pressed", !isFound);
  foundButton.setAttribute("aria-pressed", isFound);
}

lostButton.addEventListener("click", () => setReportType("lost"));
foundButton.addEventListener("click", () => setReportType("found"));

/* ---------- "Other" location ---------- */

// Shows the "type the specific place" box only when "Other" is chosen
function updateOtherLocationBox() {
  const isOther = locationSelect.value === "Other";
  otherLocationBox.hidden = !isOther;

  if (!isOther) {
    clearError(otherLocationInput, otherLocationError);
  }
}

locationSelect.addEventListener("change", () => {
  updateOtherLocationBox();

  // Put the cursor in the new box so the person can type straight away
  if (locationSelect.value === "Other") {
    otherLocationInput.focus();
  }
});


// Saves today's date as text like "2026-10-24"
function getTodayText() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");   // months start at 0
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// will not let people pick a future date
dateInput.max = getTodayText();
dateInput.min = EARLIEST_DATE;

// Open the calendar when the person clicks anywhere on the date box
dateInput.addEventListener("click", () => {
  if (typeof dateInput.showPicker === "function") {
    try {
      dateInput.showPicker();
    } catch {
      // Some browsers do not allow this. The normal date box still works.
    }
  }
});

/* ---------- 5. Photo upload and preview ---------- */

// Shrinks the photo until it fits MAX_STORED_PHOTO_SIZE and returns it as text.
// Without this, a big photo is too large for the browser's storage and
// is dropped when the report is submitted.
async function preparePhoto(file) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    let scale = Math.min(
      1,
      MAX_PHOTO_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
    );
    const canvas = document.createElement("canvas");
    const qualities = [0.82, 0.72, 0.62, 0.52];

    while (scale >= 0.25) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result === null) {
              reject(new Error("The image could not be compressed."));
              return;
            }
            resolve(result);
          }, "image/jpeg", quality);
        });

        // The saved text is about 33% bigger than the blob, so keep this small
        if (blob.size <= MAX_STORED_PHOTO_SIZE) {
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener("load", () => resolve(reader.result), { once: true });
            reader.addEventListener("error", () => reject(reader.error), { once: true });
            reader.readAsDataURL(blob);
          });
        }
      }

      scale *= 0.8;
    }

    throw new Error("The image could not be reduced to a storable size.");
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

// Shows the preview if we have a photo, or the upload box if we do not
function showPhotoOrUploadBox() {
  const hasPhoto = photoData !== "";

  uploadBox.hidden = hasPhoto;
  previewBox.hidden = !hasPhoto;

  if (hasPhoto) {
    previewImage.src = photoData;
  }
}

// Runs when the person picks a file
photoInput.addEventListener("change", () => {
  photoError.textContent = "";

  const file = photoInput.files[0];
  if (file === undefined) {
    return;
  }

  // Each choice gets a number, so a slow old photo cannot replace a newer one
  const request = ++photoRequest;
  photoPending = false;
  photoData = "";
  photoName = "";
  showPhotoOrUploadBox();

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    photoInput.value = "";
    photoError.textContent = "Please choose a JPG or PNG file.";
    return;
  }

  if (file.size > MAX_PHOTO_SIZE) {
    photoInput.value = "";
    photoError.textContent = "That file is over 5MB. Please choose a smaller one.";
    return;
  }

  photoPending = true;

  preparePhoto(file).then((result) => {
    if (request !== photoRequest) {
      return;
    }
    photoData = result;
    photoName = file.name;
    photoError.textContent = "";
    showPhotoOrUploadBox();
  }).catch((error) => {
    if (request !== photoRequest) {
      return;
    }
    photoInput.value = "";
    photoError.textContent = "Could not process that image. Please choose another JPG or PNG file.";
    console.error("Failed to process the uploaded item photo:", error);
  }).finally(() => {
    if (request === photoRequest) {
      photoPending = false;
    }
  });
});

removePhotoButton.addEventListener("click", () => {
  photoRequest++;
  photoPending = false;
  photoData = "";
  photoName = "";
  photoInput.value = "";
  photoError.textContent = "";
  showPhotoOrUploadBox();
});

/* ---------- 6. Showing and clearing errors ---------- */
function showError(inputElement, errorElement, message) {
  errorElement.textContent = message;
  inputElement.setAttribute("aria-invalid", "true");
}

function clearError(inputElement, errorElement) {
  errorElement.textContent = "";
  inputElement.setAttribute("aria-invalid", "false");
}

/* ---------- 7. Checking each box ---------- */
// Each function returns true if the box is fine, false if not.

function checkItemName() {
  if (itemNameInput.value.trim() === "") {
    showError(itemNameInput, itemNameError, "Please enter the item name.");
    return false;
  }
  clearError(itemNameInput, itemNameError);
  return true;
}

function checkCategory() {
  if (categorySelect.value === "") {
    showError(categorySelect, categoryError, "Please choose a category.");
    return false;
  }
  clearError(categorySelect, categoryError);
  return true;
}

function checkDescription() {
  if (descriptionInput.value.trim().length < 20) {
    showError(descriptionInput, descriptionError, "Please write at least 20 characters.");
    return false;
  }
  clearError(descriptionInput, descriptionError);
  return true;
}

function checkLocation() {
  if (locationSelect.value === "") {
    showError(locationSelect, locationError, "Please choose a location.");
    return false;
  }
  clearError(locationSelect, locationError);
  return true;
}

// Only needed when "Other" is chosen
function checkOtherLocation() {
  if (locationSelect.value !== "Other") {
    return true;
  }
  if (otherLocationInput.value.trim().length < 3) {
    showError(otherLocationInput, otherLocationError, "Please type the place (at least 3 characters).");
    return false;
  }
  clearError(otherLocationInput, otherLocationError);
  return true;
}

// Only needed on the Found form
function checkHandoff() {
  if (reportType === "lost") {
    return true;
  }
  if (handoffSelect.value === "") {
    showError(handoffSelect, handoffError, "Please choose a hand-off location.");
    return false;
  }
  clearError(handoffSelect, handoffError);
  return true;
}

// The photo is optional, but it must not still be processing or have an error
function checkPhoto() {
  if (photoPending) {
    photoError.textContent = "Please wait for the image to finish processing.";
    return false;
  }
  if (photoError.textContent !== "") {
    return false;
  }
  return true;
}

function checkDate() {
  // The value looks like "2026-10-10", or "" if nothing was chosen.
  // Dates written like this can be compared like normal text.
  const chosenDate = dateInput.value;

  if (chosenDate === "") {
    showError(dateInput, dateError, "Please choose a date.");
    return false;
  }
  if (chosenDate > getTodayText()) {
    showError(dateInput, dateError, "The date cannot be in the future.");
    return false;
  }
  if (chosenDate < EARLIEST_DATE) {
    showError(dateInput, dateError, "Please choose a more recent date.");
    return false;
  }

  clearError(dateInput, dateError);
  return true;
}

// Check the date again as soon as the person picks one
dateInput.addEventListener("change", checkDate);

// Checks everything. Returns true only if every box is fine.
function checkWholeForm() {
  // All the checks run (not just until the first mistake),
  // so every error shows at the same time.
  const results = [
    checkItemName(),
    checkCategory(),
    checkDescription(),
    checkLocation(),
    checkOtherLocation(),
    checkHandoff(),
    checkPhoto(),
    checkDate()
  ];

  // .every() is true only if all the results are true
  return results.every((result) => result === true);
}

// Moves the cursor to the first box with a mistake
function focusFirstError() {
  const firstMistake = document.querySelector('[aria-invalid="true"]');
  firstMistake?.focus();   // "?." means: only do this if firstMistake exists
}

/* ---------- 8. Saving and moving on ---------- */
function saveAndGoToReview() {
  // When a name matches the property (reportType, photoName),
  // we only need to write it once.
  const report = {
    reportType,
    itemName: itemNameInput.value.trim(),
    category: categorySelect.value,
    description: descriptionInput.value.trim(),
    location: locationSelect.value,
    otherLocation: locationSelect.value === "Other" ? otherLocationInput.value.trim() : "",
    handoffLocation: reportType === "found" ? handoffSelect.value : "",
    date: dateInput.value,
    photo: photoData,
    photoName
  };

  saveDraft(report);
  window.location.href = "review.html";
}

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();   // stop the page from reloading

  if (checkWholeForm()) {
    saveAndGoToReview();
  } else {
    focusFirstError();
  }
});

cancelButton.addEventListener("click", () => {
  clearDraft();
  window.location.href = "report-type.html";
});

/* ---------- 9. Start the page ---------- */
// Put back earlier answers if the person came back to edit.
// "?? ''" means: use an empty text if there is no saved value.
if (savedDraft !== null) {
  itemNameInput.value = savedDraft.itemName ?? "";
  categorySelect.value = savedDraft.category ?? "";
  descriptionInput.value = savedDraft.description ?? "";
  locationSelect.value = savedDraft.location ?? "";
  otherLocationInput.value = savedDraft.otherLocation ?? "";
  handoffSelect.value = savedDraft.handoffLocation ?? "";
  dateInput.value = savedDraft.date ?? "";
  photoData = savedDraft.photo ?? "";
  photoName = savedDraft.photoName ?? "";
}

setReportType(reportType);
updateOtherLocationBox();
showPhotoOrUploadBox();