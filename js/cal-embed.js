(() => {
  const root = document.querySelector("[data-cal-embed]");
  if (!root) return;

  const mount = root.querySelector("[data-cal-mount]");
  const fallback = root.querySelector("[data-cal-fallback]");
  const cfg = window.GLADSTONE_CONFIG || {};
  const calLink = String(cfg.calLink || "").trim().replace(/^https?:\/\/(www\.)?cal\.com\//i, "");

  if (!calLink) {
    if (fallback) fallback.hidden = false;
    if (mount) mount.hidden = true;
    return;
  }

  if (fallback) fallback.hidden = true;
  if (mount) {
    mount.hidden = false;
    mount.id = mount.id || "gladstone-cal-inline";
  }

  (function (C, A, L) {
    const p = function (a, ar) {
      a.q.push(ar);
    };
    const d = C.document;
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", { origin: "https://cal.com" });
  Cal("inline", {
    elementOrSelector: `#${mount.id}`,
    calLink,
    config: {
      layout: cfg.calLayout || "month_view",
      theme: "light",
    },
  });
  Cal("ui", {
    theme: "light",
    hideEventTypeDetails: false,
    layout: cfg.calLayout || "month_view",
  });
})();
