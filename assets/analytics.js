(function () {
  "use strict";

  const site = window.ROVE_SITE || {};
  const analytics = site.analytics || {};

  function loadScript(src, asyncValue) {
    const script = document.createElement("script");
    script.src = src;
    script.async = asyncValue !== false;
    document.head.appendChild(script);
    return script;
  }

  function initGA4(id) {
    if (!id) return;

    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, true);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
  }

  function initClarity(id) {
    if (!id) return;

    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
  }

  if (analytics.ga4Id) {
    initGA4(analytics.ga4Id);
  }

  if (analytics.clarityId) {
    initClarity(analytics.clarityId);
  }
})();
