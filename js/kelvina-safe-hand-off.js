(function () {
  const sidebar = document.getElementById("sidebar");
  const navButtons = Array.from(document.querySelectorAll(".sidebar__btn"));
  const searchInputs = Array.from(document.querySelectorAll("[data-location-search]"));
  const searchByControls = Array.from(document.querySelectorAll("[data-search-by]"));
  const hoursFilters = Array.from(document.querySelectorAll("[data-hours-filter]"));
  const nearestButtons = Array.from(document.querySelectorAll("[data-nearest-sort]"));
  const statusMessages = Array.from(document.querySelectorAll("[data-location-status]"));
  const lists = Array.from(document.querySelectorAll("[data-location-list]"));
  const hubCards = document.getElementById("hub-cards");
  const resultCount = document.getElementById("location-results-count");
  const mapViewButtons = Array.from(document.querySelectorAll("[data-map-view]"));
  const mapViews = Array.from(document.querySelectorAll(".campus-map__view"));
  const liveMapElement = document.getElementById("live-campus-map");
  const googleOrigin = document.getElementById("google-route-origin");
  const googleDestination = document.getElementById("google-route-destination");
  const googleTrackButton = document.getElementById("google-track-button");
  const googleLocationStatus = document.getElementById("google-location-status");
  const googleCoordinateReadout = document.getElementById("google-coordinate-readout");
  const nearestHubReadout = document.getElementById("nearest-hub-readout");
  const nearestHubDirections = document.getElementById("nearest-hub-directions");
  const googleDirectionsLink = document.getElementById("google-directions-link");
  let selectedGoogleHubId = "";
  let selectedGoogleOriginHubId = "";
  let locationWatchId = null;
  let locationFixTimeoutId = null;
  let liveMap = null;
  let liveUserMarker = null;
  let liveAccuracyCircle = null;
  let hasCenteredOnUser = false;
  const liveHubMarkers = new Map();

  // Replace this placeholder schedule with each location's confirmed hours.
  const placeholderHours = {
    openHour: 8,
    openMinute: 0,
    closeHour: 17,
    closeMinute: 0,
    label: "Placeholder hours: 8:00 AM-5:00 PM daily"
  };
  const locations = [
    { id: "west-gate", hubId: "west-gate", name: "West Gate Security", description: "Secondary entrance security post" },
    { id: "south-gate", hubId: "security-post", name: "South Gate Security", description: "Main entrance security desk" },
    { id: "hostel-a", hubId: "hostel-a", name: "Hostel A Reception", description: "Ground floor reception counter" },
    { id: "hostel-b", hubId: "hostel-b", name: "Hostel B Reception", description: "Ground floor reception desk" },
    { id: "sca", hubId: "sca-office", name: "SCA", description: "SCA main lobby area" },
    { id: "library", hubId: "library", name: "ACU Library Front Desk", description: "Library service desk" }
  ];
  const state = {
    query: "",
    searchBy: "name",
    hours: "all",
    nearest: false,
    userLocation: null,
    locating: false
  };

  function setStatus(message) {
    statusMessages.forEach(function (status) {
      status.textContent = message;
    });
  }

  function closePanels() {
    document.querySelectorAll(".sidebar__panel").forEach(function (panel) {
      panel.hidden = true;
    });
    navButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
    sidebar.classList.remove("is-open");
  }

  navButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const panel = document.getElementById("panel-" + button.dataset.panel);
      if (!panel) return;

      const alreadyOpen = sidebar.classList.contains("is-open") && !panel.hidden;
      closePanels();
      if (alreadyOpen) return;

      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
      sidebar.classList.add("is-open");
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closePanels();
  });

  function getHub(location) {
    if (typeof HUBS === "undefined") return null;
    return HUBS.find(function (hub) {
      return hub.id === location.hubId;
    }) || null;
  }

  function isOpenNow() {
    const campusTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Accra",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const currentHour = Number(campusTime.find(function (part) { return part.type === "hour"; }).value);
    const currentMinute = Number(campusTime.find(function (part) { return part.type === "minute"; }).value);
    const currentMinutes = currentHour * 60 + currentMinute;
    const openMinutes = placeholderHours.openHour * 60 + placeholderHours.openMinute;
    const closeMinutes = placeholderHours.closeHour * 60 + placeholderHours.closeMinute;
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  function distanceFromUser(location) {
    const hub = getHub(location);
    if (!state.userLocation || !hub || !Number.isFinite(hub.lat) || !Number.isFinite(hub.lng)) {
      return Number.POSITIVE_INFINITY;
    }

    const radians = Math.PI / 180;
    const latitudeDifference = (hub.lat - state.userLocation.latitude) * radians;
    const longitudeDifference = (hub.lng - state.userLocation.longitude) * radians;
    const startLatitude = state.userLocation.latitude * radians;
    const endLatitude = hub.lat * radians;
    const haversine = Math.sin(latitudeDifference / 2) ** 2
      + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDifference / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function isHubOpen(hub) {
  return window.HoursStatus ? HoursStatus.getHubStatus(hub).state !== "closed" : true;
}
  function switchMapView(viewName) {
    if (!document.getElementById("map-view-" + viewName)) viewName = "google";
    mapViews.forEach(function (view) {
      view.hidden = view.id !== "map-view-" + viewName;
    });
    mapViewButtons.forEach(function (button) {
      const isActive = button.dataset.mapView === viewName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    if (viewName === "live") {
      initializeLiveMap();
      window.setTimeout(function () {
        if (liveMap) liveMap.invalidateSize();
      }, 0);
    }
  }

  function initializeLiveMap() {
    if (!liveMapElement || liveMap) return;
    if (!window.L) {
      setGoogleStatus("The interactive map library did not load. Check your internet connection and reload this page.");
      return
    }

    liveMap = window.L.map(liveMapElement).setView([5.6887607, -0.2087597], 18);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(liveMap);

    if (typeof HUBS !== "undefined") {
      HUBS.forEach(function (hub) {
        if (!Number.isFinite(hub.lat) || !Number.isFinite(hub.lng)) return;
        const marker = window.L.circleMarker([hub.lat, hub.lng], {
          radius: 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#CC3634",
          fillOpacity: 1
        }).addTo(liveMap);
        marker.bindPopup('<strong class="leaflet-hub-marker">' + escapeHtml(hub.shortName || hub.name)
          + '</strong><br>' + escapeHtml(hub.location) + '<br><small>Approximate hub position</small>');
        marker.on("click", function () {
          selectGoogleHub(hub.id);
        });
        liveHubMarkers.set(hub.id, marker);
      });
    }

    if (state.userLocation) updateLiveUserMarker(state.userLocation);
    updateSelectedLiveHub();
  }

  function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
  }

  function updateSelectedLiveHub() {
    liveHubMarkers.forEach(function (marker, hubId) {
      const selected = hubId === selectedGoogleHubId;
      const nearest = Boolean(state.userLocation) && getNearestHub()?.hub.id === hubId;
      marker.setStyle({
        radius: selected ? 11 : 8,
        fillColor: selected ? "#A92321" : nearest ? "#1E8A4F" : "#CC3634"
      });
    });
  }

  function getNearestHub() {
    if (!state.userLocation || typeof HUBS === "undefined") return null;
    return HUBS.reduce(function (nearest, hub) {
      if (!Number.isFinite(hub.lat) || !Number.isFinite(hub.lng)) return nearest;
      const distance = distanceFromUser({ hubId: hub.id });
      return !nearest || distance < nearest.distance ? { hub: hub, distance: distance } : nearest;
    }, null);
  }

  function updateNearestHubReadout() {
    const nearest = getNearestHub();
    if (!nearest) {
      if (nearestHubReadout) nearestHubReadout.textContent = "Start live tracking to find the nearest hub.";
      if (nearestHubDirections) nearestHubDirections.disabled = true;
      return;
    }

    const distance = nearest.distance < 1
      ? Math.round(nearest.distance * 1000) + " m"
      : nearest.distance.toFixed(2) + " km";
    if (nearestHubReadout) {
      nearestHubReadout.textContent = "Nearest hub: " + (nearest.hub.shortName || nearest.hub.name)
        + " · about " + distance + " away in a straight line.";
    }
    if (nearestHubDirections) nearestHubDirections.disabled = false;
    updateSelectedLiveHub();
  }

  function updateLiveUserMarker(position) {
    if (!liveMap || !window.L || !position) return;
    const point = [position.latitude, position.longitude];
    const accuracy = Number.isFinite(position.accuracy) ? Math.max(0, position.accuracy) : 0;

    if (!liveUserMarker) {
      liveUserMarker = window.L.marker(point, {
        title: "Your live location",
        alt: "You",
        icon: window.L.divIcon({
          className: "live-user-marker-icon",
          html: '<span class="live-user-marker">You</span>',
          iconSize: [48, 32],
          iconAnchor: [24, 32],
          popupAnchor: [0, -32]
        })
      }).addTo(liveMap).bindPopup('<strong class="leaflet-user-marker">You are here</strong>');
      liveAccuracyCircle = window.L.circle(point, {
        radius: accuracy,
        color: "#1463d6",
        weight: 1,
        fillColor: "#3388ff",
        fillOpacity: 0.15
      }).addTo(liveMap);
    } else {
      liveUserMarker.setLatLng(point);
      liveAccuracyCircle.setLatLng(point);
      liveAccuracyCircle.setRadius(accuracy);
    }

    liveMap.setView(point, hasCenteredOnUser ? liveMap.getZoom() : 19, { animate: hasCenteredOnUser });
    hasCenteredOnUser = true;
  }

  function clearLiveUserMarker() {
    if (!liveMap) return;
    if (liveUserMarker) liveMap.removeLayer(liveUserMarker);
    if (liveAccuracyCircle) liveMap.removeLayer(liveAccuracyCircle);
    liveUserMarker = null;
    liveAccuracyCircle = null;
    hasCenteredOnUser = false;
    updateNearestHubReadout();
  }

  mapViewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      switchMapView(button.dataset.mapView);
    });
  });

  function getSelectedGoogleHub() {
    if (typeof HUBS === "undefined" || !selectedGoogleHubId) return null;
    return HUBS.find(function (hub) { return hub.id === selectedGoogleHubId; }) || null;
  }

  function setGoogleStatus(message) {
    if (googleLocationStatus) googleLocationStatus.textContent = message;
  }

  function updateGoogleDirections(position) {
    if (!googleDirectionsLink) return;
    const hub = getSelectedGoogleHub();
    if (!hub) {
      googleDirectionsLink.href = "#";
      googleDirectionsLink.setAttribute("aria-disabled", "true");
      return;
    }

    const params = new URLSearchParams({ api: "1" });
    const originHub = typeof HUBS === "undefined"
      ? null
      : HUBS.find(function (candidate) { return candidate.id === selectedGoogleOriginHubId; });
    if (originHub) {
      params.set("origin", originHub.lat + "," + originHub.lng);
    } else if (position) {
      params.set("origin", position.latitude + "," + position.longitude);
    } else {
      googleDirectionsLink.href = "#";
      googleDirectionsLink.setAttribute("aria-disabled", "true");
      return;
    }
    params.set("destination", hub.lat + "," + hub.lng);
    params.set("travelmode", "walking");
    googleDirectionsLink.href = "https://www.google.com/maps/dir/?" + params.toString();
    googleDirectionsLink.setAttribute("aria-disabled", "false");
  }

  function populateGoogleOrigins() {
    if (!googleOrigin || typeof HUBS === "undefined") return;
    HUBS.forEach(function (hub) {
      const option = document.createElement("option");
      option.value = hub.id;
      option.textContent = hub.shortName || hub.name;
      googleOrigin.appendChild(option);
    });
  }

  function populateGoogleDestinations() {
    if (!googleDestination || typeof HUBS === "undefined") return;
    HUBS.forEach(function (hub) {
      const option = document.createElement("option");
      option.value = hub.id;
      option.textContent = hub.shortName || hub.name;
      googleDestination.appendChild(option);
    });
  }

  function selectGoogleHub(hubId) {
    if (typeof HUBS === "undefined") return;
    const hub = HUBS.find(function (candidate) { return candidate.id === hubId; });
    if (!hub) return;
    selectedGoogleHubId = hub.id;
    if (googleDestination) googleDestination.value = hub.id;
    updateSelectedLiveHub();
    if (liveMap) liveMap.setView([hub.lat, hub.lng], Math.max(liveMap.getZoom(), 18));

    if (selectedGoogleOriginHubId) {
      updateGoogleDirections(state.userLocation);
      setGoogleStatus("Starting point and destination selected. Open walking directions to see the route.");
    } else if (state.userLocation) {
      updateGoogleDirections(state.userLocation);
      setGoogleStatus("Your device location is the starting point. Open walking directions for the route to this hub.");
    } else {
      updateGoogleDirections(null);
      setGoogleStatus("Destination selected. Start live tracking to use your current position as the starting point, or choose a campus hub above.");
    }
  }

  function stopGoogleTracking(message) {
    if (locationFixTimeoutId !== null) {
      window.clearTimeout(locationFixTimeoutId);
      locationFixTimeoutId = null;
    }
    if (locationWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchId);
    }
    locationWatchId = null;
    state.userLocation = null;
    state.nearest = false;
    clearLiveUserMarker();
    if (googleTrackButton) googleTrackButton.textContent = "Start live tracking";
    if (googleCoordinateReadout) googleCoordinateReadout.textContent = "Latitude: — · Longitude: — · Accuracy: —";
    syncControls();
    renderLists();
    if (selectedGoogleHubId) updateGoogleDirections(null);
    setGoogleStatus(message || (selectedGoogleOriginHubId
      ? "Live location stopped. The selected campus hub remains the route starting point."
      : "Live location stopped. Your position is no longer being updated."));
  }

  function startGoogleTracking() {
    if (!window.isSecureContext) {
      setGoogleStatus("Live location requires a secure page. Open this site from localhost or HTTPS, then try again.");
      return;
    }
    if (!navigator.geolocation) {
      setGoogleStatus("This browser does not support live location.");
      return;
    }

    if (locationWatchId !== null) {
      stopGoogleTracking();
      return;
    }

    switchMapView("live");
    initializeLiveMap();
    setGoogleStatus("Waiting for a GPS fix. Allow location access and make sure device location services are on.");
    if (googleTrackButton) googleTrackButton.textContent = "Stop live tracking";
    locationFixTimeoutId = window.setTimeout(function () {
      locationFixTimeoutId = null;
      if (!state.userLocation) {
        stopGoogleTracking("No GPS fix received within 60 seconds. Check browser Location permission and device location services, then try again outdoors or near a window.");
      }
    }, 60000);

    try {
      locationWatchId = navigator.geolocation.watchPosition(
        function (position) {
          if (locationFixTimeoutId !== null) {
            window.clearTimeout(locationFixTimeoutId);
            locationFixTimeoutId = null;
          }
          state.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          updateLiveUserMarker(state.userLocation);
          if (googleCoordinateReadout) {
            googleCoordinateReadout.textContent = "Latitude: " + state.userLocation.latitude.toFixed(6)
              + " · Longitude: " + state.userLocation.longitude.toFixed(6)
              + " · Accuracy: ±" + Math.round(state.userLocation.accuracy) + " m";
          }
          if (selectedGoogleHubId) updateGoogleDirections(state.userLocation);
          setGoogleStatus("Your live position is shown on the interactive map; reported accuracy is ±"
            + Math.round(state.userLocation.accuracy) + " m."
            + (selectedGoogleHubId ? " Use walking directions for the route to your selected hub." : " Select a hub for walking directions."));
          updateNearestHubReadout();
          switchMapView("live");
          syncControls();
          renderLists();
        },
        function (error) {
          if (error.code === error.PERMISSION_DENIED) {
            stopGoogleTracking("Location permission was denied. Allow access in your browser settings, then try again.");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setGoogleStatus("GPS signal is unavailable. Tracking will keep trying; check device location services or move outdoors.");
          } else if (error.code === error.TIMEOUT) {
            setGoogleStatus("GPS is taking longer than expected. Tracking will keep trying; wait for a location fix.");
          } else {
            stopGoogleTracking("Could not read your current location: " + error.message);
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 60000 }
      );
    } catch (error) {
      stopGoogleTracking("Could not start location tracking: " + error.message);
    }
  }

  if (googleDestination) {
    populateGoogleOrigins();
    populateGoogleDestinations();
    updateGoogleDirections(state.userLocation);
    if (googleDirectionsLink) {
      googleDirectionsLink.addEventListener("click", function (event) {
        if (!selectedGoogleHubId) {
          event.preventDefault();
          setGoogleStatus("Choose a destination before opening walking directions.");
          return;
        }

        if (selectedGoogleOriginHubId || state.userLocation) return;

        event.preventDefault();
        if (!window.isSecureContext || !navigator.geolocation) {
          setGoogleStatus("To get directions from your current location, open this page over HTTPS or localhost and allow location access.");
          return;
        }

        const directionsWindow = window.open("about:blank", "_blank");
        if (!directionsWindow) {
          setGoogleStatus("Allow pop-ups for this page, then click the directions link again.");
          return;
        }
        directionsWindow.opener = null;
        setGoogleStatus("Getting your current location before opening walking directions...");
        navigator.geolocation.getCurrentPosition(
          function (position) {
            state.userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            initializeLiveMap();
            updateLiveUserMarker(state.userLocation);
            if (googleCoordinateReadout) {
              googleCoordinateReadout.textContent = "Latitude: " + state.userLocation.latitude.toFixed(6)
                + " · Longitude: " + state.userLocation.longitude.toFixed(6)
                + " · Accuracy: ±" + Math.round(state.userLocation.accuracy) + " m";
            }
            updateGoogleDirections(state.userLocation);
            updateNearestHubReadout();
            syncControls();
            renderLists();
            setGoogleStatus("Your location is ready. Opening the walking route in Google Maps...");
            directionsWindow.location.replace(googleDirectionsLink.href);
          },
          function (error) {
            directionsWindow.close();
            if (error.code === error.PERMISSION_DENIED) {
              setGoogleStatus("Location permission was denied. Allow location access, then click the directions link again.");
            } else if (error.code === error.TIMEOUT) {
              setGoogleStatus("Could not get a GPS fix in time. Try again outdoors or near a window.");
            } else {
              setGoogleStatus("Your location is unavailable. Check device location services and try again.");
            }
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 60000 }
        );
      });
    }
    if (googleOrigin) {
      googleOrigin.addEventListener("change", function () {
        selectedGoogleOriginHubId = googleOrigin.value;
        if (selectedGoogleHubId) updateGoogleDirections(state.userLocation);
        if (selectedGoogleOriginHubId) {
          setGoogleStatus("Starting point selected. Choose a destination to prepare walking directions.");
        } else if (state.userLocation) {
          setGoogleStatus("Your device location will be used as the starting point.");
        } else {
          setGoogleStatus("Start live tracking to use your current position as the starting point.");
        }
      });
    }
    googleDestination.addEventListener("change", function () {
      if (googleDestination.value) selectGoogleHub(googleDestination.value);
      else {
        selectedGoogleHubId = "";
        updateGoogleDirections(state.userLocation);
        updateSelectedLiveHub();
        setGoogleStatus("Choose a starting point and destination to prepare directions.");
      }
    });
  }

  if (nearestHubDirections) {
    nearestHubDirections.addEventListener("click", function () {
      const nearest = getNearestHub();
      if (!nearest) return;
      selectGoogleHub(nearest.hub.id);
      setGoogleStatus("Nearest hub selected. Open walking directions to route from your live location.");
    });
  }

  if (googleTrackButton) {
    googleTrackButton.addEventListener("click", startGoogleTracking);
  }

  window.addEventListener("beforeunload", function () {
    if (locationWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(locationWatchId);
    }
  });

  function showGoogleRouteTo(hubId) {
    switchMapView("live");
    selectGoogleHub(hubId);
    if (!state.userLocation && !selectedGoogleOriginHubId) {
      setGoogleStatus("Destination selected. Start live tracking to get directions from your current location.");
    }
  }

  function createCard(location, open) {
    const card = document.createElement("article");
    card.className = "location-card";

    const photoLink = document.createElement("a");
    photoLink.className = "location-photo-link";
    photoLink.href = officialCampusPage;
    photoLink.target = "_blank";
    photoLink.rel = "noopener noreferrer";
    photoLink.setAttribute("aria-label");

    const photo = document.createElement("img");
    photo.className = "location-photo";
    photo.src = officialCampusPhoto;
    photo.alt = "Academic City campus ";
    photo.loading = "lazy";
    photoLink.appendChild(photo);

    const content = document.createElement("div");
    content.className = "location-card__content";

    const title = document.createElement("strong");
    title.textContent = " " + location.name;

    const description = document.createElement("span");
    description.textContent = location.description;

    const hours = document.createElement("span");
    hours.className = "location-hours";
    hours.textContent = placeholderHours.label;

    const status = document.createElement("span");
    status.className = "location-open-status";
    status.textContent = open ? "Open now (placeholder hours)" : "Closed now (placeholder hours)";
    status.dataset.open = String(open);

    content.append(title, description, hours, status);
    card.append(photoLink, content);
    return card;
  }

  function renderLists() {
    if (typeof HUBS === "undefined") {
      console.error("HUBS is undefined; hand-off locations cannot be display");
      setStatus("Location data could not be loaded.");
      return;
    }

    const open = isOpenNow();
    let visibleLocations = locations.filter(function (location) {
      const searchText = state.searchBy === "name"
        ? location.name
        : state.searchBy === "description"
          ? location.description
          : state.searchBy === "location"
            ? location.description
            : location.name + " " + location.description;
      const queryMatches = searchText.toLowerCase().includes(state.query);
      const hoursMatch = state.hours === "all"
        || (state.hours === "open" && open)
        || (state.hours === "closed" && !open);
      return queryMatches && hoursMatch;
    });

    if (state.nearest) {
      visibleLocations = visibleLocations.slice().sort(function (left, right) {
        return distanceFromUser(left) - distanceFromUser(right);
      });
    }

    lists.forEach(function (list) {
      list.replaceChildren();
      if (visibleLocations.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "location-empty";
        emptyMessage.textContent = "No hand-off locations match your search and hours filter.";
        list.appendChild(emptyMessage);
        return;
      }

      visibleLocations.forEach(function (location) {
        const hub = getHub(location);
        if (!hub) {
          console.error("Missing hub data for hand-off location: " + location.hubId);
          return;
        }
        list.appendChild(createCard(location, open));
      });
    });

    if (hubCards) {
      const cards = Array.from(hubCards.querySelectorAll(".hub-card"));
      const visibleCards = [];
      cards.forEach(function (card) {
        const hub = HUBS.find(function (item) { return item.id === card.dataset.hubId; });
        if (!hub) {
          card.hidden = true;
          return;
        }

        const searchableText = {
          name: hub.name + " " + hub.shortName,
          description: hub.details,
          location: hub.location,
          all: [hub.name, hub.shortName, hub.details, hub.location].join(" ")
        }[state.searchBy] || hub.name;
        const queryMatches = searchableText.toLowerCase().includes(state.query);
        const hubIsOpen = isHubOpen(hub);
        const hoursMatch = state.hours === "all"
          || (state.hours === "open" && hubIsOpen)
          || (state.hours === "closed" && !hubIsOpen);
        card.hidden = !(queryMatches && hoursMatch);
        if (!card.hidden) visibleCards.push({ card: card, hub: hub });
      });

      if (state.nearest) {
        visibleCards.sort(function (left, right) {
          return distanceFromUser({ hubId: left.hub.id }) - distanceFromUser({ hubId: right.hub.id });
        });
        visibleCards.forEach(function (entry) { hubCards.appendChild(entry.card); });
      }
      if (resultCount) {
        resultCount.textContent = visibleCards.length + " of " + cards.length + " locations shown.";
      }
    }
  }

  function syncControls() {
    searchInputs.forEach(function (input) {
      if (input.value !== state.query) input.value = state.query;
    });
    searchByControls.forEach(function (control) {
      control.value = state.searchBy;
    });
    hoursFilters.forEach(function (filter) {
      filter.value = state.hours;
    });
    nearestButtons.forEach(function (button) {
      button.setAttribute("aria-pressed", String(state.nearest));
      button.disabled = state.locating;
      button.textContent = state.locating ? "Finding your location..." : "Closest to me";
    });
  }

  searchInputs.forEach(function (input) {
    input.addEventListener("input", function () {
      state.query = input.value.trim().toLowerCase();
      syncControls();
      renderLists();
    });
  });

  window.showTrailTo = showGoogleRouteTo;
  window.showGoogleRouteTo = showGoogleRouteTo;

  searchByControls.forEach(function (control) {
    control.addEventListener("change", function () {
      state.searchBy = control.value;
      syncControls();
      renderLists();
    });
  });

  hoursFilters.forEach(function (filter) {
    filter.addEventListener("change", function () {
      state.hours = filter.value;
      syncControls();
      renderLists();
    });
  });

  nearestButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (state.nearest) {
        state.nearest = false;
        syncControls();
        renderLists();
        setStatus("Showing locations in their original order.");
        return;
      }

      if (state.userLocation) {
        state.nearest = true;
        syncControls();
        renderLists();
        setStatus("Sorted by distance from your location. Campus coordinates are approximate placeholders.");
        return;
      }

      if (!navigator.geolocation) {
        setStatus("Your browser does not support location access, so nearest-first sorting is unavailable.");
        return;
      }

      state.locating = true;
      syncControls();
      setStatus("Requesting your location to sort nearby hand-off points...");
      navigator.geolocation.getCurrentPosition(
        function (position) {
          state.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          state.nearest = true;
          state.locating = false;
          syncControls();
          renderLists();
          setStatus("Sorted by distance from your location. Campus coordinates are approximate placeholders.");
        },
        function (error) {
          state.locating = false;
          syncControls();
          if (error.code === error.PERMISSION_DENIED) {
            setStatus("Location permission was denied. Allow location access to sort by closest.");
          } else if (error.code === error.TIMEOUT) {
            setStatus("The location request timed out. Try the closest filter again.");
          } else {
            setStatus("Your location is unavailable. Check your device settings and try again.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  });

  switchMapView("live");
  syncControls();
  renderLists();
  window.setInterval(renderLists, 60000);
})();
