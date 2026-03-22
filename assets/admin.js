(function () {
  "use strict";

  const ADMIN_USER_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  const ADMIN_PASS_HASH = "c0142e6db7f93cb583bf4b08b60944d799f06418ed9d5b4633850a259f80b25d";
  const ADMIN_USER_PLAIN = "admin";
  const ADMIN_PASS_PLAIN = "Z@8!kR$4vQ#Lm7^xP2cF5^X@q!9L#rT2$Zp&V7mK";

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_MINUTES = 10;
  const SESSION_TIMEOUT_MINUTES = 45;

  const HAS_SUBTLE_CRYPTO = Boolean(window.crypto && window.crypto.subtle && window.TextEncoder);

  function createCardTitle(text) {
    const title = document.createElement("h4");
    title.textContent = text || "Untitled";
    return title;
  }

  async function sha256Hex(value) {
    if (HAS_SUBTLE_CRYPTO) {
      const bytes = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }

    // Fallback for restrictive local environments where SubtleCrypto is unavailable.
    let hash = 0;
    const input = String(value);
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return `fallback_${Math.abs(hash)}`;
  }

  async function verifyCredentials(username, password) {
    if (!HAS_SUBTLE_CRYPTO) {
      return username === ADMIN_USER_PLAIN && password === ADMIN_PASS_PLAIN;
    }

    const [usernameHash, passwordHash] = await Promise.all([sha256Hex(username), sha256Hex(password)]);
    return usernameHash === ADMIN_USER_HASH && passwordHash === ADMIN_PASS_HASH;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const utils = window.roveUtils;
    const places = Array.isArray(window.ROVE_PLACES) ? window.ROVE_PLACES : [];
    if (!utils) return;

    const loginSection = document.getElementById("loginSection");
    const managerSection = document.getElementById("managerSection");
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const loginError = document.getElementById("loginError");
    const loginHint = document.getElementById("loginHint");
    const togglePassword = document.getElementById("togglePassword");

    const logoutBtn = document.getElementById("logoutBtn");
    const placeSelect = document.getElementById("placeSelect");
    const placeFilter = document.getElementById("placeFilter");
    const placeLink = document.getElementById("placeLink");
    const mediaForm = document.getElementById("mediaForm");
    const mediaType = document.getElementById("mediaType");
    const mediaTitle = document.getElementById("mediaTitle");
    const mediaUrl = document.getElementById("mediaUrl");
    const mediaHighlight = document.getElementById("mediaHighlight");
    const mediaPin = document.getElementById("mediaPin");
    const mediaDescription = document.getElementById("mediaDescription");
    const previewList = document.getElementById("previewList");
    const clearPlaceMedia = document.getElementById("clearPlaceMedia");
    const placeStats = document.getElementById("placeStats");
    const lastLoginAt = document.getElementById("lastLoginAt");

    const sessionKey = utils.keys.adminSession;
    const lockKey = utils.keys.adminLock;
    const auditKey = utils.keys.adminAudit;

    let lockTimer = null;
    let sessionTimer = null;

    function readLock() {
      return utils.readJSON(lockKey, { failedCount: 0, lockUntil: 0 });
    }

    function writeLock(state) {
      utils.writeJSON(lockKey, state);
    }

    function clearLock() {
      writeLock({ failedCount: 0, lockUntil: 0 });
    }

    function getRemainingLockMs() {
      const lock = readLock();
      if (!lock.lockUntil) return 0;
      return Math.max(0, Number(lock.lockUntil) - Date.now());
    }

    function isLocked() {
      return getRemainingLockMs() > 0;
    }

    function updateLoginHint() {
      if (!loginHint) return;

      const remaining = getRemainingLockMs();
      if (remaining > 0) {
        const minutes = Math.ceil(remaining / 60000);
        loginHint.textContent = `Too many failed attempts. Login locked for ${minutes} more minute(s).`;
        loginHint.hidden = false;
        return;
      }

      const lock = readLock();
      const attemptsLeft = Math.max(0, MAX_LOGIN_ATTEMPTS - Number(lock.failedCount || 0));
      loginHint.textContent = `Attempts left before lock: ${attemptsLeft}`;
      loginHint.hidden = false;
    }

    function startLockTimer() {
      clearInterval(lockTimer);
      lockTimer = setInterval(() => {
        updateLoginHint();
      }, 1000);
    }

    function getSession() {
      return utils.readJSON(sessionKey, null);
    }

    function isLoggedIn() {
      const session = getSession();
      if (!session || !session.loginAt || !session.lastActiveAt) return false;

      const maxIdle = SESSION_TIMEOUT_MINUTES * 60 * 1000;
      const elapsed = Date.now() - Number(session.lastActiveAt);
      if (elapsed > maxIdle) {
        localStorage.removeItem(sessionKey);
        return false;
      }
      return true;
    }

    function setLoggedIn(value) {
      if (value) {
        const now = Date.now();
        utils.writeJSON(sessionKey, {
          loginAt: now,
          lastActiveAt: now
        });

        const audit = utils.readJSON(auditKey, {});
        audit.lastLoginAt = new Date(now).toISOString();
        utils.writeJSON(auditKey, audit);
      } else {
        localStorage.removeItem(sessionKey);
      }
    }

    function touchSession() {
      if (!isLoggedIn()) return;
      const session = getSession();
      if (!session) return;
      session.lastActiveAt = Date.now();
      utils.writeJSON(sessionKey, session);
    }

    function startSessionTimer() {
      clearInterval(sessionTimer);
      sessionTimer = setInterval(() => {
        if (!isLoggedIn()) {
          syncVisibility();
          utils.notify("Admin session expired. Please login again.", "warn");
        }
      }, 30000);

      ["click", "keydown", "mousemove", "scroll"].forEach((eventName) => {
        window.addEventListener(
          eventName,
          () => {
            touchSession();
          },
          { passive: true }
        );
      });
    }

    function syncVisibility() {
      const loggedIn = isLoggedIn();
      loginSection.hidden = loggedIn;
      managerSection.hidden = !loggedIn;

      const audit = utils.readJSON(auditKey, {});
      if (lastLoginAt) {
        lastLoginAt.textContent = audit.lastLoginAt ? utils.formatDateTime(audit.lastLoginAt) : "No successful login yet";
      }

      if (loggedIn) {
        const canSync = typeof utils.syncMediaFromCloud === "function" && typeof utils.hasCloudSync === "function" && utils.hasCloudSync();
        if (canSync) {
          utils
            .syncMediaFromCloud()
            .catch(() => null)
            .finally(() => {
              populatePlaceOptions();
            });
        } else {
          populatePlaceOptions();
        }
      }

      updateLoginHint();
    }

    function populatePlaceOptions() {
      const fromQuery = new URLSearchParams(window.location.search).get("place") || "";
      const previousValue = placeSelect.value;
      const selectedValue = fromQuery || previousValue;

      const currentFilter = (placeFilter?.value || "").trim().toLowerCase();
      const filteredPlaces = places.filter((place) => {
        if (!currentFilter) return true;
        return (
          place.name.toLowerCase().includes(currentFilter) ||
          place.type.toLowerCase().includes(currentFilter) ||
          place.region.toLowerCase().includes(currentFilter)
        );
      });

      placeSelect.innerHTML = "";

      filteredPlaces.forEach((place) => {
        const option = document.createElement("option");
        option.value = place.file;
        option.textContent = `${place.name} (${place.type})`;
        placeSelect.appendChild(option);
      });

      if (selectedValue && filteredPlaces.some((item) => item.file === selectedValue)) {
        placeSelect.value = selectedValue;
      }

      if (!placeSelect.value && filteredPlaces.length) {
        placeSelect.value = filteredPlaces[0].file;
      }

      updatePlaceLink();
      renderPlaceMedia();
    }

    function updatePlaceLink() {
      const selectedFile = placeSelect.value;
      placeLink.href = selectedFile || "#";
    }

    function getSelectedPlaceMedia() {
      const selectedFile = placeSelect.value;
      if (!selectedFile) return { videos: [], images: [] };
      return utils.getPlaceMedia(selectedFile);
    }

    function saveSelectedPlaceMedia(media) {
      const selectedFile = placeSelect.value;
      if (!selectedFile) return;
      utils.setPlaceMedia(selectedFile, media);
    }

    function renderPlaceStats(media) {
      if (!placeStats) return;
      placeStats.textContent = `Videos: ${media.videos.length} | Images: ${media.images.length}`;
    }

    function renderPlaceMedia() {
      const media = getSelectedPlaceMedia();
      previewList.innerHTML = "";

      const allItems = [
        ...media.videos.map((item) => ({ ...item, itemType: "video" })),
        ...media.images.map((item) => ({ ...item, itemType: "image" }))
      ];

      renderPlaceStats(media);

      if (!allItems.length) {
        const empty = document.createElement("div");
        empty.className = "empty-media";
        empty.textContent = "No media added for this place yet.";
        previewList.appendChild(empty);
        return;
      }

      allItems.forEach((item) => {
        const card = document.createElement("article");
        card.className = item.itemType === "video" ? "video-card" : "image-card";

        if (item.itemType === "video") {
          const frame = document.createElement("div");
          frame.className = "video-frame";

          const iframe = document.createElement("iframe");
          iframe.src = item.embedUrl;
          iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
          iframe.allowFullscreen = true;
          iframe.loading = "lazy";

          frame.appendChild(iframe);
          card.appendChild(frame);

          const pin = document.createElement("img");
          pin.className = "pin-badge";
          pin.src = item.pinUrl || "images/pic.jpg";
          pin.alt = "Pin image";
          pin.loading = "lazy";
          card.appendChild(pin);
        } else {
          const image = document.createElement("img");
          image.className = "image-preview";
          image.src = item.url;
          image.alt = item.title || "Tour image";
          image.loading = "lazy";
          card.appendChild(image);
        }

        const content = document.createElement("div");
        content.className = "card-content";
        content.appendChild(createCardTitle(item.title));

        const description = document.createElement("p");
        const highlight = item.highlight ? `Highlight: ${item.highlight}` : "No highlight added.";
        description.textContent = `${highlight} ${item.description ? `| ${item.description}` : ""}`;
        content.appendChild(description);

        const actions = document.createElement("div");
        actions.className = "card-actions";

        const openLink = document.createElement("a");
        openLink.className = "btn btn-outline btn-small";
        openLink.href = item.url;
        openLink.target = "_blank";
        openLink.rel = "noopener noreferrer";
        openLink.textContent = "Open";

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-soft btn-small";
        removeBtn.type = "button";
        removeBtn.textContent = "Remove";
        removeBtn.dataset.id = item.id;
        removeBtn.dataset.type = item.itemType;

        actions.appendChild(openLink);
        actions.appendChild(removeBtn);
        content.appendChild(actions);

        card.appendChild(content);
        previewList.appendChild(card);
      });
    }

    async function handleLogin(event) {
      event.preventDefault();

      if (isLocked()) {
        loginError.textContent = "Login temporarily locked due to repeated failed attempts.";
        loginError.hidden = false;
        updateLoginHint();
        return;
      }

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (await verifyCredentials(username, password)) {
        setLoggedIn(true);
        loginError.hidden = true;
        loginForm.reset();
        clearLock();
        syncVisibility();
        utils.notify("Admin login successful.", "success");
        return;
      }

      const lock = readLock();
      lock.failedCount = Number(lock.failedCount || 0) + 1;

      if (lock.failedCount >= MAX_LOGIN_ATTEMPTS) {
        lock.lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        lock.failedCount = 0;
      }

      writeLock(lock);
      updateLoginHint();
      loginError.textContent = "Invalid username or password.";
      loginError.hidden = false;
    }

    function validateMediaInput(type, title, url, pin) {
      if (!title || !url) {
        utils.notify("Title and URL are required.", "warn");
        return false;
      }

      if (!/^https?:\/\//i.test(url)) {
        utils.notify("Please use a valid URL starting with http or https.", "warn");
        return false;
      }

      if (type === "video") {
        const embedUrl = utils.toEmbedUrl(url);
        if (!embedUrl) {
          utils.notify("Video type requires a valid YouTube link.", "warn");
          return false;
        }
      }

      if (pin && !/^https?:\/\//i.test(pin)) {
        utils.notify("Pin image URL should start with http or https.", "warn");
        return false;
      }

      return true;
    }

    function handleAddMedia(event) {
      event.preventDefault();

      const type = mediaType.value;
      const title = mediaTitle.value.trim();
      const url = mediaUrl.value.trim();
      const pin = mediaPin.value.trim();
      const highlight = mediaHighlight.value.trim();
      const description = mediaDescription.value.trim();

      if (!placeSelect.value) {
        utils.notify("Select a place before adding media.", "warn");
        return;
      }

      if (!validateMediaInput(type, title, url, pin)) {
        return;
      }

      const media = getSelectedPlaceMedia();

      if (type === "video") {
        media.videos.unshift({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          title,
          url,
          embedUrl: utils.toEmbedUrl(url),
          pinUrl: pin,
          highlight,
          description,
          addedAt: new Date().toISOString()
        });
      } else {
        media.images.unshift({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          title,
          url,
          highlight,
          description,
          addedAt: new Date().toISOString()
        });
      }

      saveSelectedPlaceMedia(media);
      renderPlaceMedia();
      mediaForm.reset();
      mediaType.value = type;
      touchSession();
      utils.notify("Media added to selected place.", "success");
    }

    function handleRemove(event) {
      const button = event.target.closest("button[data-id][data-type]");
      if (!button) return;

      const id = button.dataset.id;
      const type = button.dataset.type;
      const media = getSelectedPlaceMedia();

      if (type === "video") {
        media.videos = media.videos.filter((item) => item.id !== id);
      } else {
        media.images = media.images.filter((item) => item.id !== id);
      }

      saveSelectedPlaceMedia(media);
      renderPlaceMedia();
      touchSession();
      utils.notify("Entry removed.", "warn");
    }

    function handleClearAll() {
      const confirmed = window.confirm("Clear all videos and images for this place?");
      if (!confirmed) return;
      if (!placeSelect.value) return;
      saveSelectedPlaceMedia({ videos: [], images: [] });
      renderPlaceMedia();
      touchSession();
      utils.notify("All media cleared for selected place.", "warn");
    }

    loginForm.addEventListener("submit", handleLogin);

    togglePassword?.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.textContent = isPassword ? "Hide" : "Show";
      passwordInput.focus();
    });

    logoutBtn.addEventListener("click", () => {
      setLoggedIn(false);
      syncVisibility();
      utils.notify("Logged out from admin.", "success");
    });

    placeSelect.addEventListener("change", () => {
      updatePlaceLink();
      renderPlaceMedia();
      touchSession();
    });

    placeFilter?.addEventListener(
      "input",
      utils.debounce(() => {
        populatePlaceOptions();
      }, 100)
    );

    mediaForm.addEventListener("submit", handleAddMedia);
    previewList.addEventListener("click", handleRemove);
    clearPlaceMedia.addEventListener("click", handleClearAll);

    window.addEventListener("rove:media-updated", () => {
      if (!isLoggedIn()) return;
      renderPlaceMedia();
    });

    syncVisibility();
    startLockTimer();
    startSessionTimer();
  });
})();

