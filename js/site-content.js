(() => {
  const cfg = window.GLADSTONE_CONFIG || {};
  const copy = {};
  const versions = {};
  window.GLADSTONE_COPY = copy;

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  function formatMoney(cents) {
    return money.format(cents / 100);
  }

  function text(key) {
    const value = copy[key];
    return typeof value === "string" ? value.trim() : "";
  }

  function dollars(key) {
    const value = text(key);
    if (!/^-?\d+$/.test(value)) return null;
    const amount = Number(value);
    return Number.isSafeInteger(amount) ? amount : null;
  }

  function filename(value) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) return "";
    if (!/\.(mp4|mov|webm)$/i.test(value)) return "";
    return value;
  }

  function mediaUrl(file, version) {
    const base = String(cfg.supabaseUrl || "").replace(/\/$/, "");
    if (!base) return "";
    const url = `${base}/storage/v1/object/public/Service-media/${encodeURIComponent(file)}`;
    return version ? `${url}?v=${encodeURIComponent(version)}` : url;
  }

  function priceNote(cents, previous) {
    const amount = formatMoney(Math.abs(cents));
    const suffix = /\/hour$/.test(previous || "")
      ? "/hour"
      : /\beach$/.test(previous || "")
        ? " each"
        : "";
    return `${cents < 0 ? "− " : "+ "}${amount}${suffix}`;
  }

  function applyQuotes() {
    const packages = window.GLADSTONE_SERVICE_QUOTES;
    if (!Array.isArray(packages)) return;
    packages.forEach((pack) => {
      const pid = pack.id;
      ["title", "summary", "baseLabel", "baseDetail"].forEach((field) => {
        const value = text(`quote.${pid}.${field}`);
        if (value) pack[field] = value;
      });
      const base = dollars(`quote.${pid}.basePrice`);
      if (base !== null && base >= 0) pack.basePriceCents = base * 100;
      if (Array.isArray(pack.overview)) {
        pack.overview = pack.overview.map(
          (point, index) => text(`quote.${pid}.overview.${index}`) || point
        );
      }
      if (pack.finish && typeof pack.finish === "object") {
        Object.keys(pack.finish).forEach((field) => {
          if (typeof pack.finish[field] !== "string") return;
          const value = text(`quote.${pid}.finish.${field}`);
          if (value) pack.finish[field] = value;
        });
      }
      (pack.steps || []).forEach((step) => {
        const title = text(`quote.${pid}.${step.id}.title`);
        const hint = text(`quote.${pid}.${step.id}.hint`);
        if (title) step.title = title;
        if (hint) step.hint = hint;
        (step.options || []).forEach((option) => {
          const prefix = `quote.${pid}.${step.id}.${option.id}`;
          ["label", "detail", "inputLabel", "inputError"].forEach((field) => {
            const value = text(`${prefix}.${field}`);
            if (value) option[field] = value;
          });
          if (typeof option.priceCents === "number") {
            const amount = dollars(`${prefix}.price`);
            if (amount !== null) {
              option.priceCents = amount * 100;
              option.note = priceNote(option.priceCents, option.note);
            }
          } else if (option.confirm) {
            const note = text(`${prefix}.note`);
            if (note) option.note = note;
          }
        });
      });
    });
  }

  function applyDom() {
    document.querySelectorAll("[data-copy]").forEach((node) => {
      const key = node.getAttribute("data-copy");
      const value = text(key);
      if (!value) return;
      if (key === "home.about.sub" && /\bJust\s+A\b/.test(value)) {
        const [before, after] = value.split(/\bJust\s+A\b/);
        node.replaceChildren(`${before}Just`, document.createElement("br"), `A${after}`);
        return;
      }
      if (key === "home.about.signoff" || key === "home.showreel.title") {
        const parts = value.split(/(?<=\.)\s+/).filter(Boolean);
        if (parts.length > 1) {
          node.replaceChildren(
            ...parts.map((part) => {
              const span = document.createElement("span");
              span.textContent = part;
              return span;
            })
          );
          return;
        }
      }
      node.textContent = value;
    });
    const startingAt = text("quote.chrome.startingAt") || "Starting at";
    document.querySelectorAll("[data-price]").forEach((node) => {
      const pack = (window.GLADSTONE_SERVICE_QUOTES || []).find(
        (item) => item.id === node.getAttribute("data-price")
      );
      if (!pack || typeof pack.basePriceCents !== "number") return;
      const amount = formatMoney(pack.basePriceCents);
      if (node.classList.contains("service-hero-price")) {
        const label = node.querySelector(".service-hero-price-label");
        const value = node.querySelector(".service-hero-price-amount");
        if (label && value) {
          label.textContent = startingAt;
          value.textContent = amount;
          return;
        }
        const nextLabel = document.createElement("span");
        nextLabel.className = "service-hero-price-label";
        nextLabel.textContent = startingAt;
        const nextValue = document.createElement("strong");
        nextValue.className = "service-hero-price-amount";
        nextValue.textContent = amount;
        node.replaceChildren(nextLabel, nextValue);
        return;
      }
      node.textContent = `${startingAt} ${amount}`;
    });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll("[data-video]").forEach((video) => {
      const key = video.getAttribute("data-video");
      const file = filename(text(key));
      const url = file ? mediaUrl(file, versions[key]) : "";
      if (!url) return;
      if (video.classList.contains("home-film-video")) {
        video.dataset.filmSrc = url;
        const frame = `${url}#t=0.001`;
        if (video.getAttribute("src") !== frame) video.src = frame;
        return;
      }
      if (video.getAttribute("src") !== url) video.src = url;
      if (reduced) {
        video.removeAttribute("autoplay");
        video.pause();
      }
    });
  }

  function publish() {
    applyQuotes();
    applyDom();
    window.GLADSTONE_COPY_READY = true;
    document.dispatchEvent(new CustomEvent("gladstone:copy"));
  }

  const base = String(cfg.supabaseUrl || "").replace(/\/$/, "");
  if (!base || !cfg.supabaseAnonKey) return;
  fetch(`${base}/rest/v1/site_copy?select=key,value,updated_at`, {
    headers: {
      apikey: cfg.supabaseAnonKey,
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
    },
  })
    .then((response) => (response.ok ? response.json() : null))
    .then((rows) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row) => {
        if (!row || typeof row.key !== "string" || typeof row.value !== "string") return;
        copy[row.key] = row.value;
        if (row.updated_at) versions[row.key] = row.updated_at;
      });
      Object.assign(copy, {
        "home.card.aerial-video.title": "Flyover",
        "service.aerial-video.title": "Flyover",
        "quote.aerial-video.title": "Flyover",
        "home.card.event-highlights.title": "The Highlights",
        "home.card.event-highlights.line": "Let them see what they missed.",
        "home.card.full-day-event-coverage.title": "The Big One",
        "home.card.full-day-event-coverage.line":
          "For those times when a quick one won’t cut it.",
        "service.event-highlights.title": "The Highlights",
        "service.event-highlights.line": "Let them see what they missed.",
        "service.full-day-event-coverage.title": "The Big One",
        "service.full-day-event-coverage.line":
          "For those times when a quick one won’t cut it.",
        "quote.event-highlights.title": "The Highlights",
        "quote.event-highlights.summary": "Let them see what they missed.",
        "quote.event-highlights.baseLabel": "The Highlights",
        "quote.full-day-event-coverage.title": "The Big One",
        "quote.full-day-event-coverage.summary":
          "For those times when a quick one won’t cut it.",
        "quote.full-day-event-coverage.baseLabel": "The Big One",
      });
      Object.keys(copy).forEach((key) => {
        if (typeof copy[key] === "string" && copy[key].includes("Fly Over")) {
          copy[key] = copy[key].replaceAll("Fly Over", "Flyover");
        }
      });
      publish();
    })
    .catch(() => {});
})();
