"use strict";

(function () {
  const REPORTS_KEY = "lostFoundReports";
  const ERROR_ID = "platform-sync-error";

  function showSyncError(message) {
    let notice = document.getElementById(ERROR_ID);
    if (!notice) {
      notice = document.createElement("p");
      notice.id = ERROR_ID;
      notice.className = "platform-sync-error";
      notice.setAttribute("role", "alert");
      const dashboard = document.querySelector("#dashboard");
      if (dashboard) {
        dashboard.prepend(notice);
      }
    }
    if (notice) {
      notice.textContent = message;
    }
    console.error(message);
  }

  try {
    const saved = window.localStorage.getItem(REPORTS_KEY);
    const reports = saved === null ? [] : JSON.parse(saved);
    if (!Array.isArray(reports)) {
      throw new Error("Saved reports are not a list.");
    }

    for (const report of reports) {
      if (!report || typeof report.referenceId !== "string") {
        continue;
      }
      const location = report.location === "Other" && report.otherLocation
        ? `Other: ${report.otherLocation}`
        : report.location || "";
      window.dashboardData.items.push({
        id: report.referenceId,
        title: report.itemName || "Unnamed item",
        type: report.reportType === "found" ? "found" : "lost",
        status: report.status || "Open",
        date: report.date || "",
        location,
        image: report.photo || "",
        reportedBy: window.dashboardData.currentUserId
      });
    }
  } catch (error) {
    showSyncError("Saved reports could not be loaded into your dashboard. Existing demo items are still available.");
  }

  document.addEventListener("item-status-changed", (event) => {
    const { id, to } = event.detail || {};
    if (typeof id !== "string" || !id.startsWith("LF-")) {
      return;
    }

    try {
      const saved = window.localStorage.getItem(REPORTS_KEY);
      const reports = saved === null ? [] : JSON.parse(saved);
      if (!Array.isArray(reports)) {
        throw new Error("Saved reports are not a list.");
      }

      const report = reports.find((item) => item.referenceId === id);
      if (!report) {
        throw new Error("The matching report no longer exists.");
      }

      report.status = to;
      window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
    } catch (error) {
      showSyncError("The dashboard status changed, but the report could not be synchronized to browser storage. Check browser storage and try again.");
    }
  });
})();
