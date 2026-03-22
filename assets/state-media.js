(function () {
  "use strict";

  function createEmpty(message) {
    const div = document.createElement("div");
    div.className = "empty-media";
    div.textContent = message;
    return div;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const utils = window.roveUtils;
    const site = window.ROVE_SITE || {};
    const places = Array.isArray(window.ROVE_PLACES) ? window.ROVE_PLACES : [];
    if (!utils) return;

    const currentFile = window.ROVE_CURRENT_PAGE_FILE || "";
    const place = places.find((item) => item.file === currentFile);

    const placeTitle = document.getElementById("placeTitle");
    const placeMeta = document.getElementById("placeMeta");
    const placeVibe = document.getElementById("placeVibe");
    const placeSeason = document.getElementById("placeSeason");
    const videoGallery = document.getElementById("videoGallery");
    const imageGallery = document.getElementById("imageGallery");
    const relatedPlaces = document.getElementById("relatedPlaces");
    const mediaCount = document.getElementById("mediaCount");
    const updatedAt = document.getElementById("updatedAt");

    if (!place || !videoGallery || !imageGallery) return;

    document.title = `${place.name} | Rove India`;
    if (placeTitle) placeTitle.textContent = place.name;
    if (placeMeta) placeMeta.textContent = `${place.type} | ${place.region} India`;
    if (placeVibe) placeVibe.textContent = place.vibe;
    if (placeSeason) placeSeason.textContent = place.season;

    function renderMedia() {
      const media = utils.getPlaceMedia(place.file);
      const totalMedia = media.videos.length + media.images.length;

      if (mediaCount) {
        mediaCount.textContent = `Total media items: ${totalMedia}`;
      }

      if (updatedAt) {
        const latestVideo = media.videos[0]?.addedAt || "";
        const latestImage = media.images[0]?.addedAt || "";
        const latest = [latestVideo, latestImage].filter(Boolean).sort().reverse()[0];
        updatedAt.textContent = latest ? `Updated: ${utils.formatDateTime(latest)}` : "Updated: Awaiting media uploads";
      }

      videoGallery.innerHTML = "";
      imageGallery.innerHTML = "";

      if (!media.videos.length) {
        videoGallery.appendChild(createEmpty("No tourism videos added yet. Use Admin Login to add videos with short highlights and descriptions."));
      } else {
        media.videos.forEach((video) => {
          const card = document.createElement("article");
          card.className = "video-card";

          const frame = document.createElement("div");
          frame.className = "video-frame";

          const iframe = document.createElement("iframe");
          iframe.src = video.embedUrl;
          iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
          iframe.allowFullscreen = true;
          iframe.loading = "lazy";

          frame.appendChild(iframe);
          card.appendChild(frame);

          const pin = document.createElement("img");
          pin.className = "pin-badge";
          pin.src = video.pinUrl || "../images/pic.jpg";
          pin.alt = "Pin image";
          pin.loading = "lazy";
          card.appendChild(pin);

          const content = document.createElement("div");
          content.className = "card-content";

          const heading = document.createElement("h4");
          heading.textContent = video.title || "Untitled tourism video";

          const highlight = document.createElement("p");
          highlight.className = "highlight-pill";
          highlight.textContent = video.highlight ? `Highlight: ${video.highlight}` : "Highlight: Not provided";

          const desc = document.createElement("p");
          desc.textContent = video.description || "No description added.";

          const actions = document.createElement("div");
          actions.className = "card-actions";

          const link = document.createElement("a");
          link.className = "btn btn-outline btn-small";
          link.href = video.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Open on YouTube";

          actions.appendChild(link);
          content.appendChild(heading);
          content.appendChild(highlight);
          content.appendChild(desc);
          content.appendChild(actions);

          card.appendChild(content);
          videoGallery.appendChild(card);
        });
      }

      if (!media.images.length) {
        imageGallery.appendChild(createEmpty("No tourism images added yet. Use Admin Login to add images with short highlights and descriptions."));
      } else {
        media.images.forEach((image) => {
          const card = document.createElement("article");
          card.className = "image-card";

          const preview = document.createElement("img");
          preview.className = "image-preview";
          preview.src = image.url;
          preview.alt = image.title || "Tour image";
          preview.loading = "lazy";

          const content = document.createElement("div");
          content.className = "card-content";

          const heading = document.createElement("h4");
          heading.textContent = image.title || "Untitled tourism image";

          const highlight = document.createElement("p");
          highlight.className = "highlight-pill";
          highlight.textContent = image.highlight ? `Highlight: ${image.highlight}` : "Highlight: Not provided";

          const desc = document.createElement("p");
          desc.textContent = image.description || "No description added.";

          const actions = document.createElement("div");
          actions.className = "card-actions";

          const link = document.createElement("a");
          link.className = "btn btn-outline btn-small";
          link.href = image.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Open image";

          actions.appendChild(link);
          content.appendChild(heading);
          content.appendChild(highlight);
          content.appendChild(desc);
          content.appendChild(actions);

          card.appendChild(preview);
          card.appendChild(content);
          imageGallery.appendChild(card);
        });
      }
    }

    function renderRelated() {
      if (!relatedPlaces) return;

      const siblings = places
        .filter((item) => item.region === place.region && item.file !== place.file)
        .slice(0, 4);

      if (!siblings.length) {
        relatedPlaces.innerHTML = '<span class="chip empty">Related places will appear here.</span>';
      } else {
        relatedPlaces.innerHTML = siblings
          .map(
            (item) =>
              `<a class="chip state-link" data-state-name="${utils.escapeHtml(item.name)}" href="../${utils.escapeHtml(item.file)}">${utils.escapeHtml(item.name)}</a>`
          )
          .join("");
      }
    }

    renderMedia();
    renderRelated();

    window.addEventListener("rove:media-updated", () => {
      renderMedia();
    });

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: place.name,
      description: `${place.vibe}. Best travel season: ${place.season}.`,
      touristType: "Leisure, culture, heritage",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN"
      },
      hasMap: `${site.baseUrl || ""}/index.html#placesSection`
    };

    const schemaScript = document.createElement("script");
    schemaScript.type = "application/ld+json";
    schemaScript.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(schemaScript);
  });
})();
