"use strict";

const siteName = "Acity Lost and Found";

const menuLinks = [
  { text: "Home", file: "index.html" },
  { text: "Report Items", file: "report-type.html" },
  { text: "Browse Items", file: "catalog.html" },
  { text: "Item Details", file: "items.html" },
  { text: "Messages", file: "chat.html" },
  { text: "Collection Points", file: "safe-zones.html" },
  { text: "Dashboard", file: "dashboard.html" }
];

const reportButtonFile = "report-type.html";

// Finds the name of the page we are on, for example "report.html"
function getCurrentFileName() {
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
    <header class="header">
      <div class="container header__inner">
        <a class="logo" href="index.html">${siteName}<span class="logo__dot"></span></a>

        <button class="nav-toggle" id="menu-button" type="button"
                aria-expanded="false" aria-controls="site-menu" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>

        <nav class="nav" id="site-menu" aria-label="Main">
          ${buildMenuLinks()}
          <a class="btn btn--small" href="$
        </nav>
      </div>
    </header>
  `;
}

function buildFooter() {
  return `
    <footer class="footer">
    <h2>ACity Lost and Found</h2>
        <p>Helping Students reconnect with their belongings.</p>
        <p>&copy; 2026 Academic City University. All rights reserved.</p>
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
