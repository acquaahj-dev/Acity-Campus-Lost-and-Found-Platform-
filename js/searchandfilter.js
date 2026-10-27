let items = [];
let catalogDataError = "";
try {
    items = window.PlatformData.getAllItems();
} catch (error) {
    items = window.CATALOG_MOCK_ITEMS.map((item) => ({ ...item }));
    catalogDataError = error.message;
    console.error("Could not load submitted reports into the catalog:", error);
}

// Active State Tracker for Category Pill
let selectedCategory = "";

// Get HTML Elements
const keywordInput = document.querySelector("#keyword");
const typeSelect = document.querySelector("#item-type");
const colourSelect = document.querySelector("#colour");
const statusSelect = document.querySelector("#status");
const locationSelect = document.querySelector("#location");
const dateFromInput = document.querySelector("#date-from");
const dateToInput = document.querySelector("#date-to");
const sortSelect = document.querySelector("#sort");

const pillsContainer = document.querySelector("#category-pills");
let pillButtons = Array.from(document.querySelectorAll(".pill"));

uniqueValues(items, "category").forEach(category => {
    if (pillButtons.some(button => button.dataset.category === category)) return;
    const button = createElement("button", "pill", category);
    button.type = "button";
    button.dataset.category = category;
    pillsContainer.append(button);
});
pillButtons = Array.from(document.querySelectorAll(".pill"));

const itemsGrid = document.querySelector("#items-grid");
const emptyState = document.querySelector("#empty-state");
const resultCount = document.querySelector("#result-count");
const resultsSummary = document.querySelector("#results-summary");
const storageError = document.querySelector("#catalog-storage-error");
if (catalogDataError) {
    storageError.textContent = `${catalogDataError} Showing the public demo items only.`;
    storageError.hidden = false;
}

const clearButtons = [
    document.querySelector("#clear-filters"),
    document.querySelector("#clear-filters-bottom"),
    document.querySelector("#empty-clear")
];

const itemDialog = document.querySelector("#item-dialog");
const dialogContent = document.querySelector("#dialog-content");
const dialogClose = document.querySelector("#dialog-close");

// Helper Functions
function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function fillSelect(select, values, defaultLabel) {
    const previousValue = select.value;
    select.replaceChildren(new Option(defaultLabel, ""));
    values.forEach(value => select.add(new Option(value, value)));
    if (values.includes(previousValue)) {
        select.value = previousValue;
    }
}

function uniqueValues(records, key) {
    return [
        ...new Set(records.map(item => item[key]).filter(Boolean))
    ].sort((a, b) => a.localeCompare(b));
}

function formatDate(dateString) {
    const date = new Date(`${dateString}T12:00:00`);
    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Dependent Filters
function updateDependentFilters() {
    const categoryItems = selectedCategory
        ? items.filter(item => item.category === selectedCategory)
        : items;

    const validTypes = uniqueValues(categoryItems, "itemType");
    fillSelect(typeSelect, validTypes, "All Item Types");
    typeSelect.disabled = !selectedCategory;

    if (!validTypes.includes(typeSelect.value)) {
        typeSelect.value = "";
    }

    const selectedType = typeSelect.value;
    const typeItems = selectedType
        ? categoryItems.filter(item => item.itemType === selectedType)
        : categoryItems;

    const validColours = uniqueValues(typeItems, "colour");
    fillSelect(colourSelect, validColours, "All Colours");
    colourSelect.disabled = !selectedCategory;

    if (!validColours.includes(colourSelect.value)) {
        colourSelect.value = "";
    }
}

// Create Item Card
function createItemCard(item) {
    const card = createElement("article", "item-card");
    card.dataset.itemId = item.id;

    const art = createElement("div", "card-art");
    art.append(createElement("span", "card-emoji", item.icon || "📦"));

    const body = createElement("div", "card-body");
    const topLine = createElement("div", "card-topline");

    const badgeText = item.status === "Lost" ? "● Lost" : "✓ Found";
    const badge = createElement("span", `status-badge ${item.status.toLowerCase()}`, badgeText);
    const date = createElement("span", "card-date", formatDate(item.dateReported));

    topLine.append(badge, date);

    const title = createElement("h3", "card-title", item.name);
    const description = createElement("p", "card-description", item.description);
    const location = createElement("p", "card-location", `📍 Location: ${item.location}`);

    const meta = createElement("div", "card-meta");
    meta.append(
        createElement("span", "meta-chip", item.category),
        createElement("span", "meta-chip", item.colour)
    );

    const button = createElement("button", "card-button", "View Details");
    button.type = "button";
    button.addEventListener("click", () => openItemDetails(item));

    body.append(topLine, title, description, location, meta, button);
    card.append(art, body);

    return card;
}

// Filter & Sort Logic
function getFilteredItems() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const type = typeSelect.value;
    const colour = colourSelect.value;
    const status = statusSelect.value;
    const location = locationSelect.value;
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;

    let filtered = items.filter(item => {
        const searchableText = [
            item.name, item.category, item.itemType,
            item.colour, item.status, item.location,
            item.description, item.id
        ].join(" ").toLowerCase();

        return (!keyword || searchableText.includes(keyword))
            && (!selectedCategory || item.category === selectedCategory)
            && (!type || item.itemType === type)
            && (!colour || item.colour === colour)
            && (!status || item.status === status)
            && (!location || item.location === location)
            && (!dateFrom || item.dateReported >= dateFrom)
            && (!dateTo || item.dateReported <= dateTo);
    });

    switch (sortSelect.value) {
        case "oldest":
            filtered.sort((a, b) => a.dateReported.localeCompare(b.dateReported));
            break;
        case "name-asc":
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "name-desc":
            filtered.sort((a, b) => b.name.localeCompare(a.name));
            break;
        default:
            filtered.sort((a, b) => b.dateReported.localeCompare(a.dateReported));
    }

    return filtered;
}

// Render Grid
function renderItems() {
    const filtered = getFilteredItems();
    itemsGrid.replaceChildren();

    filtered.forEach(item => {
        itemsGrid.append(createItemCard(item));
    });

    const hasResults = filtered.length > 0;
    itemsGrid.hidden = !hasResults;
    emptyState.hidden = hasResults;

    resultCount.textContent = String(filtered.length);
    resultsSummary.textContent = `Showing ${filtered.length} of ${items.length} items`;
}

// Clear Filters
function clearFilters() {
    keywordInput.value = "";
    selectedCategory = "";
    statusSelect.value = "";
    locationSelect.value = "";
    dateFromInput.value = "";
    dateToInput.value = "";
    sortSelect.value = "newest";

    pillButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.category === "");
    });

    updateDependentFilters();
    typeSelect.value = "";
    colourSelect.value = "";

    renderItems();
}

// Modal Controls
function openItemDetails(item) {
    dialogContent.replaceChildren();

    const art = createElement("div", "dialog-art");
    art.append(createElement("span", "card-emoji", item.icon || "📦"));

    const body = createElement("div", "dialog-body");
    const badge = createElement("span", `status-badge ${item.status.toLowerCase()}`, item.status);
    const title = createElement("h2", "", item.name);
    title.id = "dialog-title";

    const description = createElement("p", "", item.description);
    const details = createElement("div", "dialog-details");

    const detailValues = [
        ["Reference ID", item.id],
        ["Category", item.category],
        ["Item Type", item.itemType],
        ...(item.colour ? [["Colour", item.colour]] : []),
        ["Campus Location", item.location],
        ["Date Reported", formatDate(item.dateReported)]
    ];

    detailValues.forEach(([label, value]) => {
        const cell = createElement("div", "detail-cell");
        cell.append(
            createElement("span", "", label),
            createElement("strong", "", value)
        );
        details.append(cell);
    });

    const safetyMessage = createElement(
        "p",
        "dialog-safety",
        "Protect your privacy. Use the in-app ownership check and arrange a hand-off at an approved campus hub."
    );
    const detailLink = createElement("a", "primary-button", "Open ownership check");
    detailLink.href = `item.html?id=${encodeURIComponent(item.id)}`;

    body.append(badge, title, description, details, safetyMessage, detailLink);
    dialogContent.append(art, body);

    if (typeof itemDialog.showModal === "function") {
        itemDialog.showModal();
    } else {
        itemDialog.setAttribute("open", "");
    }
}

function closeDialog() {
    if (typeof itemDialog.close === "function") {
        itemDialog.close();
    } else {
        itemDialog.removeAttribute("open");
    }
}

// Event Listeners For Category Pills
pillButtons.forEach(button => {
    button.addEventListener("click", () => {
        pillButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        selectedCategory = button.dataset.category;
        updateDependentFilters();
        renderItems();

    });
});

// Event Listeners For Controls
[keywordInput, statusSelect, locationSelect, dateFromInput, dateToInput, sortSelect].forEach(control => {
    control.addEventListener("input", renderItems);
});

typeSelect.addEventListener("change", () => {
    updateDependentFilters();
    renderItems();
});

colourSelect.addEventListener("change", renderItems);

clearButtons.forEach(button => {
    if (button) button.addEventListener("click", clearFilters);
});

dialogClose.addEventListener("click", closeDialog);

itemDialog.addEventListener("click", event => {
    if (event.target === itemDialog) closeDialog();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && itemDialog.open) closeDialog();
});

// Initialize
fillSelect(locationSelect, uniqueValues(items, "location"), "All Locations");
updateDependentFilters();
renderItems();