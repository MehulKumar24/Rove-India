(function () {
  "use strict";

  const site = window.ROVE_SITE || {};
  const prefix = site.storagePrefix || "rove_india_v3";

  const keys = {
    recent: `${prefix}_recent_places`,
    mediaMap: `${prefix}_media_map`,
    adminSession: `${prefix}_admin_session`,
    adminLock: `${prefix}_admin_lock`,
    adminAudit: `${prefix}_admin_audit`,
    localAnalytics: `${prefix}_local_analytics`,
  };

  const syncState = {
    pullInFlight: false,
    pushInFlight: false,
    pushQueued: false,
    pushTimer: null,
    latestMap: null,
    lastWarnAt: 0
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(callback, waitMs) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(...args), waitMs);
    };
  }

  function getMediaMap() {
    return readJSON(keys.mediaMap, {});
  }

  function saveMediaMap(map) {
    writeJSON(keys.mediaMap, map);
  }

  function getPlaceMedia(file) {
    const map = getMediaMap();
    return map[file] || { videos: [], images: [] };
  }

  function setPlaceMedia(file, media) {
    const map = getMediaMap();
    map[file] = media;
    saveMediaMap(map);
    queueCloudPush(map);
    dispatchMediaUpdated("local");
  }

  function getSyncConfig() {
    const cfg = site.sync || {};
    const timeout = Math.max(2000, Number(cfg.requestTimeoutMs || 8000));

    return {
      enabled: Boolean(cfg.enabled),
      readUrl: String(cfg.readUrl || "").trim(),
      writeUrl: String(cfg.writeUrl || "").trim(),
      method: String(cfg.method || "PUT").toUpperCase(),
      authHeader: String(cfg.authHeader || "").trim(),
      authToken: String(cfg.authToken || "").trim(),
      requestTimeoutMs: timeout
    };
  }

  function hasCloudSync() {
    const cfg = getSyncConfig();
    return Boolean(cfg.enabled && cfg.readUrl && cfg.writeUrl);
  }

  function buildSyncHeaders(config) {
    const headers = {
      "Content-Type": "application/json"
    };

    if (config.authHeader && config.authToken) {
      headers[config.authHeader] = config.authToken;
    } else if (config.authToken) {
      headers.Authorization = config.authToken;
    }

    return headers;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const requestOptions = { ...(options || {}), signal: controller.signal };
    return fetch(url, requestOptions).finally(() => clearTimeout(timer));
  }

  function createId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeVideos(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        const url = String(item?.url || "").trim();
        const embedUrlRaw = String(item?.embedUrl || "").trim();
        const embedUrl = embedUrlRaw || toEmbedUrl(url);
        if (!url || !embedUrl) return null;

        return {
          id: String(item?.id || createId()),
          title: String(item?.title || "Untitled tourism video"),
          url,
          embedUrl,
          pinUrl: String(item?.pinUrl || "").trim(),
          highlight: String(item?.highlight || "").trim(),
          description: String(item?.description || "").trim(),
          addedAt: String(item?.addedAt || new Date().toISOString())
        };
      })
      .filter(Boolean);
  }

  function normalizeImages(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        const url = String(item?.url || "").trim();
        if (!url) return null;

        return {
          id: String(item?.id || createId()),
          title: String(item?.title || "Untitled tourism image"),
          url,
          highlight: String(item?.highlight || "").trim(),
          description: String(item?.description || "").trim(),
          addedAt: String(item?.addedAt || new Date().toISOString())
        };
      })
      .filter(Boolean);
  }

  function normalizeMediaMap(rawMap) {
    if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
      return {};
    }

    const normalized = {};
    Object.entries(rawMap).forEach(([file, value]) => {
      if (!file || typeof file !== "string") return;
      const videos = normalizeVideos(value?.videos);
      const images = normalizeImages(value?.images);
      normalized[file] = { videos, images };
    });

    return normalized;
  }

  function dispatchMediaUpdated(source) {
    window.dispatchEvent(
      new CustomEvent("rove:media-updated", {
        detail: { source: source || "unknown" }
      })
    );
  }

  function warnCloudSyncFailure() {
    const now = Date.now();
    if (now - syncState.lastWarnAt < 10000) return;
    syncState.lastWarnAt = now;
    notify("Cloud sync failed. Latest changes are only local on this device.", "warn");
  }

  async function pushCloudMapNow(mapToPush) {
    const config = getSyncConfig();
    if (!hasCloudSync()) return { ok: false, skipped: true };

    const body = JSON.stringify(normalizeMediaMap(mapToPush));
    const response = await fetchWithTimeout(
      config.writeUrl,
      {
        method: config.method === "POST" ? "POST" : "PUT",
        headers: buildSyncHeaders(config),
        body
      },
      config.requestTimeoutMs
    );

    if (!response.ok) {
      throw new Error(`Cloud write failed (${response.status})`);
    }

    return { ok: true };
  }

  async function flushCloudPush() {
    if (syncState.pushInFlight) return;
    if (!syncState.pushQueued || !syncState.latestMap) return;

    syncState.pushInFlight = true;
    syncState.pushQueued = false;

    const currentMap = syncState.latestMap;
    try {
      await pushCloudMapNow(currentMap);
    } catch (_error) {
      warnCloudSyncFailure();
    } finally {
      syncState.pushInFlight = false;
      if (syncState.pushQueued) {
        flushCloudPush();
      }
    }
  }

  function queueCloudPush(map) {
    if (!hasCloudSync()) return;
    syncState.latestMap = normalizeMediaMap(map);
    syncState.pushQueued = true;

    clearTimeout(syncState.pushTimer);
    syncState.pushTimer = setTimeout(() => {
      flushCloudPush();
    }, 280);
  }

  async function syncMediaFromCloud() {
    if (!hasCloudSync()) return { ok: false, skipped: true };
    if (syncState.pullInFlight) return { ok: false, skipped: true };

    syncState.pullInFlight = true;

    try {
      const config = getSyncConfig();
      const response = await fetchWithTimeout(
        config.readUrl,
        {
          method: "GET",
          headers: buildSyncHeaders(config),
          cache: "no-store"
        },
        config.requestTimeoutMs
      );

      if (!response.ok) {
        throw new Error(`Cloud read failed (${response.status})`);
      }

      const payload = await response.json();
      const normalized = normalizeMediaMap(payload);
      saveMediaMap(normalized);
      dispatchMediaUpdated("cloud");
      return { ok: true };
    } catch (_error) {
      return { ok: false, skipped: false };
    } finally {
      syncState.pullInFlight = false;
    }
  }

  function addRecentPlace(name, file) {
    if (!name || !file) return;
    const list = readJSON(keys.recent, []);
    const remaining = list.filter((item) => item.file !== file);

    remaining.unshift({
      name,
      file,
      visitedAt: new Date().toISOString()
    });

    writeJSON(keys.recent, remaining.slice(0, 12));
  }

  function parseYouTubeId(url) {
    if (!url) return "";
    const cleaned = String(url).trim();

    const shortMatch = cleaned.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (shortMatch) return shortMatch[1];

    const watchMatch = cleaned.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watchMatch) return watchMatch[1];

    const embedMatch = cleaned.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (embedMatch) return embedMatch[1];

    return "";
  }

  function toEmbedUrl(url) {
    const id = parseYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  function initNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("show");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        links.classList.remove("show");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initHeaderAutoHide() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const root = document.documentElement;

    const syncHeaderEdge = () => {
      const rect = header.getBoundingClientRect();
      const edgeY = Math.max(0, Math.round(rect.bottom));
      root.style.setProperty("--header-edge-y", `${edgeY}px`);
    };

    syncHeaderEdge();
    window.addEventListener("resize", debounce(syncHeaderEdge, 120));
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(syncHeaderEdge);
      observer.observe(header);
    }

    let lastY = window.scrollY || 0;
    let ticking = false;

    const onScroll = () => {
      const currentY = window.scrollY || 0;
      const delta = currentY - lastY;

      if (currentY <= 24) {
        header.classList.remove("nav-hidden");
      } else if (delta > 6) {
        header.classList.add("nav-hidden");
      } else if (delta < -4) {
        header.classList.remove("nav-hidden");
      }

      syncHeaderEdge();
      lastY = currentY;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(onScroll);
      },
      { passive: true }
    );
    header.addEventListener("transitionend", syncHeaderEdge);
  }

  function initBackToTop() {
    const button = document.querySelector(".back-to-top");
    if (!button) return;

    const update = () => {
      button.classList.toggle("show", window.scrollY > 320);
    };

    window.addEventListener("scroll", update, { passive: true });
    update();

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initStateClickTracking() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a.state-link");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const name = link.getAttribute("data-state-name") || link.textContent.trim();
      if (!href || href.startsWith("http") || href.startsWith("#")) return;

      addRecentPlace(name, href);
    });
  }

  function initRevealEffects() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    items.forEach((item) => item.classList.add("show"));
  }

  function initPremiumMotion() {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    const tiltTargets = document.querySelectorAll(".place-card, .feature-card, .festival-card, .video-card, .image-card, .info-card");
    tiltTargets.forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 5;
        const rotateX = (0.5 - py) * 5;

        card.style.transform = `perspective(760px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  function setCurrentYear() {
    document.querySelectorAll(".js-year").forEach((node) => {
      node.textContent = String(new Date().getFullYear());
    });
  }

  function getToastContainer() {
    let container = document.querySelector(".toast-wrap");
    if (container) return container;

    container = document.createElement("div");
    container.className = "toast-wrap";
    document.body.appendChild(container);
    return container;
  }

  function notify(message, variant) {
    const inline = document.querySelector("#inlineStatus");
    if (inline) {
      inline.textContent = message;
      inline.hidden = false;
      clearTimeout(notify._timer);
      notify._timer = setTimeout(() => {
        inline.hidden = true;
      }, 2800);
      return;
    }

    const container = getToastContainer();
    const node = document.createElement("div");
    node.className = `toast ${variant || "info"}`;
    node.textContent = message;
    container.appendChild(node);

    requestAnimationFrame(() => {
      node.classList.add("show");
    });

    setTimeout(() => {
      node.classList.remove("show");
      setTimeout(() => {
        node.remove();
      }, 220);
    }, 2600);
  }

  function trackPageView() {
    const current = readJSON(keys.localAnalytics, { views: {} });
    const path = window.location.pathname || "index.html";
    current.views[path] = (current.views[path] || 0) + 1;
    current.lastViewedAt = new Date().toISOString();
    writeJSON(keys.localAnalytics, current);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getCanonicalUrl(pathName) {
    const baseUrl = site.baseUrl || "";
    if (!baseUrl) return "";

    const sanitizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const sanitizedPath = (pathName || "").startsWith("/") ? pathName : `/${pathName || ""}`;
    return `${sanitizedBase}${sanitizedPath}`;
  }

  window.roveUtils = {
    keys,
    readJSON,
    writeJSON,
    escapeHtml,
    debounce,
    getMediaMap,
    saveMediaMap,
    getPlaceMedia,
    setPlaceMedia,
    hasCloudSync,
    syncMediaFromCloud,
    addRecentPlace,
    parseYouTubeId,
    toEmbedUrl,
    notify,
    formatDateTime,
    getCanonicalUrl,
    trackPageView
  };

  window.addEventListener("DOMContentLoaded", () => {
    initNavToggle();
    initHeaderAutoHide();
    initBackToTop();
    initStateClickTracking();
    initPremiumMotion();
    initRevealEffects();
    setCurrentYear();
    trackPageView();
    syncMediaFromCloud();
    window.addEventListener("focus", () => {
      syncMediaFromCloud();
    });
  });
})();

