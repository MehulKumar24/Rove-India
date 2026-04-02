(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const utils = window.roveUtils;
    const places = Array.isArray(window.ROVE_PLACES) ? window.ROVE_PLACES : [];
    const featuredDestinations = Array.isArray(window.ROVE_FEATURED_DESTINATIONS)
      ? window.ROVE_FEATURED_DESTINATIONS
      : [];
    const festivalSpotlights = Array.isArray(window.ROVE_FESTIVAL_SPOTLIGHTS)
      ? window.ROVE_FESTIVAL_SPOTLIGHTS
      : [];

    if (!utils) return;

    const placeGrid = document.getElementById("placeGrid");
    const searchInput = document.getElementById("searchInput");
    const typeFilter = document.getElementById("typeFilter");
    const regionFilter = document.getElementById("regionFilter");
    const sortFilter = document.getElementById("sortFilter");
    const resetBtn = document.getElementById("resetSearch");
    const visibleRows = document.getElementById("visibleRows");
    const totalPlaces = document.getElementById("totalPlaces");
    const stateCount = document.getElementById("stateCount");
    const utCount = document.getElementById("utCount");
    const recentPlaces = document.getElementById("recentPlaces");
    const randomPickBtn = document.getElementById("randomPickBtn");
    const randomPickResult = document.getElementById("randomPickResult");
    const featuredGrid = document.getElementById("featuredGrid");
    const festivalGrid = document.getElementById("festivalGrid");

    const stateTotal = places.filter((item) => item.type === "State").length;
    const utTotal = places.filter((item) => item.type === "Union Territory").length;

    let filteredPlaces = [...places];

    function compareBySort(a, b, mode) {
      if (mode === "za") return b.name.localeCompare(a.name);
      if (mode === "region") return a.region.localeCompare(b.region) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    }

    function getFilters() {
      return {
        query: (searchInput?.value || "").trim().toLowerCase(),
        type: typeFilter?.value || "all",
        region: regionFilter?.value || "All",
        sort: sortFilter?.value || "az"
      };
    }

    function getFilteredPlaces() {
      const filters = getFilters();

      filteredPlaces = places.filter((item) => {
        const matchQuery = !filters.query || item.name.toLowerCase().includes(filters.query);
        const matchType = filters.type === "all" || item.type === filters.type;
        const matchRegion = filters.region === "All" || item.region === filters.region;
        return matchQuery && matchType && matchRegion;
      });

      filteredPlaces.sort((a, b) => compareBySort(a, b, filters.sort));
      return filteredPlaces;
    }

    function renderPlaceCards() {
      if (!placeGrid) return;
      const current = getFilteredPlaces();

      if (!current.length) {
        placeGrid.innerHTML = '<div class="empty-media">No places found for current filter. Try another keyword or region.</div>';
        visibleRows.textContent = "0";
        return;
      }

      placeGrid.innerHTML = current
        .map(
          (item) => {
            return `
          <article class="place-card">
            <div class="place-tricolor" aria-hidden="true"></div>
            <div class="place-top">
              <span class="place-badge ${item.type === "State" ? "state" : "ut"}">${utils.escapeHtml(item.type)}</span>
              <span class="place-region">${utils.escapeHtml(item.region)}</span>
            </div>
            <h3>${utils.escapeHtml(item.name)}</h3>
            <p>${utils.escapeHtml(item.vibe)}</p>
            <p class="small-note">Best season: ${utils.escapeHtml(item.season)}</p>
            <div class="card-actions">
              <a class="btn btn-primary btn-small state-link" data-state-name="${utils.escapeHtml(item.name)}" href="${utils.escapeHtml(item.file)}">Open Page</a>
            </div>
          </article>
        `;
          }
        )
        .join("");

      visibleRows.textContent = String(current.length);
    }

    function renderStats() {
      totalPlaces.textContent = String(places.length);
      stateCount.textContent = String(stateTotal);
      utCount.textContent = String(utTotal);
      if (!visibleRows.textContent) {
        visibleRows.textContent = String(places.length);
      }
    }

    function renderRecentPlaces() {
      if (!recentPlaces) return;
      const recents = utils.readJSON(utils.keys.recent, []).slice(0, 10);

      if (!recents.length) {
        recentPlaces.innerHTML = '<span class="chip empty">No recently opened page yet.</span>';
        return;
      }

      recentPlaces.innerHTML = recents
        .map(
          (item) =>
            `<a class="chip state-link" data-state-name="${utils.escapeHtml(item.name)}" href="${utils.escapeHtml(item.file)}">${utils.escapeHtml(item.name)}</a>`
        )
        .join("");
    }

    function renderFeatured() {
      if (!featuredGrid) return;
      featuredGrid.innerHTML = featuredDestinations
        .map(
          (item) => `
          <article class="feature-card">
            <div class="place-tricolor" aria-hidden="true"></div>
            <h3>${utils.escapeHtml(item.title)}</h3>
            <p>${utils.escapeHtml(item.description)}</p>
            <a class="btn btn-outline btn-small state-link" data-state-name="${utils.escapeHtml(item.name)}" href="${utils.escapeHtml(item.file)}">Explore ${utils.escapeHtml(item.name)}</a>
          </article>
        `
        )
        .join("");
    }

    function renderFestivals() {
      if (!festivalGrid) return;
      festivalGrid.innerHTML = festivalSpotlights
        .map(
          (item) => `
          <article class="festival-card">
            <div class="place-tricolor" aria-hidden="true"></div>
            <h3>${utils.escapeHtml(item.festival)}</h3>
            <p><strong>${utils.escapeHtml(item.season)}</strong> | Focus: ${utils.escapeHtml(item.focus)}</p>
            <p>${utils.escapeHtml(item.idea)}</p>
          </article>
        `
        )
        .join("");
    }

    function handleRandomPick() {
      const source = filteredPlaces.length ? filteredPlaces : places;
      const item = source[Math.floor(Math.random() * source.length)];
      if (!item) return;

      randomPickResult.innerHTML = `Suggested: <a class="state-link" data-state-name="${utils.escapeHtml(item.name)}" href="${utils.escapeHtml(item.file)}">${utils.escapeHtml(item.name)}</a> (${utils.escapeHtml(item.region)} India)`;
      utils.notify(`Random pick: ${item.name}`, "success");
    }

    function applyFilters() {
      renderPlaceCards();
    }

    const debouncedApply = utils.debounce(applyFilters, 120);

    searchInput?.addEventListener("input", debouncedApply);
    typeFilter?.addEventListener("change", applyFilters);
    regionFilter?.addEventListener("change", applyFilters);
    sortFilter?.addEventListener("change", applyFilters);

    resetBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (typeFilter) typeFilter.value = "all";
      if (regionFilter) regionFilter.value = "All";
      if (sortFilter) sortFilter.value = "az";
      applyFilters();
      searchInput?.focus();
    });

    randomPickBtn?.addEventListener("click", handleRandomPick);

    renderStats();
    renderRecentPlaces();
    renderFeatured();
    renderFestivals();
    applyFilters();

    window.addEventListener("focus", () => {
      renderRecentPlaces();
      renderPlaceCards();
    });
  });
})();

