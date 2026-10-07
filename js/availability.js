(() => {
  const SLOT_ORDER = ["morning", "afternoon", "night"];
  const SLOT_LABELS = {
    morning: "Morning",
    afternoon: "Afternoon",
    night: "Night",
  };

  const root = document.querySelector("[data-availability]");
  if (!root) return;

  const monthLabel = root.querySelector("[data-cal-month]");
  const gridEl = root.querySelector("[data-cal-grid]");
  const dayTitle = root.querySelector("[data-day-title]");
  const dayMeta = root.querySelector("[data-day-meta]");
  const slotsEl = root.querySelector("[data-day-slots]");
  const prevBtn = root.querySelector("[data-cal-prev]");
  const nextBtn = root.querySelector("[data-cal-next]");

  const form = document.querySelector("[data-booking-form]");
  const dateField = form?.querySelector("#date");
  const timeField = form?.querySelector("#preferred-time");
  const serviceField = form?.querySelector("#service");
  const crewField = root.querySelector("[data-crew-mode]");

  const rosterPanel = document.querySelector("[data-roster-helper]");
  const rosterInput = rosterPanel?.querySelector("[data-roster-csv]");
  const rosterDownload = rosterPanel?.querySelector("[data-roster-download]");
  const rosterStatus = rosterPanel?.querySelector("[data-roster-status]");

  const bookingsPanel = document.querySelector("[data-bookings-panel]");
  const bookingsList = bookingsPanel?.querySelector("[data-bookings-list]");
  const bookingsDownload = bookingsPanel?.querySelector("[data-bookings-download]");
  const blockDateInput = bookingsPanel?.querySelector("[data-block-date]");
  const blockDateBtn = bookingsPanel?.querySelector("[data-block-date-btn]");

  const BOOKINGS_KEY = "gladstone-bookings";
  const SLOT_HOURS = {
    morning: { start: "060000", end: "120000" },
    afternoon: { start: "120000", end: "180000" },
    night: { start: "180000", end: "235959" },
  };

  let roster = null;
  let entryByDate = new Map();
  let remoteDays = new Map();
  let useRemote = false;
  let bookings = [];
  let viewYear = 2026;
  let viewMonth = 8; // 0-indexed; September
  let selectedDate = null;
  let crewMode = "one"; // one = union, both = intersection
  let remoteFetchToken = 0;

  function requiresBoth() {
    if (crewMode === "both") return true;
    if (crewMode === "one") return false;
    const service = serviceField?.value || "";
    const list = roster?.bothRequiredServices || [];
    return list.includes(service) || Boolean(roster?.requireBoth);
  }

  function loadBookings() {
    const seeded = Array.isArray(window.GLADSTONE_BOOKINGS)
      ? window.GLADSTONE_BOOKINGS
      : [];
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
      if (!Array.isArray(stored)) stored = [];
    } catch {
      stored = [];
    }
    const byId = new Map();
    [...seeded, ...stored].forEach((b) => {
      if (!b || !b.date) return;
      const id = b.id || `${b.date}-${b.slot || "day"}-${b.createdAt || b.name || ""}`;
      byId.set(id, { ...b, id });
    });
    bookings = [...byId.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  function persistBookings() {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  }

  function isDateBooked(dateStr) {
    return bookings.some((b) => b.date === dateStr);
  }

  function googleCalendarUrl(booking) {
    const hours = SLOT_HOURS[booking.slot] || {
      start: "090000",
      end: "170000",
    };
    const dateCompact = booking.date.replace(/-/g, "");
    const dates = `${dateCompact}T${hours.start}/${dateCompact}T${hours.end}`;
    const title = `Gladstone Uncovered — ${booking.serviceLabel || "Booking"}`;
    const details = [
      booking.name && `Client: ${booking.name}`,
      booking.email && `Email: ${booking.email}`,
      booking.phone && `Phone: ${booking.phone}`,
      booking.organisation && `Organisation: ${booking.organisation}`,
      booking.location && `Location: ${booking.location}`,
      booking.slot && `Preferred time: ${SLOT_LABELS[booking.slot] || booking.slot}`,
      booking.details && `Details: ${booking.details}`,
    ]
      .filter(Boolean)
      .join("\n");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates,
      details,
      location: booking.location || "",
      ctz: "Australia/Brisbane",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function serviceLabel(value) {
    const field = form?.querySelector("#service");
    const option = field && [...field.options].find((o) => o.value === value);
    return option?.textContent?.trim() || value || "Booking";
  }

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
    if (!key) return { slots: [], inquire: false };
    const inquireCodes = roster?.inquireCodes || [];
    if (inquireCodes.includes(key)) {
      return { slots: [], inquire: true };
    }
    const map = roster?.shiftMap || {};
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return { slots: [...map[key]], inquire: false };
    }
    // Unknown leave / codes → inquire
    return { slots: [], inquire: true };
  }

  function combineSlots(sets, requireBoth) {
    if (!sets.length) return [];
    if (requireBoth) {
      return SLOT_ORDER.filter((slot) =>
        sets.every((set) => set.includes(slot))
      );
    }
    const union = new Set();
    sets.forEach((set) => set.forEach((s) => union.add(s)));
    return SLOT_ORDER.filter((s) => union.has(s));
  }

  function monthRange() {
    const from = padDate(viewYear, viewMonth, 1);
    const lastDay = new Date(
      Date.UTC(viewYear, viewMonth + 1, 0, 12)
    ).getUTCDate();
    const to = padDate(viewYear, viewMonth, lastDay);
    return { from, to };
  }

  async function fetchRemoteAvailability() {
    if (!window.gladstoneApi?.configured()) {
      useRemote = false;
      remoteDays = new Map();
      return false;
    }
    const token = ++remoteFetchToken;
    const { from, to } = monthRange();
    try {
      const data = await window.gladstoneApi.call("availability", {
        query: { from, to, crew: crewMode },
      });
      if (token !== remoteFetchToken) return useRemote;
      remoteDays = new Map();
      (data.days || []).forEach((day) => {
        if (day?.date) remoteDays.set(day.date, day);
      });
      useRemote = true;
      return true;
    } catch (err) {
      console.warn("Availability API offline — using local roster", err);
      if (token !== remoteFetchToken) return useRemote;
      useRemote = false;
      remoteDays = new Map();
      return false;
    }
  }

  function dayAvailability(dateStr) {
    const today = brisbaneToday();
    const isPast = dateStr < today;

    if (useRemote && remoteDays.has(dateStr)) {
      const remote = remoteDays.get(dateStr);
      const slots = Array.isArray(remote.slots) ? remote.slots : [];
      return {
        state: remote.state || "inquire",
        slots,
        shifts: remote.shifts || null,
        bookable: !isPast && Boolean(remote.bookable) && slots.length > 0,
        isPast,
        isBooked: Boolean(remote.isBooked),
      };
    }

    if (isDateBooked(dateStr)) {
      return {
        state: "unavailable",
        slots: [],
        shifts: null,
        bookable: false,
        isPast,
        isBooked: true,
      };
    }

    const entry = entryByDate.get(dateStr);

    if (!entry) {
      return {
        state: "inquire",
        slots: [],
        shifts: null,
        bookable: false,
        isPast,
        isBooked: false,
      };
    }

    const people = roster.people || [];
    const perPerson = people.map((name) =>
      freeSlotsForShift(entry.shifts?.[name])
    );
    const slotSets = perPerson.map((p) => p.slots);
    const anyInquire = perPerson.some((p) => p.inquire);
    const slots = combineSlots(slotSets, requiresBoth());

    let state;
    if (slots.length === 3) state = "available";
    else if (slots.length > 0) state = "limited";
    else if (anyInquire) state = "inquire";
    else state = "unavailable";

    return {
      state,
      slots,
      shifts: entry.shifts,
      bookable: !isPast && slots.length > 0,
      isPast,
      isBooked: false,
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

  const STATE_LABELS = {
    available: "Available",
    limited: "Limited",
    unavailable: "Unavailable",
    inquire: "Inquire",
  };

  function renderCalendar() {
    if (!gridEl || !monthLabel) return;
    monthLabel.textContent = monthTitle(viewYear, viewMonth);

    const first = new Date(Date.UTC(viewYear, viewMonth, 1, 12));
    // Monday-first: Mon=0 … Sun=6
    const weekday = (first.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(
      Date.UTC(viewYear, viewMonth + 1, 0, 12)
    ).getUTCDate();

    const frag = document.createDocumentFragment();
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    weekdays.forEach((label) => {
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
      btn.dataset.date = dateStr;
      btn.setAttribute(
        "aria-label",
        `${formatDisplayDate(dateStr)}, ${info.state}${info.isPast ? ", past" : ""}`
      );
      if (selectedDate === dateStr) btn.classList.add("is-selected");

      const num = document.createElement("span");
      num.className = "cal-day-num";
      num.textContent = String(day);
      btn.appendChild(num);

      const status = document.createElement("span");
      status.className = "cal-day-status";
      if (info.isPast && info.state !== "inquire") {
        status.textContent = `Past · ${STATE_LABELS[info.state]}`;
      } else {
        status.textContent = STATE_LABELS[info.state] || "";
      }
      btn.appendChild(status);

      btn.addEventListener("click", () => selectDay(dateStr));
      frag.appendChild(btn);
    }

    // Pad trailing cells so the month fills complete weeks
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

  function renderDayPanel(dateStr) {
    if (!dayTitle || !dayMeta || !slotsEl) return;

    if (!dateStr) {
      dayTitle.textContent = "Select a day";
      dayMeta.textContent = "Select a date to see available times of day.";
      slotsEl.replaceChildren();
      return;
    }

    const info = dayAvailability(dateStr);
    dayTitle.textContent = formatDisplayDate(dateStr);

    const stateCopy = {
      available: "Available — full day open",
      limited: "Limited — only part of the day is open",
      unavailable: "Unavailable",
      inquire: "Inquire — availability needs confirmation",
    };
    let meta = stateCopy[info.state] || "";
    if (info.isBooked) meta = "Unavailable — already booked";
    else if (info.isPast && info.state !== "inquire") {
      meta = `Past date — not bookable (${STATE_LABELS[info.state].toLowerCase()})`;
    }
    dayMeta.textContent = meta;

    slotsEl.replaceChildren();

    if (!info.bookable) {
      const empty = document.createElement("p");
      empty.className = "day-slots-empty";
      empty.textContent = info.isBooked
        ? "This day is already booked."
        : info.state === "inquire"
          ? "Contact us to check this date — it isn’t open for instant booking."
          : info.isPast
            ? "Choose a future date from the calendar."
            : "No morning, afternoon or night slots are open on this day.";
      slotsEl.appendChild(empty);
      return;
    }

    info.slots.forEach((slot) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "slot-chip";
      chip.dataset.slot = slot;
      chip.innerHTML = `<strong>${SLOT_LABELS[slot]}</strong>`;
      chip.addEventListener("click", () => bookSlot(dateStr, slot));
      slotsEl.appendChild(chip);
    });
  }

  function selectDay(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    renderDayPanel(dateStr);
  }

  function bookSlot(dateStr, slot) {
    selectDay(dateStr);
    if (dateField) dateField.value = dateStr;
    if (timeField) timeField.value = slot;

    const formSection = document.getElementById("booking-form");
    formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    timeField?.focus?.();

    slotsEl?.querySelectorAll(".slot-chip").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.slot === slot);
    });
  }

  async function shiftMonth(delta) {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1, 12));
    viewYear = next.getUTCFullYear();
    viewMonth = next.getUTCMonth();
    await fetchRemoteAvailability();
    renderCalendar();
    if (selectedDate) renderDayPanel(selectedDate);
  }

  function parseCsv(text) {
    const lines = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new Error("Need a header row and at least one date row.");
    }

    const header = lines[0].split(",").map((h) => h.trim());
    const dateIdx = header.findIndex((h) => /^date$/i.test(h));
    if (dateIdx === -1) throw new Error('CSV must include a "date" column.');

    const people = (roster?.people || ["Dylan Talbot", "Haydn Scott"]).slice();
    const personIdx = people.map((name) => {
      const i = header.findIndex(
        (h) => h.toLowerCase() === name.toLowerCase()
      );
      if (i === -1) {
        throw new Error(`CSV must include a "${name}" column.`);
      }
      return i;
    });

    const entries = [];
    for (let r = 1; r < lines.length; r += 1) {
      const cols = lines[r].split(",").map((c) => c.trim());
      const date = cols[dateIdx];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid date on row ${r + 1}: ${date || "(empty)"}`);
      }
      const shifts = {};
      people.forEach((name, i) => {
        shifts[name] = normalizeShift(cols[personIdx[i]]);
      });
      entries.push({ date, shifts });
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    return entries;
  }

  function downloadRosterJson(entries) {
    const next = {
      timezone: roster?.timezone || "Australia/Brisbane",
      requireBoth: Boolean(roster?.requireBoth),
      people: roster?.people || ["Dylan Talbot", "Haydn Scott"],
      slots: roster?.slots || {
        morning: "6a–12",
        afternoon: "12–6",
        night: "6–12",
      },
      inquireCodes: roster?.inquireCodes || ["6p-2a"],
      shiftMap: roster?.shiftMap || {},
      bothRequiredServices: roster?.bothRequiredServices || ["live"],
      entries,
    };
    const blob = new Blob([JSON.stringify(next, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roster.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function wireRosterHelper() {
    if (!rosterPanel) return;

    rosterDownload?.addEventListener("click", () => {
      if (!rosterStatus) return;
      try {
        const entries = parseCsv(rosterInput?.value || "");
        downloadRosterJson(entries);
        rosterStatus.textContent = `Downloaded roster.json with ${entries.length} days. Replace data/roster.json in the project.`;
        rosterStatus.classList.remove("is-error");
      } catch (err) {
        rosterStatus.textContent = err.message || "Could not parse CSV.";
        rosterStatus.classList.add("is-error");
      }
    });
  }

  function renderBookingsPanel() {
    if (!bookingsList) return;
    bookingsList.replaceChildren();

    if (!bookings.length) {
      const empty = document.createElement("p");
      empty.className = "bookings-empty";
      empty.textContent = "No bookings recorded yet.";
      bookingsList.appendChild(empty);
      return;
    }

    bookings.forEach((booking) => {
      const row = document.createElement("div");
      row.className = "booking-row";

      const info = document.createElement("div");
      info.className = "booking-row-info";
      const title = document.createElement("strong");
      title.textContent = formatDisplayDate(booking.date);
      const meta = document.createElement("span");
      meta.textContent = [
        booking.slot && SLOT_LABELS[booking.slot],
        booking.name,
        booking.serviceLabel,
      ]
        .filter(Boolean)
        .join(" · ");
      info.append(title, meta);

      const actions = document.createElement("div");
      actions.className = "booking-row-actions";

      const calLink = document.createElement("a");
      calLink.className = "text-link";
      calLink.href = googleCalendarUrl(booking);
      calLink.target = "_blank";
      calLink.rel = "noopener noreferrer";
      calLink.textContent = "Add to Google Calendar";

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "booking-remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        bookings = bookings.filter((b) => b.id !== booking.id);
        persistBookings();
        renderBookingsPanel();
        renderCalendar();
        if (selectedDate) renderDayPanel(selectedDate);
      });

      actions.append(calLink, removeBtn);
      row.append(info, actions);
      bookingsList.appendChild(row);
    });
  }

  function addBooking(booking) {
    const id =
      booking.id ||
      `${booking.date}-${booking.slot || "day"}-${Date.now()}`;
    bookings = bookings.filter((b) => b.date !== booking.date);
    bookings.push({ ...booking, id });
    bookings.sort((a, b) => a.date.localeCompare(b.date));
    persistBookings();
    renderBookingsPanel();
    renderCalendar();
    if (selectedDate) renderDayPanel(selectedDate);
  }

  function notifyStudio(booking) {
    const email = window.GLADSTONE_BOOKING_EMAIL;
    if (!email) return;

    const gcal = googleCalendarUrl(booking);
    const body = [
      "New Gladstone Uncovered booking request",
      "",
      `Date: ${booking.date}`,
      `Time: ${SLOT_LABELS[booking.slot] || booking.slot || "—"}`,
      `Name: ${booking.name || "—"}`,
      `Email: ${booking.email || "—"}`,
      `Phone: ${booking.phone || "—"}`,
      `Organisation: ${booking.organisation || "—"}`,
      `Service: ${booking.serviceLabel || "—"}`,
      `Location: ${booking.location || "—"}`,
      "",
      "Details:",
      booking.details || "—",
      "",
      "Add this to Google Calendar:",
      gcal,
    ].join("\n");

    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
      `Booking request — ${booking.date}`
    )}&body=${encodeURIComponent(body)}`;
  }

  function wireBookingsPanel() {
    blockDateBtn?.addEventListener("click", () => {
      const date = (blockDateInput?.value || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      addBooking({
        date,
        slot: "",
        name: "Blocked",
        serviceLabel: "Manual block",
        createdAt: new Date().toISOString(),
      });
      if (blockDateInput) blockDateInput.value = "";
    });

    bookingsDownload?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(bookings, null, 2) + "\n"], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookings.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function wireBookingForm() {
    if (!form) return;
    form.setAttribute("data-booking-managed", "true");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const date = String(data.get("date") || "").trim();
      const slot = String(data.get("preferred-time") || "").trim();

      if (!date) {
        dateField?.focus();
        return;
      }
      if (!slot) {
        timeField?.focus();
        return;
      }
      if (!useRemote && isDateBooked(date)) {
        selectDay(date);
        return;
      }

      const booking = {
        date,
        slot,
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        organisation: String(data.get("organisation") || "").trim(),
        service: String(data.get("service") || "").trim(),
        serviceLabel: serviceLabel(String(data.get("service") || "")),
        location: String(data.get("location") || "").trim(),
        details: String(data.get("details") || "").trim(),
        createdAt: new Date().toISOString(),
      };

      const success = form.querySelector("[data-form-success]");
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (window.gladstoneApi?.configured()) {
          const result = await window.gladstoneApi.call("create-booking", {
            method: "POST",
            body: { ...booking, crewMode },
          });
          addBooking({
            ...booking,
            id: result.booking?.id || `${date}-${slot}-${Date.now()}`,
          });
          await fetchRemoteAvailability();
          form.reset();
          selectedDate = date;
          renderCalendar();
          renderDayPanel(date);
          if (success) {
            const assignee = result.assignee
              ? ` Assigned to ${result.assignee}.`
              : "";
            const gcal = result.googleEventCreated
              ? " Added to Google Calendar."
              : "";
            success.textContent = `Thanks — your booking is confirmed.${assignee}${gcal}`;
            success.classList.add("is-visible");
            success.focus?.();
          }
          return;
        }

        addBooking(booking);
        notifyStudio(booking);
        form.reset();
        selectedDate = date;
        renderCalendar();
        renderDayPanel(date);
        if (success) {
          success.textContent =
            "Thanks — your booking request is in. That day is now held as unavailable.";
          success.classList.add("is-visible");
          success.focus?.();
        }
      } catch (err) {
        if (success) {
          success.textContent =
            err.message || "Could not complete booking. Try again or email us.";
          success.classList.add("is-visible");
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
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

    const firstBookable = dates.find((d) => {
      const info = dayAvailability(d);
      return info.bookable;
    });
    if (firstBookable) selectedDate = firstBookable;
  }

  prevBtn?.addEventListener("click", () => shiftMonth(-1));
  nextBtn?.addEventListener("click", () => shiftMonth(1));

  async function refreshAvailabilityView() {
    await fetchRemoteAvailability();
    renderCalendar();
    renderDayPanel(selectedDate);
  }

  crewField?.addEventListener("change", () => {
    crewMode = crewField.value === "both" ? "both" : "one";
    refreshAvailabilityView();
  });

  serviceField?.addEventListener("change", () => {
    const service = serviceField.value;
    const bothList = roster?.bothRequiredServices || [];
    if (crewField && bothList.includes(service)) {
      crewField.value = "both";
      crewMode = "both";
    }
    refreshAvailabilityView();
  });

  wireRosterHelper();
  wireBookingsPanel();
  wireBookingForm();
  loadBookings();
  renderBookingsPanel();

  async function applyRoster(data) {
    roster = data;
    indexEntries(data);
    pickInitialMonth();
    await fetchRemoteAvailability();
    renderCalendar();
    renderDayPanel(selectedDate);
    root.classList.add("is-ready");
  }

  // Prefer embedded roster (works with file://). Refresh from JSON when served over HTTP.
  const embedded = window.GLADSTONE_ROSTER;
  if (embedded && embedded.entries) {
    applyRoster(embedded);
  }

  fetch("data/roster.json")
    .then((res) => {
      if (!res.ok) throw new Error("Roster file missing");
      return res.json();
    })
    .then((data) => {
      if (data && data.entries) applyRoster(data);
    })
    .catch(() => {
      if (!roster) {
        if (dayTitle) dayTitle.textContent = "Availability unavailable";
        if (dayMeta) {
          dayMeta.textContent =
            "Could not load roster data. Check js/roster-data.js or data/roster.json.";
        }
      }
    });

  fetch("data/bookings.json")
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => {
      if (!Array.isArray(data) || !data.length) return;
      window.GLADSTONE_BOOKINGS = [
        ...(window.GLADSTONE_BOOKINGS || []),
        ...data,
      ];
      loadBookings();
      renderBookingsPanel();
      renderCalendar();
      if (selectedDate) renderDayPanel(selectedDate);
    })
    .catch(() => {});
})();
