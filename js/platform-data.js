"use strict";

(function () {
  function readReports() {
    if (typeof window.getAllReports === "function") {
      return window.getAllReports();
    }

    try {
      const saved = window.localStorage.getItem("lostFoundReports");
      const reports = saved === null ? [] : JSON.parse(saved);
      if (!Array.isArray(reports)) {
        throw new Error("The saved reports are not a list.");
      }
      return reports;
    } catch (error) {
      throw new Error("Saved reports could not be loaded from this browser.");
    }
  }

  function reportToCatalogItem(report) {
    const categoryMap = {
      "Wallet or ID cards": "Documents",
      "Bags and luggage": "Bags",
      "Books": "Stationery"
    };

    return {
      id: report.referenceId,
      referenceId: report.referenceId,
      name: report.itemName,
      category: categoryMap[report.category] || report.category || "Other",
      itemType: report.category || "Item",
      colour: "",
      status: report.reportType === "found" ? "Found" : "Lost",
      reportStatus: report.status || "Open",
      location: typeof window.getLocationText === "function"
        ? window.getLocationText(report)
        : report.location || "",
      dateReported: report.date,
      description: report.description || "",
      photo: report.photo || "",
      image: report.photo || "",
      icon: "📦",
      reportType: report.reportType || "lost",
      handoffLocation: report.handoffLocation || ""
    };
  }

  function getMockItems() {
    return Array.isArray(window.CATALOG_MOCK_ITEMS)
      ? window.CATALOG_MOCK_ITEMS.map((item) => ({ ...item }))
      : [];
  }

  function getAllItems() {
    return [
      ...getMockItems(),
      ...readReports().map(reportToCatalogItem)
    ];
  }

  window.PlatformData = Object.freeze({
    getAllItems,
    getAllReports: readReports,
    getItemById(id) {
      return getAllItems().find((item) => String(item.id) === String(id)) || null;
    },
    reportToCatalogItem
  });
})();
