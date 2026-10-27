"use strict";

const siteName = "Acity Lost and Found";

const menuLinks = [
  { text: "Home", file: "index.html" },
  { text: "Report Items", file: "report-type.html", currentFiles: ["report-type.html", "report.html", "review.html", "find-report.html"] },
  { text: "Browse Items", file: "catalog.html" },
  { text: "Item Details", file: "item.html" },
  { text: "Messages", file: "messages.html" },
  { text: "Safe Zones", file: "safe-zones.html" },
  { text: "Dashboard", file: "dashboard.html" }
];

function getCurrentFileName() {
  const fileName = window.location.pathname.split("/").pop();
  return fileName || "index.html";
}

function buildMenuLinks() {
  const currentFile = getCurrentFileName();

  return menuLinks
    .map((link) => {
      const currentFiles = link.currentFiles || [link.file];
      const currentAttribute = currentFiles.includes(currentFile) ? ' aria-current="page"' : "";
      return `<a href="${link.file}"${currentAttribute}>${link.text}</a>`;
    })
    .join("");
}

function buildHeader() {
  return `
    <header class="header">
      <div class="container header__inner">
        <a class="logo" href="index.html">${siteName}<span class="logo__dot" aria-hidden="true"></span></a>

        <button class="nav-toggle" id="menu-button" type="button"
                aria-expanded="false" aria-controls="site-menu" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>

        <nav class="nav" id="site-menu" aria-label="Primary navigation">
          ${buildMenuLinks()}
          <a class="btn btn--small" href="report-type.html">Report an item</a>
        </nav>
      </div>
    </header>
  `;
}

function buildFooter() {
  return `
    <footer class="footer">
      <h2>ACity Lost and Found</h2>
      <p>Helping students reconnect with their belongings.</p>
      <p>&copy; 2026 Academic City University. All rights reserved.</p>
    </footer>
  `;
}

function replacePlaceholder(placeholderId, newHtml) {
  const placeholder = document.getElementById(placeholderId);
  if (placeholder === null) {
    return;
  }
  placeholder.insertAdjacentHTML("beforebegin", newHtml);
  placeholder.remove();
}

function setupMenuButton() {
  const menuButton = document.getElementById("menu-button");
  const menu = document.getElementById("site-menu");

  if (menuButton === null || menu === null) {
    return;
  }

  function setMenuOpen(isOpen) {
    menu.classList.toggle("nav--open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  }

  menuButton.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
}

replacePlaceholder("site-header", buildHeader());
replacePlaceholder("site-footer", buildFooter());
setupMenuButton();
