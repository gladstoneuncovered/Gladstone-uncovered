(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  if (header) {
    let lastY = window.scrollY;
    let shown = false;

    const pastHero = () => !hero || hero.getBoundingClientRect().bottom <= 8;

    const setShown = (next) => {
      shown = next;
      header.classList.toggle("is-ready", shown);
      header.toggleAttribute("inert", !shown);
    };

    const syncHeader = () => {
      if (!hero) {
        setShown(true);
        lastY = window.scrollY;
        return;
      }

      const y = window.scrollY;
      const goingUp = y < lastY - 6;
      const goingDown = y > lastY + 6;
      lastY = y;

      if (!pastHero()) {
        setShown(false);
        return;
      }
      if (goingDown) setShown(false);
      else if (goingUp) setShown(true);
    };

    setShown(false);
    window.addEventListener("scroll", syncHeader, { passive: true });
    window.addEventListener("resize", syncHeader);
    window.addEventListener("hashchange", syncHeader);
  }

  const enquireDialog = document.querySelector("[data-enquire-dialog]");

  function openEnquire() {
    if (!enquireDialog || typeof enquireDialog.showModal !== "function") return;
    if (!enquireDialog.open) enquireDialog.showModal();
    const field = enquireDialog.querySelector("[name=name]");
    if (field) field.focus();
  }

  function closeEnquire() {
    if (enquireDialog && enquireDialog.open) enquireDialog.close();
  }

  document.querySelectorAll("[data-enquire-open]").forEach((button) => {
    button.addEventListener("click", () => openEnquire());
  });

  document.querySelectorAll("[data-enquire-close]").forEach((button) => {
    button.addEventListener("click", () => closeEnquire());
  });

  if (enquireDialog) {
    enquireDialog.addEventListener("click", (event) => {
      if (event.target === enquireDialog) closeEnquire();
    });
    if (window.location.hash === "#enquire") openEnquire();
  }

  const track = document.querySelector("[data-gallery-track]");
  const prev = document.querySelector("[data-gallery-prev]");
  const next = document.querySelector("[data-gallery-next]");

  if (track && prev && next) {
    const scrollByCard = (dir) => {
      const card = track.querySelector("figure");
      const amount = card ? card.getBoundingClientRect().width + 12 : 280;
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    };

    prev.addEventListener("click", () => scrollByCard(-1));
    next.addEventListener("click", () => scrollByCard(1));
  }

  const form = document.querySelector("[data-booking-form]");
  if (form && !form.hasAttribute("data-booking-managed")) {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    const serviceField = form.querySelector("#service");
    if (service && serviceField) {
      const match = Array.from(serviceField.options).find(
        (option) => option.value === service
      );
      if (match) serviceField.value = service;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const success = form.querySelector("[data-form-success]");
      form.reset();
      if (success) {
        success.classList.add("is-visible");
        success.focus?.();
      }
    });
  } else if (form) {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    const serviceField = form.querySelector("#service");
    if (service && serviceField) {
      const match = Array.from(serviceField.options).find(
        (option) => option.value === service
      );
      if (match) serviceField.value = service;
    }
  }

  const reelTrack = document.querySelector("[data-reel-track]");
  const reelPrev = document.querySelector("[data-reel-prev]");
  const reelNext = document.querySelector("[data-reel-next]");

  const shuffleReelCards = () => {
    if (!reelTrack) return;
    const cards = Array.from(reelTrack.querySelectorAll(".reel-card"));
    for (let i = cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const current = cards[i];
      cards[i] = cards[j];
      cards[j] = current;
    }
    cards.forEach((card) => reelTrack.appendChild(card));
    reelTrack.scrollLeft = 0;
  };

  if (reelTrack && reelPrev && reelNext) {
    const step = () => {
      const card = reelTrack.querySelector(".reel-card");
      if (!card) return reelTrack.clientWidth;
      const gap = parseFloat(getComputedStyle(reelTrack).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const updateReelArrows = () => {
      const max = reelTrack.scrollWidth - reelTrack.clientWidth;
      reelPrev.disabled = reelTrack.scrollLeft <= 2;
      reelNext.disabled = reelTrack.scrollLeft >= max - 2;
    };

    shuffleReelCards();
    reelPrev.addEventListener("click", () => {
      reelTrack.scrollBy({ left: -step(), behavior: "smooth" });
    });
    reelNext.addEventListener("click", () => {
      reelTrack.scrollBy({ left: step(), behavior: "smooth" });
    });
    reelTrack.addEventListener("scroll", updateReelArrows, { passive: true });
    window.addEventListener("resize", updateReelArrows);
    reelTrack.addEventListener("gladstone:reels", () => {
      shuffleReelCards();
      updateReelArrows();
    });
    updateReelArrows();
  }

  const filmsTrack = document.querySelector("[data-films-track]");
  const filmsPrev = document.querySelector("[data-films-prev]");
  const filmsNext = document.querySelector("[data-films-next]");

  if (filmsTrack && filmsPrev && filmsNext) {
    const filmsStep = () => {
      const card = filmsTrack.querySelector(".home-film");
      if (!card) return filmsTrack.clientWidth;
      const gap = parseFloat(getComputedStyle(filmsTrack).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const updateFilmArrows = () => {
      const max = filmsTrack.scrollWidth - filmsTrack.clientWidth;
      const canScroll = max > 4;
      filmsPrev.disabled = !canScroll || filmsTrack.scrollLeft <= 2;
      filmsNext.disabled = !canScroll || filmsTrack.scrollLeft >= max - 2;
    };

    filmsPrev.addEventListener("click", () => {
      filmsTrack.scrollBy({ left: -filmsStep(), behavior: "smooth" });
    });
    filmsNext.addEventListener("click", () => {
      filmsTrack.scrollBy({ left: filmsStep(), behavior: "smooth" });
    });
    filmsTrack.addEventListener("scroll", updateFilmArrows, { passive: true });
    window.addEventListener("resize", updateFilmArrows);
    updateFilmArrows();
  }

  function formatReelViews(count) {
    const n = Number(count);
    if (!Number.isFinite(n) || n < 0) return "";
    if (n >= 1000000) {
      const millions = n / 1000000;
      const label =
        millions >= 10 ? String(Math.round(millions)) : millions.toFixed(1).replace(/\.0$/, "");
      return `${label}M views`;
    }
    if (n >= 1000) return `${Math.round(n / 1000)}K views`;
    return `${Math.round(n)} views`;
  }

  function applyReelViews(rows) {
    if (!Array.isArray(rows)) return;
    const byId = new Map();
    rows.forEach((row) => {
      if (!row || row.id == null) return;
      byId.set(String(row.id), row.views);
    });
    document.querySelectorAll("[data-reel-id]").forEach((card) => {
      const label = formatReelViews(byId.get(card.getAttribute("data-reel-id")));
      const node = card.querySelector(".reel-card-views");
      if (label && node) node.textContent = label;
    });
  }

  function loadReelViews() {
    if (!document.querySelector("[data-reel-id]")) return;
    const cfg = window.GLADSTONE_CONFIG || {};
    const base = String(cfg.supabaseUrl || "").replace(/\/$/, "");
    if (!base || !cfg.supabaseAnonKey) return;
    const headers = {
      apikey: cfg.supabaseAnonKey,
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
    };

    fetch(`${base}/rest/v1/reel_stats?select=id,views,updated_at`, { headers })
      .then((response) => (response.ok ? response.json() : null))
      .then((rows) => {
        applyReelViews(rows);
        const newest = Array.isArray(rows)
          ? rows.reduce((latest, row) => {
              const stamp = Date.parse(row && row.updated_at);
              return Number.isFinite(stamp) && stamp > latest ? stamp : latest;
            }, 0)
          : 0;
        if (newest && Date.now() - newest < 12 * 60 * 60 * 1000) return null;
        return fetch(`${base}/functions/v1/sync-reel-views`, { headers }).then((response) =>
          response.ok ? response.json() : null
        );
      })
      .then((payload) => {
        if (payload && Array.isArray(payload.reels)) applyReelViews(payload.reels);
      })
      .catch(() => {});
  }

  loadReelViews();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heroFilm = document.querySelector(".hero-media video");
  if (heroFilm && reducedMotion) {
    heroFilm.removeAttribute("autoplay");
    heroFilm.pause();
  }
  const canHoverPreview =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion;

  const reelCardFrom = (target) => {
    const card = target?.closest?.("[data-reel-preview]");
    if (!card || !reelTrack?.contains(card)) return null;
    if (!card.querySelector(".reel-card-video")) return null;
    return card;
  };

  const stopReel = (card) => {
    const video = card.querySelector(".reel-card-video");
    card.classList.remove("is-playing");
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  const playReel = (card) => {
    const video = card.querySelector(".reel-card-video");
    if (!video) return;
    document.querySelectorAll("[data-reel-preview].is-playing").forEach((other) => {
      if (other !== card) stopReel(other);
    });
    card.classList.add("is-playing");
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        card.classList.remove("is-playing");
      });
    }
  };

  if (reelTrack && canHoverPreview) {
    reelTrack.addEventListener("mouseover", (event) => {
      const card = reelCardFrom(event.target);
      if (!card || card.contains(event.relatedTarget)) return;
      playReel(card);
    });
    reelTrack.addEventListener("mouseout", (event) => {
      const card = reelCardFrom(event.target);
      if (!card || card.contains(event.relatedTarget)) return;
      stopReel(card);
    });
    reelTrack.addEventListener("focusin", (event) => {
      const card = reelCardFrom(event.target);
      if (card) playReel(card);
    });
    reelTrack.addEventListener("focusout", (event) => {
      const card = reelCardFrom(event.target);
      if (!card || card.contains(event.relatedTarget)) return;
      stopReel(card);
    });
  } else if (reelTrack && !reducedMotion) {
    reelTrack.addEventListener("click", (event) => {
      const card = reelCardFrom(event.target);
      if (!card || card.classList.contains("is-playing")) return;
      event.preventDefault();
      playReel(card);
    });
  }

  const filmCards = Array.from(document.querySelectorAll(".home-film")).filter((card) =>
    card.querySelector(".home-film-video")
  );
  if (filmCards.length) {
    const canPoint = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const stickyFilmsQuery = window.matchMedia("(max-width: 734px)");
    const servicesBlock = document.querySelector("body.page-home:not(.page-service) #services.home-films");
    const stickyCards = servicesBlock
      ? filmCards.filter((card) => servicesBlock.contains(card))
      : [];
    let hovered = null;
    let stickyActive = null;
    let filmFrame = 0;

    const filmSrc = (video) => {
      const raw = String(video.dataset.filmSrc || "").trim();
      if (!raw) return "";
      let url;
      try {
        url = new URL(raw, window.location.href);
      } catch {
        return "";
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") return "";
      return url.href;
    };

    const sameFilm = (video, src) => {
      const current = video.getAttribute("src") || "";
      if (!current) return false;
      try {
        const loaded = new URL(current, window.location.href);
        const next = new URL(src);
        loaded.hash = "";
        next.hash = "";
        return loaded.href === next.href;
      } catch {
        return false;
      }
    };

    const stickyLayout = () => stickyFilmsQuery.matches && stickyCards.length > 0 && !reducedMotion;

    const setStickTop = () => {
      if (!servicesBlock) return;
      const top = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
      servicesBlock.style.setProperty("--home-film-stick-top", `${Math.max(top, 0)}px`);
    };

    const containsProbe = (card, probe, pad = 0) => {
      const r = card.getBoundingClientRect();
      return r.top - pad <= probe && r.bottom + pad > probe;
    };

    const activeStickyCard = () => {
      if (!stickyLayout()) {
        stickyActive = null;
        return null;
      }
      const stickTop = header ? header.getBoundingClientRect().bottom : 0;
      const top = Math.max(stickTop, 0);
      const band = Math.max(window.innerHeight - top, 1);
      const probe = top + band * 0.42;
      const slack = Math.max(band * 0.1, 24);
      const hits = stickyCards.filter((card) => containsProbe(card, probe, 0));
      const preferred = hits.length ? hits[hits.length - 1] : null;
      if (preferred === stickyActive) return stickyActive;
      if (stickyActive && preferred) {
        const currentIndex = stickyCards.indexOf(stickyActive);
        const nextIndex = stickyCards.indexOf(preferred);
        if (nextIndex > currentIndex) {
          stickyActive = preferred;
          return stickyActive;
        }
        if (hits.includes(stickyActive) || containsProbe(stickyActive, probe, slack)) {
          return stickyActive;
        }
      }
      if (!preferred && stickyActive && containsProbe(stickyActive, probe, slack)) {
        return stickyActive;
      }
      stickyActive = preferred;
      return stickyActive;
    };

    const playingCard = () => (stickyLayout() ? activeStickyCard() : hovered);

    const nextStickyCard = (active) => {
      if (!active) return stickyCards[0] || null;
      const index = stickyCards.indexOf(active);
      if (index < 0) return stickyCards[0] || null;
      return stickyCards[index + 1] || null;
    };

    const shouldPrime = (card, active) => {
      if (!stickyLayout()) return true;
      if (!active) return card === stickyCards[0] || card === stickyCards[1];
      return card === active || card === nextStickyCard(active);
    };

    const readyFilm = (video) => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    };

    const primeFilm = (video, eager) => {
      const src = filmSrc(video);
      if (!src) return;
      readyFilm(video);
      if (!eager) {
        video.preload = "metadata";
        if (!video.paused) video.pause();
        return;
      }
      video.preload = "auto";
      if (!sameFilm(video, src)) {
        const frame = new URL(src);
        frame.hash = "t=0.001";
        video.src = frame.href;
      }
      if (video.dataset.frameReady === "1" || video.dataset.framePending === "1" || reducedMotion) return;
      video.dataset.framePending = "1";
      const card = video.closest(".home-film");
      const paint = () => {
        if (video.dataset.frameReady === "1") return;
        if (playingCard() === card) {
          video.dataset.frameReady = "1";
          return;
        }
        const pending = video.play();
        if (!pending || typeof pending.then !== "function") return;
        pending
          .then(() => {
            if (playingCard() !== card) video.pause();
            video.dataset.frameReady = "1";
          })
          .catch(() => {});
      };
      if (video.readyState >= 2) paint();
      else video.addEventListener("loadeddata", paint, { once: true });
    };

    const syncFilms = () => {
      const active = playingCard();
      filmCards.forEach((card) => {
        const video = card.querySelector(".home-film-video");
        if (!video) return;
        const src = filmSrc(video);
        const eager = shouldPrime(card, stickyLayout() ? active : card);
        primeFilm(video, eager);
        const playing = Boolean(src) && !reducedMotion && active === card;
        card.classList.toggle("is-active", playing);
        if (!playing) {
          if (video.dataset.frameReady === "1") video.pause();
          return;
        }
        readyFilm(video);
        video.preload = "auto";
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      });
    };

    if (canPoint) {
      filmCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          hovered = card;
          syncFilms();
        });
        card.addEventListener("mouseleave", () => {
          if (hovered === card) hovered = null;
          syncFilms();
        });
        card.addEventListener("focusin", () => {
          hovered = card;
          syncFilms();
        });
        card.addEventListener("focusout", (event) => {
          if (card.contains(event.relatedTarget)) return;
          if (hovered === card) hovered = null;
          syncFilms();
        });
      });
    }

    const onFilmScroll = () => {
      if (filmFrame) return;
      filmFrame = requestAnimationFrame(() => {
        filmFrame = 0;
        setStickTop();
        syncFilms();
      });
    };

    if (stickyCards.length) {
      setStickTop();
      window.addEventListener("scroll", onFilmScroll, { passive: true });
      window.addEventListener("resize", onFilmScroll);
      if (typeof stickyFilmsQuery.addEventListener === "function") {
        stickyFilmsQuery.addEventListener("change", onFilmScroll);
      } else if (typeof stickyFilmsQuery.addListener === "function") {
        stickyFilmsQuery.addListener(onFilmScroll);
      }
    }

    syncFilms();

    const watchSrc = new MutationObserver(() => syncFilms());
    filmCards.forEach((card) => {
      const video = card.querySelector(".home-film-video");
      if (!video) return;
      watchSrc.observe(video, { attributes: true, attributeFilter: ["data-film-src"] });
    });
  }

  document.querySelectorAll(".faq-item").forEach((item) => {
    const button = item.querySelector("button");
    if (!button) return;
    button.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
  });
})();
