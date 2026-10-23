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

  function mediaUrl(file) {
    const mapped = {
      "hero.mp4": "/assets/hero.mp4",
    };
    return mapped[file.toLowerCase()] || `/assets/films/${encodeURIComponent(file)}`;
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
      if (node.classList.contains("home-film-quote")) {
        node.textContent = `From ${amount}`;
        node.setAttribute("aria-label", `Build from ${amount}`);
        return;
      }
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
      const url = file ? mediaUrl(file) : "";
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
        "home.card.aerial-video.line": "Coverage from the air.",
        "service.aerial-video.title": "Flyover",
        "service.aerial-video.line": "Coverage from the air.",
        "service.aerial-video.headline": "A different perspective. A whole new view.",
        "service.aerial-video.note.0": "Some things are simply better seen from above.",
        "service.aerial-video.note.1":
          "Whether you’re showcasing a property, capturing a location or documenting a project, Flyover gives you high-quality aerial footage without the cost of a full video production.",
        "service.aerial-video.note.2":
          "We’ll take care of the flying and filming, then deliver the original footage directly to you, ready to use however you choose.",
        "service.aerial-video.includedHeading": "What’s included.",
        "service.aerial-video.point.0": "One drone flight (approximately 25–30 minutes)",
        "service.aerial-video.point.1": "High-quality aerial video footage",
        "service.aerial-video.point.2": "Original, unedited video files",
        "service.aerial-video.point.3": "Delivery within 48 hours of filming",
        "service.aerial-video.point.4": "Private digital download link",
        "service.aerial-video.point.5": "Local travel within our standard service area",
        "quote.aerial-video.title": "Flyover",
        "quote.aerial-video.summary": "High-quality aerial footage, ready for you to use.",
        "quote.aerial-video.baseDetail": "Approximately 25–30 minutes",
        "quote.aerial-video.overview.0": "One drone flight (approximately 25–30 minutes)",
        "quote.aerial-video.overview.1": "High-quality aerial video footage",
        "quote.aerial-video.overview.2": "Original, unedited video files",
        "quote.aerial-video.overview.3": "Delivery within 48 hours of filming",
        "quote.aerial-video.overview.4": "Private digital download link",
        "quote.aerial-video.overview.5": "Local travel within our standard service area",
        "home.card.event-highlights.title": "Highlights",
        "home.card.event-highlights.line": "Let them see what they missed.",
        "home.card.full-day-event-coverage.title": "The Big One",
        "home.card.full-day-event-coverage.line": "More of everything.",
        "home.card.real-estate-drone-photography.title": "Real Estate",
        "home.card.real-estate-drone-photography.line": "A perspective you won’t get from the street.",
        "quote.real-estate-drone-photography.title": "Real Estate",
        "quote.real-estate-drone-photography.summary": "Aerial photographs that help a listing stand out.",
        "quote.real-estate-drone-photography.baseDetail": "Delivered within 48 hours",
        "quote.real-estate-drone-photography.overview.0": "Minimum five professionally edited aerial photographs",
        "quote.real-estate-drone-photography.overview.1": "High-resolution images suitable for property listings",
        "quote.real-estate-drone-photography.overview.2": "Property and surrounding location coverage",
        "quote.real-estate-drone-photography.overview.3": "Professional colour and exposure adjustments",
        "quote.real-estate-drone-photography.overview.4": "Property marketing usage rights",
        "quote.real-estate-drone-photography.overview.5": "Delivery within 48 hours of photography",
        "quote.real-estate-drone-photography.overview.6": "Private digital download link",
        "quote.real-estate-drone-photography.overview.7": "Local travel within our standard service area",
        "service.real-estate-drone-photography.line": "A perspective you won’t get from the street.",
        "service.real-estate-drone-photography.headline": "Show more than just the property.",
        "service.real-estate-drone-photography.note.0": "A great property deserves more than a street-level perspective.",
        "service.real-estate-drone-photography.note.1":
          "Aerial photography gives potential buyers a clearer picture of what makes a property special. From the size and layout of the block to nearby beaches, waterways and surrounding amenities, the right images can tell a story that traditional photography can’t.",
        "service.real-estate-drone-photography.note.2":
          "Whether you’re marketing a family home, rural acreage or commercial property, we’ll capture professional aerial photographs that help your listing stand out.",
        "service.real-estate-drone-photography.includedHeading": "What’s included.",
        "service.real-estate-drone-photography.point.0": "Minimum five professionally edited aerial photographs",
        "service.real-estate-drone-photography.point.1": "High-resolution images suitable for property listings",
        "service.real-estate-drone-photography.point.2": "Property and surrounding location coverage",
        "service.real-estate-drone-photography.point.3": "Professional colour and exposure adjustments",
        "service.real-estate-drone-photography.point.4": "Property marketing usage rights",
        "service.real-estate-drone-photography.point.5": "Delivery within 48 hours of photography",
        "service.real-estate-drone-photography.point.6": "Private digital download link",
        "service.real-estate-drone-photography.point.7": "Local travel within our standard service area",
        "home.card.drone-inspections.line": "Get a clearer look without the climb.",
        "service.drone-inspections.line": "Get a clearer look without the climb.",
        "service.drone-inspections.headline": "Get a closer look, without the climb.",
        "service.drone-inspections.note.0": "Not everything is easy to see from the ground.",
        "service.drone-inspections.note.1":
          "From rooftops and solar panels to sheds, water tanks and other hard-to-reach areas, our drone inspections provide detailed aerial photographs and video so you can get a clearer view of what’s happening above.",
        "service.drone-inspections.note.2":
          "Whether you’re checking for visible damage, documenting a property’s condition or gathering imagery for a tradesperson, we’ll capture the areas you need to see and deliver the footage directly to you.",
        "service.drone-inspections.includedHeading": "What’s included.",
        "service.drone-inspections.disclaimer":
          "Visual imagery only. Structural assessments, technical diagnoses and certified inspection reports are not included.",
        "service.drone-inspections.point.0": "One property or inspection location",
        "service.drone-inspections.point.1": "High-resolution aerial photographs",
        "service.drone-inspections.point.2": "Video footage of nominated inspection areas",
        "service.drone-inspections.point.3": "Close-up imagery where safe and practical",
        "service.drone-inspections.point.4": "Original photographs and video files",
        "service.drone-inspections.point.5": "Delivery within 48 hours of inspection",
        "service.drone-inspections.point.6": "Private digital download link",
        "service.drone-inspections.point.7": "Local travel within our standard service area",
        "quote.drone-inspections.summary": "A clearer view of what’s hard to see from the ground.",
        "quote.drone-inspections.baseDetail": "Delivered within 48 hours",
        "quote.drone-inspections.overview.0": "One property or inspection location",
        "quote.drone-inspections.overview.1": "High-resolution aerial photographs",
        "quote.drone-inspections.overview.2": "Video footage of nominated inspection areas",
        "quote.drone-inspections.overview.3": "Close-up imagery where safe and practical",
        "quote.drone-inspections.overview.4": "Original photographs and video files",
        "quote.drone-inspections.overview.5": "Delivery within 48 hours of inspection",
        "quote.drone-inspections.overview.6": "Private digital download link",
        "quote.drone-inspections.overview.7": "Local travel within our standard service area",
        "service.event-highlights.title": "Highlights",
        "service.event-highlights.line": "Let them see what they missed.",
        "service.event-highlights.headline": "The moments worth remembering deserve more than a phone video.",
        "service.event-highlights.note.0":
          "You put the time into making it happen. We’ll make sure there’s something worth looking back on.",
        "service.event-highlights.note.1":
          "From sporting events and community celebrations to business launches and special occasions, Highlights brings together the atmosphere, energy and standout moments of your event in one professionally edited video.",
        "service.event-highlights.note.2":
          "Combining ground-level filming with aerial perspectives where permitted, we’ll capture the moments that tell your event’s story and turn them into a short, engaging video that’s ready to share.",
        "service.event-highlights.note.3":
          "Perfect for social media, promoting future events or simply reliving a great day.",
        "service.event-highlights.includedHeading": "What’s included.",
        "service.event-highlights.point.0": "Up to two hours of event coverage",
        "service.event-highlights.point.1": "Two-person filming crew",
        "service.event-highlights.point.2": "Professional ground-based videography",
        "service.event-highlights.point.3": "One drone flight, subject to conditions and permissions",
        "service.event-highlights.point.4": "One professionally edited 30–90-second highlight video",
        "service.event-highlights.point.5": "Colour grading and licensed background music",
        "service.event-highlights.point.6": "Vertical or horizontal video format",
        "service.event-highlights.point.7": "One round of reasonable revisions",
        "service.event-highlights.point.8": "Delivery within five business days of the event",
        "service.event-highlights.point.9": "Private digital download link",
        "quote.event-highlights.title": "Highlights",
        "quote.event-highlights.summary": "One edited highlight of the moments worth sharing.",
        "quote.event-highlights.baseLabel": "Highlights",
        "quote.event-highlights.baseDetail": "Up to 2 hours",
        "quote.event-highlights.overview.0": "Up to two hours of event coverage",
        "quote.event-highlights.overview.1": "Two-person filming crew",
        "quote.event-highlights.overview.2": "Professional ground-based videography",
        "quote.event-highlights.overview.3": "One drone flight, subject to conditions and permissions",
        "quote.event-highlights.overview.4": "One professionally edited 30–90-second highlight video",
        "quote.event-highlights.overview.5": "Colour grading and licensed background music",
        "quote.event-highlights.overview.6": "Vertical or horizontal video format",
        "quote.event-highlights.overview.7": "One round of reasonable revisions",
        "quote.event-highlights.overview.8": "Delivery within five business days of the event",
        "quote.event-highlights.overview.9": "Private digital download link",
        "service.full-day-event-coverage.title": "The Big One",
        "service.full-day-event-coverage.line": "More of everything.",
        "service.full-day-event-coverage.headline": "One event. Countless moments worth capturing.",
        "service.full-day-event-coverage.note.0":
          "The bigger the event, the more there is to see — and the harder it is to capture everything yourself.",
        "service.full-day-event-coverage.note.1":
          "The Big One is designed for organisers who want more than a single highlight video.",
        "service.full-day-event-coverage.note.2":
          "With extended filming, multiple aerial perspectives where permitted and a collection of professionally edited social media videos, we’ll document the atmosphere, people and moments that make your event unique.",
        "service.full-day-event-coverage.note.3":
          "From the opening moments to the final celebrations, we’ll work to capture the bigger picture and the smaller details that bring it all together.",
        "service.full-day-event-coverage.note.4":
          "You’ll walk away with a collection of content you can share, promote and revisit long after the event is over.",
        "service.full-day-event-coverage.includedHeading": "What’s included.",
        "service.full-day-event-coverage.point.0": "Up to five hours of event coverage",
        "service.full-day-event-coverage.point.1": "Two-person filming crew",
        "service.full-day-event-coverage.point.2": "Ground-based videography throughout the event",
        "service.full-day-event-coverage.point.3": "Up to three drone flights, subject to conditions and permissions",
        "service.full-day-event-coverage.point.4": "Three professionally edited social media videos",
        "service.full-day-event-coverage.point.5": "Colour grading and licensed background music",
        "service.full-day-event-coverage.point.6": "Vertical or horizontal video format",
        "service.full-day-event-coverage.point.7": "Catalogue of original, unedited footage",
        "service.full-day-event-coverage.point.8": "One round of reasonable revisions per edited video",
        "service.full-day-event-coverage.point.9": "Delivery within seven business days of the event",
        "service.full-day-event-coverage.point.10": "Private digital download link",
        "quote.full-day-event-coverage.title": "The Big One",
        "quote.full-day-event-coverage.summary": "Edited social videos and the original footage from the event.",
        "quote.full-day-event-coverage.baseLabel": "The Big One",
        "quote.full-day-event-coverage.baseDetail": "Up to 5 hours",
        "quote.full-day-event-coverage.overview.0": "Up to five hours of event coverage",
        "quote.full-day-event-coverage.overview.1": "Two-person filming crew",
        "quote.full-day-event-coverage.overview.2": "Ground-based videography throughout the event",
        "quote.full-day-event-coverage.overview.3": "Up to three drone flights, subject to conditions and permissions",
        "quote.full-day-event-coverage.overview.4": "Three professionally edited social media videos",
        "quote.full-day-event-coverage.overview.5": "Colour grading and licensed background music",
        "quote.full-day-event-coverage.overview.6": "Vertical or horizontal video format",
        "quote.full-day-event-coverage.overview.7": "Catalogue of original, unedited footage",
        "quote.full-day-event-coverage.overview.8": "One round of reasonable revisions per edited video",
        "quote.full-day-event-coverage.overview.9": "Delivery within seven business days of the event",
        "quote.full-day-event-coverage.overview.10": "Private digital download link",
        "service.something-else.note.0": "Not every project fits neatly into a package.",
        "service.something-else.note.1":
          "Whether you’re looking to showcase your business, document a project, capture an unusual perspective or bring a creative idea to life, we’d love to hear what you have in mind.",
        "service.something-else.note.2":
          "With aerial and ground-based photography and videography, we can tailor our approach to suit your project.",
        "service.something-else.note.3":
          "Tell us what you’re planning, what you’d like to achieve and how you intend to use the finished content.",
        "service.something-else.includedHeading": "What’s included.",
        "service.something-else.point.0": "Initial project consultation",
        "service.something-else.point.1": "Tailored filming or photography proposal",
        "service.something-else.point.2": "Clearly defined project deliverables",
        "service.something-else.point.3": "Agreed coverage and production requirements",
        "service.something-else.point.4": "Upfront pricing",
        "service.something-else.point.5": "Agreed delivery timeframe",
        "service.something-else.point.6": "Digital delivery of completed content",
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
