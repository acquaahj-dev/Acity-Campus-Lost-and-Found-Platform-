"use strict";

/* =====================================================
   SHARED HEADER AND FOOTER
   Edit the links below ONCE and every page updates.
   (This file belongs to the whole class, not just Group 1.)
   ===================================================== */

const siteName = "Acity Lost and Found";

// The links in the menu. Change the file names to match your pages.
const menuLinks = [
  { text: "Home", file: "index.html" },
  { text: "Browse", file: "browse.html" },
  { text: "Safe Zones", file: "safe-zones.html" },
  { text: "My Items", file: "dashboard.html" }
];

// The red "Report Item" button
const reportButtonFile = "report-type.html";

// Finds the name of the page we are on, for example "report.html"
function getCurrentFileName() {
  // .at(-1) means "the last item"
  const fileName = window.location.pathname.split("/").at(-1);
  return fileName || "index.html";
}

// Makes the menu links as HTML text.
// .map() turns every link in the list into a piece of HTML,
// and .join("") glues the pieces together.
function buildMenuLinks() {
  const currentFile = getCurrentFileName();

  return menuLinks
    .map((link) => {
      const currentAttribute = link.file === currentFile ? ' aria-current="page"' : "";
      return `<a href="${link.file}"${currentAttribute}>${link.text}</a>`;
    })
    .join("");
}

function buildHeader() {
  return `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="header">
      <div class="container header__inner">
        <a class="logo" href="index.html">${siteName}<span class="logo__dot"></span></a>

        <button class="nav-toggle" id="menu-button" type="button"
                aria-expanded="false" aria-controls="site-menu" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>

        <nav class="nav" id="site-menu" aria-label="Main">
          ${buildMenuLinks()}
          <a class="btn btn--small" href="${reportButtonFile}">Report Item</a>
        </nav>
      </div>
    </header>
  `;
}

function buildFooter() {
  return `
    <footer class="footer">
      <div class="container footer__inner">
        <span>&copy; 2026 ${siteName}</span>
        <a href="find-report.html">Find my report</a>
      </div>
    </footer>
  `;
}

// Swaps an empty <div> for the real header or footer
function replacePlaceholder(placeholderId, newHtml) {
  const placeholder = document.getElementById(placeholderId);
  if (placeholder === null) {
    return;
  }
  placeholder.insertAdjacentHTML("beforebegin", newHtml);
  placeholder.remove();
}

// Opens and closes the menu on phones
function setupMenuButton() {
  const menuButton = document.getElementById("menu-button");
  const menu = document.getElementById("site-menu");

  if (menuButton === null || menu === null) {
    return;
  }

  menuButton.addEventListener("click", () => {
    const menuIsOpen = menu.classList.toggle("nav--open");
    menuButton.setAttribute("aria-expanded", menuIsOpen);
    menuButton.setAttribute("aria-label", menuIsOpen ? "Close menu" : "Open menu");
  });
}

replacePlaceholder("site-header", buildHeader());
replacePlaceholder("site-footer", buildFooter());
setupMenuButton();
