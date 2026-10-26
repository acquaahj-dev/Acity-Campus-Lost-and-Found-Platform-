/* 
   Group 6 – User Activity Dashboard
   Role 5: Shared Mock Data
   File:   mock-data.js 

   There is no backend in this project, so every Group 6 script reads its
   data from the two globals created here:

       window.dashboardData     -> the raw data (users, items, claims, messages)
       window.dashboardHelpers  -> small functions to read / format that data

   AGREED ITEM FIELDS (shared with Groups 2 and 3, do not rename):
       id, title, type ("lost" | "found"), status ("Open" | "Claimed" | "Resolved"),
       date (YYYY-MM-DD), location, image
   EXTRA FIELDS used only inside Group 6:
       items:    reportedBy  -> a user id from `users`
       claims:   id, itemId, claimant (user id), status ("Pending" | "Approved" | "Rejected"),
                 date, details
       messages: id, itemId, from (user id), preview, date, unread

   PRIVACY: the platform is built around anonymous contact, so people are
   shown by an alias ("Anonymous Student A"), never by a real name, phone
   number or email address.
    */

(function () {
  "use strict";

  /*  The raw mock data  */

  const data = {
    // Pretend login: the user who is "using" the dashboard right now.
    currentUserId: "u1",

    /* 
           HOOKS FOR OTHER GROUPS (Group 8: change a path HERE and every
           link in the dashboard updates. Nothing else needs editing.)
            */
    links: {
      itemDetails: "item-details.html", // Group 3 – page receives ?id=ITEM_ID
      messages: "messages.html", // Group 4 – page may read ?item=ITEM_ID
      reportLost: "report.html", // Group 1 – lost item form
      reportFound: "found.html", // Group 1 – found item form
      browseItems: "items.html", // Group 2 – search & filter catalog
    },

    users: [
      { id: "u1", alias: "You" },
      { id: "u2", alias: "Anonymous Student A" },
      { id: "u3", alias: "Anonymous Student B" },
      { id: "u4", alias: "Anonymous Student C" },
      { id: "u5", alias: "Anonymous Student D" },
      { id: "u6", alias: "Anonymous Student E" },
    ],

    /* 
           ITEMS
           HOOK (Groups 1 and 2): when the shared item store exists, replace
           this array with the shared data. Keep the field names above.
            */
    items: [
      // Reported by the current user (u1)  these appear on the dashboard
      {
        id: 1,
        title: "Black laptop bag",
        type: "lost",
        status: "Open",
        date: "2026-10-20",
        location: "Main Library, 2nd floor",
        image: "images/items/laptop-bag.png",
        reportedBy: "u1",
      },
      {
        id: 2,
        title: "Brown leather wallet",
        type: "found",
        status: "Claimed",
        date: "2026-10-19",
        location: "Science Block entrance",
        image: "images/items/wallet.png",
        reportedBy: "u1",
      },
      {
        id: 3,
        title: "Blue water bottle",
        type: "found",
        status: "Resolved",
        date: "2026-10-12",
        location: "Sports Complex",
        image: "images/items/water-bottle.png",
        reportedBy: "u1",
      },
      {
        id: 4,
        title: "Student ID card",
        type: "lost",
        status: "Claimed",
        date: "2026-10-21",
        location: "Cafeteria",
        image: "images/items/id-card.png",
        reportedBy: "u1",
      },
      {
        id: 5,
        title: "Scientific calculator",
        type: "found",
        status: "Open",
        date: "2026-10-22",
        location: "Lecture Hall B",
        image: "images/items/calculator.png",
        reportedBy: "u1",
      },
      {
        id: 6,
        title: "White wireless earbuds",
        type: "lost",
        status: "Resolved",
        date: "2026-10-08",
        location: "Bus stop near Gate 2",
        image: "images/items/earbuds.png",
        reportedBy: "u1",
      },

      // Reported by other users only used to show claims the user made
      {
        id: 7,
        title: "Set of house keys",
        type: "found",
        status: "Open",
        date: "2026-10-23",
        location: "Admin Block",
        image: "images/items/keys.png",
        reportedBy: "u2",
      },
      {
        id: 8,
        title: "Grey hoodie",
        type: "found",
        status: "Claimed",
        date: "2026-10-18",
        location: "Computer Lab 1",
        image: "images/items/hoodie.png",
        reportedBy: "u3",
      },
      {
        id: 9,
        title: "Silver smartphone",
        type: "lost",
        status: "Open",
        date: "2026-10-22",
        location: "Student Union Building",
        image: "images/items/phone.png",
        reportedBy: "u4",
      },
      {
        id: 10,
        title: "Red notebook",
        type: "found",
        status: "Resolved",
        date: "2026-10-10",
        location: "Library reading room",
        image: "images/items/notebook.png",
        reportedBy: "u5",
      },
    ],

    /* 
           CLAIMS both claims made ON the user's items and claims the user
           made on other people's items.
            */
    claims: [
      {
        id: "c1",
        itemId: 2,
        claimant: "u2",
        status: "Pending",
        date: "2026-10-20",
        details:
          "Says the wallet holds a student card with her name and a GHS 20 note.",
      },
      {
        id: "c2",
        itemId: 3,
        claimant: "u3",
        status: "Approved",
        date: "2026-10-13",
        details:
          "Described the sticker on the bottle and collected it from the security desk.",
      },
      {
        id: "c3",
        itemId: 4,
        claimant: "u5",
        status: "Pending",
        date: "2026-10-22",
        details:
          "Says he found the ID card near the cafeteria tray return and can hand it in.",
      },
      {
        id: "c4",
        itemId: 5,
        claimant: "u4",
        status: "Rejected",
        date: "2026-10-22",
        details:
          "Could not describe the calculator model or the name written on the back.",
      },
      {
        id: "c5",
        itemId: 6,
        claimant: "u6",
        status: "Approved",
        date: "2026-10-09",
        details: "Found the earbuds on the bus stop bench and returned them.",
      },
      {
        id: "c6",
        itemId: 8,
        claimant: "u1",
        status: "Pending",
        date: "2026-10-21",
        details:
          "My hoodie: grey with a small tear on the left cuff and my initials inside the collar.",
      },
      {
        id: "c7",
        itemId: 10,
        claimant: "u1",
        status: "Approved",
        date: "2026-10-11",
        details:
          "My red notebook with my course notes; matched the name on the first page.",
      },
    ],

    /* 
           MESSAGES a summary only. The full chat lives on Group 4's page.
            */
    messages: [
      {
        id: "m1",
        itemId: 2,
        from: "u2",
        preview: "Hi, I think that wallet is mine. Can we meet at the library?",
        date: "2026-10-23",
        unread: true,
      },
      {
        id: "m2",
        itemId: 4,
        from: "u5",
        preview:
          "I can drop the ID card at the security desk tomorrow morning.",
        date: "2026-10-22",
        unread: true,
      },
      {
        id: "m3",
        itemId: 8,
        from: "u3",
        preview: "Thanks, I will check the hoodie details and get back to you.",
        date: "2026-10-21",
        unread: false,
      },
      {
        id: "m4",
        itemId: 10,
        from: "u5",
        preview: "Notebook is ready for pickup at the library desk.",
        date: "2026-10-11",
        unread: false,
      },
    ],
  };

  /*  Helper functions shared by every Group 6 script  */

  const helpers = {
    /** Anonymous display name for a user id ("You" for the current user). */
    getDisplayName(userId) {
      if (userId === data.currentUserId) return "You";
      const user = data.users.find((u) => u.id === userId);
      return user ? user.alias : "Anonymous Student";
    },

    /** Find one item by id (works with "1" or 1). Returns null if missing. */
    getItem(itemId) {
      return (
        data.items.find((item) => String(item.id) === String(itemId)) || null
      );
    },

    /** Items reported by the current user, newest first. */
    getMyItems() {
      return data.items
        .filter((item) => item.reportedBy === data.currentUserId)
        .sort((a, b) => b.date.localeCompare(a.date));
    },

    /** Claims other people made on the current user's items. */
    getClaimsOnMyItems() {
      return data.claims.filter((claim) => {
        const item = helpers.getItem(claim.itemId);
        return (
          item &&
          item.reportedBy === data.currentUserId &&
          claim.claimant !== data.currentUserId
        );
      });
    },

    /** Claims the current user made on other people's items. */
    getClaimsMadeByMe() {
      return data.claims.filter(
        (claim) => claim.claimant === data.currentUserId,
      );
    },

    /** How many messages are still unread. */
    getUnreadCount() {
      return data.messages.filter((message) => message.unread).length;
    },

    /** "2026-10-20" -> "20 Oct 2026". Falls back to the original text. */
    formatDate(isoDate) {
      const date = new Date(isoDate + "T00:00:00");
      if (Number.isNaN(date.getTime())) return isoDate || "";
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },

    /** Link to Group 3's item detail page. */
    itemDetailsUrl(itemId) {
      return data.links.itemDetails + "?id=" + encodeURIComponent(itemId);
    },

    /** Link to Group 4's messaging page. */
    messagesUrl(itemId) {
      return itemId === undefined
        ? data.links.messages
        : data.links.messages + "?item=" + encodeURIComponent(itemId);
    },
  };

  window.dashboardData = data;
  window.dashboardHelpers = helpers;
})();
