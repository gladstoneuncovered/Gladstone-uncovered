(() => {
  /**
   * Status calendar:
   * - available → book via Cal.com
   * - limited → inquiry (partial free / needs review / no roster)
   * - unavailable → closed
   */
  const SLOT_ORDER = ["morning", "afternoon", "night"];
  const STATE_LABELS = {
    available: "Available",
    limited: "Limited",
    unavailable: "Unavailable",
  };

  const root = document.querySelector("[data-availability]");
  if (!root) return;

  const monthLabel = root.querySelector("[data-cal-month]");
  const gridEl = root.querySelector("[data-cal-grid]");
  const dayTitle = root.querySelector("[data-day-title]");
  const dayMeta = root.querySelector("[data-day-meta]");
  const dayActions = root.querySelector("[data-day-actions]");
  const prevBtn = root.querySelector("[data-cal-prev]");
  const nextBtn = root.querySelector("[data-cal-next]");
  const bookSection = document.querySelector("[data-book-panel]");
  const inquireSection = document.querySelector("[data-inquire-panel]");

  let roster = null;
  let entryByDate = new Map();
  let viewYear = 2026;
  let viewMonth = 8;
  let selectedDate = null;

  function brisbaneToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Brisbane",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year").value;
    const m = parts.find((p) => p.type === "month").value;
    const d = parts.find((p) => p.type === "day").value;
    return `${y}-${m}-${d}`;
  }

  function normalizeShift(code) {
    if (!code) return "";
    return String(code)
      .trim()
      .split(/\s+/)[0]
      .replace(/\u2013|\u2014/g, "-");
  }

  function freeSlotsForShift(code) {
    const key = normalizeShift(code);
    if (!key) return { slots: [], inquire: true };
    const inquireCodes = roster?.inquireCodes || [];
    if (inquireCodes.includes(key)) return { slots: [], inquire: true };
    const map = roster?.shiftMap || {};
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return { slots: [...map[key]], inquire: false };
    }
    return { slots: [], inquire: true };
  }

  function combineUnion(sets) {
    const union = new Set();
    sets.forEach((set) => set.forEach((s) => union.add(s)));
    return SLOT_ORDER.filter((s) => union.has(s));
  }

  function dayAvailability(dateStr) {
    const today = brisbaneToday();
    const isPast = dateStr < today;
    const entry = entryByDate.get(dateStr);

    if (isPast) {
      return { state: "unavailable", isPast: true, bookable: false };
    }

    if (!entry) {
      return { state: "limited", isPast: false, bookable: false };
    }

    const people = roster.people || [];
    const perPerson = people.map((name) =>
      freeSlotsForShift(entry.shifts?.[name])
    );
    const slots = combineUnion(perPerson.map((p) => p.slots));
    const anyInquire = perPerson.some((p) => p.inquire);

    let state;
    if (slots.length === 3) state = "available";
    else if (slots.length > 0 || anyInquire) state = "limited";
    else state = "unavailable";

    return {
      state,
      isPast: false,
      bookable: state === "available",
      slots,
    };
  }

  function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function monthTitle(year, month) {
    const date = new Date(Date.UTC(year, month, 1, 12));
    return new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function padDate(year, month, day) {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  function renderCalendar() {
    if (!gridEl || !monthLabel) return;
    monthLabel.textContent = monthTitle(viewYear, viewMonth);

    const first = new Date(Date.UTC(viewYear, viewMonth, 1, 12));
    const weekday = (first.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(
      Date.UTC(viewYear, viewMonth + 1, 0, 12)
    ).getUTCDate();

    const frag = document.createDocumentFragment();
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((label) => {
      const el = document.createElement("div");
      el.className = "cal-weekday";
      el.textContent = label;
      frag.appendChild(el);
    });

    for (let i = 0; i < weekday; i += 1) {
      const blank = document.createElement("div");
      blank.className = "cal-day is-blank";
      blank.setAttribute("aria-hidden", "true");
      frag.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = padDate(viewYear, viewMonth, day);
      const info = dayAvailability(dateStr);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `cal-day is-${info.state}`;
      if (info.isPast) btn.classList.add("is-past");
      if (selectedDate === dateStr) btn.classList.add("is-selected");
      btn.dataset.date = dateStr;
      btn.setAttribute(
        "aria-label",
        `${formatDisplayDate(dateStr)}, ${STATE_LABELS[info.state]}`
      );

      const num = document.createElement("span");
      num.className = "cal-day-num";
      num.textContent = String(day);
      btn.appendChild(num);

      const status = document.createElement("span");
      status.className = "cal-day-status";
      status.textContent = STATE_LABELS[info.state];
      btn.appendChild(status);

      btn.addEventListener("click", () => selectDay(dateStr));
      frag.appendChild(btn);
    }

    const filled = weekday + daysInMonth;
    const trailing = (7 - (filled % 7)) % 7;
    for (let i = 0; i < trailing; i += 1) {
      const blank = document.createElement("div");
      blank.className = "cal-day is-blank";
      blank.setAttribute("aria-hidden", "true");
      frag.appendChild(blank);
    }

    gridEl.replaceChildren(frag);
  }

  function openCalForDate(dateStr) {
    const cfg = window.GLADSTONE_CONFIG || {};
    const calLink = String(cfg.calLink || "")
      .trim()
      .replace(/^https?:\/\/(www\.)?cal\.com\//i, "");
    if (!calLink) {
      window.open("https://cal.com", "_blank", "noopener,noreferrer");
      return;
    }
    // Prefill date when Cal.com supports it on the booking URL
    const url = `https://cal.com/${calLink}?date=${encodeURIComponent(dateStr)}`;
    if (typeof window.Cal === "function") {
      try {
        window.Cal("modal", {
          calLink,
          config: { layout: cfg.calLayout || "month_view", date: dateStr },
        });
        return;
      } catch {
        /* fall through */
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function bookingInbox() {
    const cfg = window.GLADSTONE_CONFIG || {};
    return (
      cfg.bookingEmail ||
      cfg.inquiryEmail ||
      window.GLADSTONE_BOOKING_EMAIL ||
      ""
    );
  }

  function openInquiry(dateStr) {
    const email = bookingInbox();
    const subject = `Gladstone Uncovered enquiry — ${dateStr}`;
    const body = [
      "Hi Gladstone Uncovered,",
      "",
      `I'd like to enquire about availability on ${formatDisplayDate(dateStr)}.`,
      "",
      "Project details:",
      "",
    ].join("\n");

    if (email) {
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      return;
    }
    inquireSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    const dateField = inquireSection?.querySelector("[data-inquire-date]");
    if (dateField) dateField.value = dateStr;
  }

  function renderDayPanel(dateStr) {
    if (!dayTitle || !dayMeta || !dayActions) return;

    if (!dateStr) {
      dayTitle.textContent = "Select a day";
      dayMeta.textContent =
        "Available days can be booked online. Limited days need a quick enquiry.";
      dayActions.replaceChildren();
      bookSection?.setAttribute("hidden", "");
      return;
    }

    const info = dayAvailability(dateStr);
    dayTitle.textContent = formatDisplayDate(dateStr);
    dayActions.replaceChildren();

    if (info.state === "available") {
      dayMeta.textContent = "Available — book a time online.";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-dark";
      btn.textContent = "Book this day";
      btn.addEventListener("click", () => {
        bookSection?.removeAttribute("hidden");
        openCalForDate(dateStr);
        bookSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dayActions.appendChild(btn);
      bookSection?.removeAttribute("hidden");
      inquireSection?.setAttribute("hidden", "");
      return;
    }

    if (info.state === "limited") {
      dayMeta.textContent =
        "Limited — this day needs a quick enquiry and we’ll confirm what’s possible.";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-dark";
      btn.textContent = "Send an enquiry";
      btn.addEventListener("click", () => openInquiry(dateStr));
      dayActions.appendChild(btn);
      bookSection?.setAttribute("hidden", "");
      inquireSection?.removeAttribute("hidden");
      const dateField = inquireSection?.querySelector("[data-inquire-date]");
      if (dateField) dateField.value = dateStr;
      return;
    }

    dayMeta.textContent = info.isPast
      ? "Unavailable — past date."
      : "Unavailable — this day isn’t open for booking.";
    bookSection?.setAttribute("hidden", "");
    inquireSection?.setAttribute("hidden", "");
  }

  function selectDay(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    renderDayPanel(dateStr);
  }

  function shiftMonth(delta) {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1, 12));
    viewYear = next.getUTCFullYear();
    viewMonth = next.getUTCMonth();
    renderCalendar();
  }

  function indexEntries(data) {
    entryByDate = new Map();
    (data.entries || []).forEach((entry) => {
      entryByDate.set(entry.date, entry);
    });
  }

  function pickInitialMonth() {
    const today = brisbaneToday();
    const dates = [...entryByDate.keys()].sort();
    if (!dates.length) {
      const [y, m] = today.split("-").map(Number);
      viewYear = y;
      viewMonth = m - 1;
      return;
    }
    const upcoming = dates.find((d) => d >= today) || dates[dates.length - 1];
    const [y, m] = upcoming.split("-").map(Number);
    viewYear = y;
    viewMonth = m - 1;
    const firstOpen = dates.find((d) => {
      const info = dayAvailability(d);
      return info.state === "available" || info.state === "limited";
    });
    if (firstOpen) selectedDate = firstOpen;
  }

  function applyRoster(data) {
    roster = data;
    indexEntries(data);
    pickInitialMonth();
    renderCalendar();
    renderDayPanel(selectedDate);
    root.classList.add("is-ready");
  }

  prevBtn?.addEventListener("click", () => shiftMonth(-1));
  nextBtn?.addEventListener("click", () => shiftMonth(1));

  const embedded = window.GLADSTONE_ROSTER;
  if (embedded?.entries) applyRoster(embedded);

  fetch("data/roster.json")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data?.entries) applyRoster(data);
    })
    .catch(() => {});
})();
