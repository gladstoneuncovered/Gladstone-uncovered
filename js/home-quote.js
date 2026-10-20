(() => {
  const root = document.querySelector("[data-slim-quote]");
  const packages = window.GLADSTONE_SERVICE_QUOTES;
  if (!root || !packages || !packages.length) return;

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  const homeMount = root.parentElement;
  const quoteSheet = document.querySelector("[data-quote-sheet]");
  const quoteSheetSlot = quoteSheet && quoteSheet.querySelector("[data-quote-sheet-slot]");
  const lockedId = (root.getAttribute("data-slim-quote") || "").trim();
  let pack = packages.find((item) => item.id === lockedId) || null;
  let previewId = pack ? pack.id : packages[0].id;
  const floor = pack ? 1 : 0;
  let page = floor;
  let cardHost = null;
  let sheetClosing = false;
  const selected = {};
  const quantities = {};
  const extras = {};
  let sent = false;
  let overviewOpen = false;
  const SOMETHING_ELSE = "something-else";
  const enquire = { name: "", email: "", phone: "", message: "" };
  let enquireSent = false;
  const details = { name: "", email: "", phone: "", date: "", time: "", address: null, more: "" };

  function isServicePage() {
    return document.body.classList.contains("page-service");
  }

  function isCardMode() {
    return Boolean(cardHost);
  }

  function quoteFloor() {
    if (lockedId) return 1;
    if (cardHost === quoteSheet) return 0;
    if (isCardMode() && pack) return 1;
    return 0;
  }

  function setCardHitEnabled(card, enabled) {
    const hit = card && card.querySelector(".home-film-hit");
    if (!hit) return;
    if (enabled) hit.removeAttribute("inert");
    else hit.setAttribute("inert", "");
  }

  function closeCardQuote(options) {
    if (sheetClosing) return;
    if (!cardHost && !(quoteSheet && quoteSheet.open)) return;
    sheetClosing = true;
    rememberEnquire();
    rememberFields();
    const card = cardHost;
    const trigger = card && card.querySelector("[data-card-quote]");
    if (card) {
      card.classList.remove("is-quoting", "is-quote-long");
      setCardHitEnabled(card, true);
    }
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (homeMount) homeMount.appendChild(root);
    document.body.classList.remove("has-card-quote");
    if (quoteSheet && quoteSheet.open && !(options && options.fromDialog)) {
      quoteSheet.close();
    }
    cardHost = null;
    if (!lockedId) {
      pack = null;
      page = 0;
      previewId = packages[0].id;
      Object.keys(selected).forEach((key) => delete selected[key]);
      Object.keys(quantities).forEach((key) => delete quantities[key]);
      Object.keys(extras).forEach((key) => delete extras[key]);
      sent = false;
      overviewOpen = false;
    }
    sheetClosing = false;
    if (!options || !options.silent) render();
  }

  function openCardQuote(card, id) {
    if (!card || !id) return;
    const sameCard = cardHost === card;
    const sameService =
      (id === SOMETHING_ELSE && !pack && previewId === SOMETHING_ELSE) ||
      (pack && pack.id === id);
    if (sameCard && sameService && quoteSheet && quoteSheet.open) return;
    if (cardHost) closeCardQuote({ silent: true });
    const mount = quoteSheetSlot || card.querySelector("[data-film-quote-slot]");
    if (!mount) return;
    cardHost = card;
    const trigger = card.querySelector("[data-card-quote]");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    document.body.classList.add("has-card-quote");
    mount.hidden = false;
    mount.appendChild(root);
    if (quoteSheet && typeof quoteSheet.showModal === "function" && !quoteSheet.open) {
      quoteSheet.showModal();
    }
    if (id === SOMETHING_ELSE) {
      pack = null;
      previewId = SOMETHING_ELSE;
      page = 0;
      sent = false;
      overviewOpen = false;
      render();
      return;
    }
    chooseService(id);
  }

  function pickerPackages() {
    const order = [
      "full-day-event-coverage",
      "event-highlights",
      "aerial-video",
      "real-estate-drone-photography",
      "drone-inspections",
    ];
    const ranked = order
      .map((id) => packages.find((item) => item.id === id))
      .filter(Boolean);
    packages.forEach((item) => {
      if (!ranked.includes(item)) ranked.push(item);
    });
    return ranked;
  }

  function resetBuilder() {
    pack = null;
    page = 0;
    previewId = packages[0] ? packages[0].id : "";
    Object.keys(selected).forEach((key) => delete selected[key]);
    Object.keys(quantities).forEach((key) => delete quantities[key]);
    Object.keys(extras).forEach((key) => delete extras[key]);
    sent = false;
    overviewOpen = false;
  }

  function openQuotePicker() {
    if (!quoteSheet || !quoteSheetSlot || lockedId) return;
    if (cardHost === quoteSheet && quoteSheet.open) return;
    if (cardHost) closeCardQuote({ silent: true });
    resetBuilder();
    cardHost = quoteSheet;
    document.body.classList.add("has-card-quote");
    quoteSheetSlot.hidden = false;
    quoteSheetSlot.appendChild(root);
    render();
    if (typeof quoteSheet.showModal === "function" && !quoteSheet.open) {
      quoteSheet.showModal();
    }
  }

  function filmServicePicker() {
    const choices = pickerPackages()
      .map((item) => {
        const price =
          typeof item.basePriceCents === "number" ? `From ${formatMoney(item.basePriceCents)}` : "";
        return `<button type="button" class="film-quote-choice" data-service="${escapeHtml(item.id)}">
          <span class="film-quote-choice-label">${escapeHtml(item.title)}</span>
          ${price ? `<span class="slim-pill-price">${escapeHtml(price)}</span>` : ""}
        </button>`;
      })
      .join("");
    const other = `<button type="button" class="film-quote-choice" data-enquire><span class="film-quote-choice-label">${escapeHtml(
      copy("quote.chrome.somethingElse", "Something Else?")
    )}</span></button>`;
    return `<p class="film-quote-ask">${escapeHtml(
      copy("quote.chrome.chooseService", "Choose a service.")
    )}</p>
      <div class="film-quote-choices is-cols-2">${choices}${other}</div>`;
  }

  function copy(key, fallback) {
    const value = window.GLADSTONE_COPY && window.GLADSTONE_COPY[key];
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMoney(cents) {
    return money.format(cents / 100);
  }

  function steps() {
    return (pack && pack.steps) || [];
  }

  function optionById(step, id) {
    return (step.options || []).find((item) => item.id === id) || null;
  }

  function selectionList(step) {
    const value = selected[step.id];
    if (step.type === "multi") return Array.isArray(value) ? value.slice() : [];
    return value ? [value] : [];
  }

  function quantityOf(step, id) {
    const qty = (quantities[step.id] || {})[id];
    return Number.isInteger(qty) && qty > 0 ? qty : 1;
  }

  function isHidden(step, option) {
    return Boolean(option.parent) && !selectionList(step).includes(option.parent);
  }

  function isLocked(step, option) {
    return (step.options || []).some(
      (item) =>
        selectionList(step).includes(item.id) &&
        Array.isArray(item.disables) &&
        item.disables.includes(option.id)
    );
  }

  function prune(step) {
    let list = selectionList(step);
    const disabled = new Set();
    (step.options || []).forEach((option) => {
      if (!list.includes(option.id) || !Array.isArray(option.disables)) return;
      option.disables.forEach((id) => disabled.add(id));
    });
    list = list.filter((id) => !disabled.has(id));
    list = list.filter((id) => {
      const option = optionById(step, id);
      return !option || !option.parent || list.includes(option.parent);
    });
    selected[step.id] = step.type === "multi" ? list : list[0] || "";
    if (quantities[step.id]) {
      Object.keys(quantities[step.id]).forEach((id) => {
        if (!list.includes(id)) delete quantities[step.id][id];
      });
    }
  }

  function reelSplit(during, included) {
    const after = Math.max(0, included - during);
    const word = (count) => (count === 1 ? "reel" : "reels");
    if (after === 0) return `${during} ${word(during)} delivered during the event.`;
    return `${during} ${word(during)} during the event, ${after} ${word(after)} after.`;
  }

  function infoText(option, qty) {
    const parts = [];
    if (option.detail) parts.push(option.detail);
    if (option.countsToward && qty) {
      parts.push(reelSplit(Math.min(qty, option.countsToward), option.countsToward));
    }
    return parts.join(" ");
  }

  function lines() {
    if (!pack) return [];
    const rows = [];
    if (typeof pack.basePriceCents === "number") {
      rows.push({
        label: pack.baseLabel || pack.title,
        priceCents: pack.basePriceCents,
      });
    }
    steps().forEach((step) => {
      if (step.acknowledge) return;
      selectionList(step).forEach((id) => {
        const option = optionById(step, id);
        if (!option) return;
        const qty = option.quantity ? quantityOf(step, id) : 1;
        let label = option.label;
        if (option.input) {
          const text = String(extras[step.id] || "").trim();
          if (text) label = `${option.label}: ${text}`;
        }
        if (option.quantity && qty > 1) label = `${label} × ${qty}`;
        const unit = option.priceCents;
        rows.push({
          label,
          priceCents: typeof unit === "number" ? unit * qty : unit,
          confirm: Boolean(option.confirm),
          included: Boolean(option.included),
          note: option.note || "",
        });
      });
    });
    return rows;
  }

  function totalCents(rows) {
    return rows.reduce(
      (sum, row) => (typeof row.priceCents === "number" ? sum + row.priceCents : sum),
      0
    );
  }

  function priceLabel(total, baseCents) {
    const prefix =
      typeof baseCents === "number" && total === baseCents
        ? copy("quote.chrome.from", "From")
        : copy("quote.chrome.est", "Est.");
    return `${prefix} ${formatMoney(total)}`;
  }

  function compactPrice(item, rows) {
    if (!item || typeof item.basePriceCents !== "number") return "";
    const live = pack && pack.id === item.id && page > 0;
    const total = live ? totalCents(rows || lines()) : item.basePriceCents;
    return priceLabel(total, item.basePriceCents);
  }

  function overviewToggleLabel() {
    return overviewOpen
      ? copy("quote.chrome.hideIncluded", "Hide what's included ↑")
      : copy("quote.chrome.viewIncluded", "View what's included ↓");
  }

  function optionPrice(step, option) {
    if (step.acknowledge) return "";
    const price =
      option.note ||
      (option.included
        ? copy("quote.chrome.included", "Included")
        : typeof option.priceCents === "number"
          ? formatMoney(option.priceCents)
          : option.confirm
            ? copy("quote.chrome.confirm", "Price confirmed")
            : "");
    return price
      ? `<span class="slim-option-price"><strong>${escapeHtml(price)}</strong></span>`
      : "";
  }

  function pillPrice(step, option) {
    if (step.acknowledge || option.included) return "";
    const price =
      option.note ||
      (typeof option.priceCents === "number"
        ? formatMoney(option.priceCents)
        : option.confirm
          ? copy("quote.chrome.confirm", "Price confirmed")
          : "");
    return price ? `<span class="slim-pill-price">${escapeHtml(price)}</span>` : "";
  }

  function renderOption(step, option) {
    if (isHidden(step, option)) return "";
    const chosen = selectionList(step).includes(option.id);
    const locked = isLocked(step, option);
    const qty = chosen && option.quantity ? quantityOf(step, option.id) : 1;
    const max = option.max || 12;
    const stepper =
      chosen && option.quantity
        ? `<span class="slim-qty">
            <button type="button" data-qty="down" data-step="${escapeHtml(step.id)}" data-qty-option="${escapeHtml(option.id)}" aria-label="Fewer ${escapeHtml(option.label)}"${qty <= 1 ? " disabled" : ""}>−</button>
            <span>${qty}</span>
            <button type="button" data-qty="up" data-step="${escapeHtml(step.id)}" data-qty-option="${escapeHtml(option.id)}" aria-label="More ${escapeHtml(option.label)}"${qty >= max ? " disabled" : ""}>+</button>
          </span>`
        : "";
    const extra =
      chosen && option.input
        ? `<div class="slim-extra slim-pill-extra">
            <input type="text" data-extra="${escapeHtml(step.id)}" value="${escapeHtml(extras[step.id] || "")}" placeholder="${escapeHtml(option.inputLabel || "Details")}" aria-label="${escapeHtml(option.inputLabel || "Details")}" />
          </div>`
        : "";
    const detail = infoText(option, qty);
    if (step.acknowledge) {
      return `<div class="slim-line">
      <div class="slim-row is-ack${chosen ? " is-selected" : ""}${locked ? " is-locked" : ""}">
        <button type="button" class="slim-pick" data-step="${escapeHtml(step.id)}" data-option="${escapeHtml(option.id)}"${locked ? " disabled" : ""}>
          <span class="slim-option-copy">
            <span class="slim-label">${escapeHtml(option.label)}</span>
            ${detail ? `<span class="slim-read">${escapeHtml(detail)}</span>` : ""}
          </span>
          ${optionPrice(step, option)}
        </button>
      </div>
    </div>`;
    }
    const pill = `<button type="button" class="slim-pill${chosen ? " is-selected" : ""}${
      locked ? " is-locked" : ""
    }" data-step="${escapeHtml(step.id)}" data-option="${escapeHtml(option.id)}"${locked ? " disabled" : ""}>
        <span class="slim-pill-label">${escapeHtml(option.label)}</span>
        ${pillPrice(step, option)}
      </button>`;
    const cluster = stepper
      ? `<span class="slim-pill-wrap${chosen ? " is-selected" : ""}">${pill}${stepper}</span>`
      : pill;
    return `${cluster}${extra}`;
  }

  function renderFilmChoice(step, option) {
    if (isHidden(step, option)) return "";
    if (step.acknowledge) return renderOption(step, option);
    const chosen = selectionList(step).includes(option.id);
    const locked = isLocked(step, option);
    const qty = chosen && option.quantity ? quantityOf(step, option.id) : 1;
    const max = option.max || 12;
    const stepper =
      chosen && option.quantity
        ? `<span class="slim-qty">
            <button type="button" data-qty="down" data-step="${escapeHtml(step.id)}" data-qty-option="${escapeHtml(option.id)}" aria-label="Fewer ${escapeHtml(option.label)}"${qty <= 1 ? " disabled" : ""}>−</button>
            <span>${qty}</span>
            <button type="button" data-qty="up" data-step="${escapeHtml(step.id)}" data-qty-option="${escapeHtml(option.id)}" aria-label="More ${escapeHtml(option.label)}"${qty >= max ? " disabled" : ""}>+</button>
          </span>`
        : "";
    const extra =
      chosen && option.input
        ? `<div class="slim-extra film-quote-extra">
            <input type="text" data-extra="${escapeHtml(step.id)}" value="${escapeHtml(extras[step.id] || "")}" placeholder="${escapeHtml(option.inputLabel || "Details")}" aria-label="${escapeHtml(option.inputLabel || "Details")}" />
          </div>`
        : "";
    const tile = `<button type="button" class="film-quote-choice${chosen ? " is-selected" : ""}${
      locked ? " is-locked" : ""
    }" data-step="${escapeHtml(step.id)}" data-option="${escapeHtml(option.id)}"${locked ? " disabled" : ""}>
        <span class="film-quote-choice-label">${escapeHtml(option.label)}</span>
        ${pillPrice(step, option)}
      </button>`;
    const cluster = stepper
      ? `<span class="film-quote-choice-wrap${chosen ? " is-selected" : ""}">${tile}${stepper}</span>`
      : tile;
    return `${cluster}${extra}`;
  }

  function filmIncludes() {
    if (!pack) return "";
    const points = Array.isArray(pack.overview) ? pack.overview : [];
    if (!points.length) {
      return pack.teaser ? `<p class="film-quote-teaser">${escapeHtml(pack.teaser)}</p>` : "";
    }
    return `<ul class="film-quote-includes">${points
      .slice(0, 4)
      .map((point) => `<li>${escapeHtml(point)}</li>`)
      .join("")}</ul>`;
  }

  function renderGroup(title, hint, rows, stepLabel, variant) {
    return `<section class="slim-group">
      ${stepLabel ? `<p class="slim-step-index">${escapeHtml(stepLabel)}</p>` : ""}
      <h3 class="slim-group-title"><strong>${escapeHtml(title)}.</strong>${
        hint ? ` <span>${escapeHtml(hint)}</span>` : ""
      }</h3>
      <div class="slim-rows${variant === "pills" ? " slim-rows--pills" : ""}">${rows}</div>
    </section>`;
  }

  function rememberEnquire() {
    const form = root.querySelector("[data-quote-enquire]");
    if (!form) return;
    enquire.name = String((form.elements.name && form.elements.name.value) || "");
    enquire.email = String((form.elements.email && form.elements.email.value) || "");
    enquire.phone = String((form.elements.phone && form.elements.phone.value) || "");
    enquire.message = String((form.elements.message && form.elements.message.value) || "");
  }

  function bindEnquireForm() {
    const form = root.querySelector("[data-quote-enquire]");
    if (!form || typeof window.GLADSTONE_BIND_CONTACT_FORM !== "function") return;
    window.GLADSTONE_BIND_CONTACT_FORM(form);
  }

  function enquireForm() {
    const title = copy("service.something-else.enquire.title", "Tell us your idea.");
    const success = enquireSent
      ? `<p class="slim-success is-visible" data-contact-success role="status">${escapeHtml(
          copy("quote.chrome.enquirySent", "Message sent. We’ll reply to the email you entered.")
        )}</p>`
      : `<p class="slim-success" data-contact-success role="status"></p>`;
    return `<form
      class="slim-quote-form slim-overview-enquire"
      data-contact-form
      data-quote-enquire
      data-contact-source="Something Else"
      data-contact-subject="Something Else — Gladstone Uncovered"
      novalidate
    >
      <div class="slim-fields">
        <input name="name" type="text" autocomplete="name" placeholder="${escapeHtml(copy("quote.chrome.name", "Name"))}" aria-label="${escapeHtml(copy("quote.chrome.name", "Name"))}" required value="${escapeHtml(enquire.name)}" />
        <input name="email" type="email" autocomplete="email" placeholder="${escapeHtml(copy("quote.chrome.email", "Email"))}" aria-label="${escapeHtml(copy("quote.chrome.email", "Email"))}" required value="${escapeHtml(enquire.email)}" />
        <input name="phone" type="tel" autocomplete="tel" placeholder="Phone (optional)" aria-label="Phone (optional)" value="${escapeHtml(enquire.phone)}" />
      </div>
      <label class="slim-more">
        <span class="sr-only">Your idea</span>
        <textarea name="message" rows="5" placeholder="What are you thinking?" required>${escapeHtml(enquire.message)}</textarea>
      </label>
      <div class="slim-send-row">
        <button class="apple-btn apple-btn--fill slim-send" type="submit">Send enquiry →</button>
      </div>
      <p class="slim-error" data-contact-error role="alert"></p>
      ${success}
    </form>`;
  }

  function enquireOverview() {
    const title = copy("service.something-else.enquire.title", "Tell us your idea.");
    const heading = copy("quote.chrome.somethingElse", "Something Else?");
    const teaser = copy("quote.chrome.somethingElseDetail", "Have something different in mind?");
    return `<div class="slim-overview-compact">
      <p class="slim-overview-compact-line"><strong>${escapeHtml(heading)}</strong></p>
      <p class="slim-overview-teaser">${escapeHtml(teaser)}</p>
    </div>
    <h3 class="slim-overview-title">${escapeHtml(title)}</h3>
    ${enquireForm()}`;
  }

  function overviewContent(item, rows) {
    const points = Array.isArray(item.overview) ? item.overview : [];
    const list = points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    const price =
      typeof item.basePriceCents === "number"
        ? `<p class="slim-overview-price"><span>${escapeHtml(copy("quote.chrome.startingFrom", "Starting from"))}</span><strong>${escapeHtml(formatMoney(item.basePriceCents))}</strong></p>`
        : "";
    const figure = page <= 0 ? "" : compactPrice(item, rows);
    const compact = `<div class="slim-overview-compact">
      <p class="slim-overview-compact-line"><strong>${escapeHtml(item.title)}</strong>${
        figure ? ` — ${escapeHtml(figure)}` : ""
      }</p>
      ${page > 0 && item.teaser ? `<p class="slim-overview-teaser">${escapeHtml(item.teaser)}</p>` : ""}
      ${
        list
          ? `<button type="button" class="slim-overview-toggle" data-overview-toggle aria-expanded="${
              overviewOpen ? "true" : "false"
            }" aria-controls="slim-overview-inclusions">${escapeHtml(overviewToggleLabel())}</button>`
          : ""
      }
    </div>`;
    return `${compact}<h3 class="slim-overview-title">${escapeHtml(item.title)}</h3>
      <p class="slim-overview-summary">${escapeHtml(item.summary)}</p>
      ${list ? `<ul class="slim-overview-list" id="slim-overview-inclusions">${list}</ul>` : ""}
      ${price}`;
  }

  function renderOverview(rows) {
    if (isServicePage() || isCardMode()) return "";
    const enquirePreview = previewId === SOMETHING_ELSE;
    const item = enquirePreview
      ? null
      : packages.find((candidate) => candidate.id === previewId) || packages[0];
    const label = enquirePreview
      ? `${copy("quote.chrome.somethingElse", "Something Else?")} enquiry`
      : `${item.title} overview`;
    return `<aside class="slim-quote-overview${overviewOpen ? " is-open" : ""}${
      enquirePreview ? " is-enquire" : ""
    }" data-quote-overview aria-label="${escapeHtml(label)}">
      ${enquirePreview ? enquireOverview() : overviewContent(item, rows)}
    </aside>`;
  }

  function showOverview(id) {
    const overview = root.querySelector("[data-quote-overview]");
    if (!overview || previewId === id) return;
    const enquirePreview = id === SOMETHING_ELSE;
    const item = enquirePreview ? null : packages.find((candidate) => candidate.id === id);
    if (!enquirePreview && !item) return;
    const config = root.querySelector(".slim-quote-config");
    const configTop = config ? config.getBoundingClientRect().top : null;
    rememberEnquire();
    previewId = id;
    overview.classList.toggle("is-open", overviewOpen);
    overview.classList.toggle("is-enquire", enquirePreview);
    if (enquirePreview) {
      overview.setAttribute(
        "aria-label",
        `${copy("quote.chrome.somethingElse", "Something Else?")} enquiry`
      );
      overview.innerHTML = enquireOverview();
      bindEnquireForm();
    } else {
      overview.setAttribute("aria-label", `${item.title} overview`);
      overview.innerHTML = overviewContent(item);
    }
    const enquireRow = root.querySelector("[data-enquire]");
    if (enquireRow) enquireRow.classList.toggle("is-selected", enquirePreview);
    if (configTop === null || !config) return;
    const shift = config.getBoundingClientRect().top - configTop;
    if (Math.abs(shift) >= 1) window.scrollBy({ top: shift, behavior: "instant" });
  }

  function summaryText(rows) {
    const body = rows
      .map((row) => {
        const value = row.confirm
          ? copy("quote.chrome.confirm", "Price confirmed")
          : row.included
            ? "Included"
            : typeof row.priceCents === "number"
              ? formatMoney(row.priceCents)
              : "";
        return `${row.label}${value ? ` — ${value}` : ""}`;
      })
      .join("\n");
    const confirm = rows.some((row) => row.confirm);
    return `${pack.title}\n${body}\n\n${copy("quote.chrome.from", "From")} ${formatMoney(totalCents(rows))}${
      confirm ? "\nSome items are not included until we confirm them." : ""
    }`;
  }

  function missing() {
    if (!pack) return copy("quote.chrome.chooseOne", "Choose a service.");
    const step = steps().find((item) => {
      if (item.acknowledge || item.requireAll) {
        return (item.options || []).some((option) => !selectionList(item).includes(option.id));
      }
      if (item.required && !selectionList(item).length) return true;
      return false;
    });
    if (step) {
      if (step.acknowledge) return copy("quote.chrome.acceptAll", "Accept each point to send the quote.");
      const article = /^[aeiou]/i.test(step.title) ? "an" : "a";
      return `Choose ${article} ${step.title.toLowerCase()}.`;
    }
    const extra = steps().find((item) => {
      const option = optionById(item, selected[item.id]);
      return option && option.input && !String(extras[item.id] || "").trim();
    });
    if (extra) {
      const option = optionById(extra, selected[extra.id]);
      return (option && option.inputError) || copy("quote.chrome.missingDetail", "Add the missing detail.");
    }
    return "";
  }

  function currentStep() {
    if (!pack || page < 1 || page > steps().length) return null;
    return steps()[page - 1];
  }

  function stepReady(step) {
    if (!step) return false;
    if (step.acknowledge || step.requireAll) {
      return (step.options || []).every((option) => selectionList(step).includes(option.id));
    }
    if (step.type === "multi") return true;
    if (!selectionList(step).length) return false;
    const option = optionById(step, selected[step.id]);
    if (option && option.input && !String(extras[step.id] || "").trim()) return false;
    return true;
  }

  function advance() {
    page += 1;
    render({ preservePosition: true });
  }

  function lineValue(row) {
    if (row.confirm) return row.note || copy("quote.chrome.confirm", "Price confirmed");
    if (row.included) return copy("quote.chrome.included", "Included");
    if (typeof row.priceCents === "number") return formatMoney(row.priceCents);
    return "";
  }

  function rundown() {
    const items = lines();
    const list = items
      .map((row) => {
        const value = lineValue(row);
        return `<li><span>${escapeHtml(row.label)}</span>${value ? `<span>${escapeHtml(value)}</span>` : ""}</li>`;
      })
      .join("");
    return `<section class="slim-group">
      <h3 class="slim-group-title">${escapeHtml(copy("quote.chrome.yourQuote", "Your estimate"))}</h3>
      <ul class="slim-rundown">
        ${list}
        <li class="is-total"><span>${escapeHtml(copy("quote.chrome.estimatedTotal", "Estimated total"))}</span><span>${escapeHtml(formatMoney(totalCents(items)))}</span></li>
      </ul>
      <p class="slim-rundown-note">${escapeHtml(copy("quote.chrome.finalPriceNote", "Final price confirmed after we review the details."))}</p>
    </section>`;
  }

  function addressValue() {
    if (details.address != null) return details.address;
    const step = steps().find((item) => item.id === "location");
    const option = step && optionById(step, selected[step.id]);
    const extra = step ? String(extras[step.id] || "").trim() : "";
    return option && option.input && extra ? extra : "";
  }

  function backControl() {
    if (page > quoteFloor() || isCardMode()) {
      return `<div class="slim-foot">
      <button type="button" class="slim-back" data-back>← ${escapeHtml(copy("quote.chrome.back", "Back"))}</button>
    </div>`;
    }
    return "";
  }

  function stepIndexLabel() {
    return `${copy("quote.chrome.step", "Step")} ${page} ${copy("quote.chrome.of", "of")} ${steps().length}`;
  }

  function continueControls(rows) {
    const label = copy("quote.chrome.continue", "Continue");
    const estimate = pack
      ? `${copy("quote.chrome.estimated", "Estimated")} ${formatMoney(totalCents(rows))}`
      : "";
    return `<button type="button" class="slim-send slim-next-inline" data-next>${escapeHtml(label)}</button>
      <p class="slim-error" data-step-error role="alert"></p>
      <div class="slim-sticky-bar">
        ${estimate ? `<p class="slim-sticky-total">${escapeHtml(estimate)}</p>` : ""}
        <button type="button" class="slim-send slim-sticky-continue" data-next>${escapeHtml(label)} →</button>
      </div>`;
  }

  function filmAsk(step) {
    if (!step) return "Tell us who you are, what you need, when you need it, and where we should be.";
    if (step.acknowledge) return "A few things to confirm";
    if (step.type === "multi" && !step.required) return step.title;
    return step.hint || step.title;
  }

  function nextAckOption(step) {
    return (step.options || []).find((option) => !selectionList(step).includes(option.id)) || null;
  }

  function filmDots() {
    if (!pack) return "";
    const count = steps().length + 1;
    const current = Math.min(Math.max(page, 1), count);
    const items = Array.from({ length: count }, (_, index) => {
      const n = index + 1;
      const state = n < current ? " is-done" : n === current ? " is-now" : "";
      return `<span class="film-quote-dot${state}"></span>`;
    }).join("");
    return `<div class="film-quote-dots" aria-hidden="true">${items}</div>`;
  }

  function filmNext() {
    return `<button type="button" class="film-quote-next" data-next>Next</button>
      <p class="slim-error" data-step-error role="alert"></p>`;
  }

  function filmCloseIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }

  function filmDetailsForm() {
    return `<p class="film-quote-ask">Tell us who you are, what you need, when you need it, and where we should be.</p>
      <form class="film-quote-form slim-quote-form" data-slim-form novalidate>
        <div class="slim-fields">
          <input name="name" type="text" autocomplete="name" placeholder="${escapeHtml(copy("quote.chrome.name", "Name"))}" aria-label="${escapeHtml(copy("quote.chrome.name", "Name"))}" required value="${escapeHtml(details.name)}" />
          <input name="email" type="email" autocomplete="email" placeholder="${escapeHtml(copy("quote.chrome.email", "Email"))}" aria-label="${escapeHtml(copy("quote.chrome.email", "Email"))}" required value="${escapeHtml(details.email)}" />
        </div>
        <label class="slim-more">
          <span class="sr-only">What you need, when, and where</span>
          <textarea name="more" rows="4" placeholder="What you need, when, and where." required>${escapeHtml(details.more)}</textarea>
        </label>
        <button class="film-quote-next slim-send" type="submit"${sent ? " disabled" : ""}>${escapeHtml(
          sent ? copy("quote.chrome.sent", "Quote sent") : "Send"
        )}</button>
        <p class="film-quote-note">Quotes are estimates. No booking is confirmed until a deposit is received.</p>
        <p class="slim-error" data-slim-error role="alert"></p>
        <p class="slim-success" data-slim-success role="status"></p>
      </form>`;
  }

  function filmMarkup(step, rows, body, next) {
    const picking = isCardMode() && !pack && previewId !== SOMETHING_ELSE;
    const title = pack
      ? pack.title
      : picking
        ? copy("quote.chrome.heading", "Build your package.")
        : copy("quote.chrome.somethingElse", "Something Else?");
    const price =
      pack && typeof pack.basePriceCents === "number"
        ? formatMoney(page > 0 ? totalCents(rows) : pack.basePriceCents)
        : "";
    const onForm = Boolean(pack && !step && page > 0);
    const showIncludes = Boolean(pack && (!step || !step.acknowledge) && !onForm);
    const intro = `<div class="film-quote-intro">
        <h2>${escapeHtml(title)}</h2>
        ${showIncludes ? filmIncludes() : pack && pack.teaser ? `<p class="film-quote-teaser">${escapeHtml(pack.teaser)}</p>` : ""}
      </div>`;
    const backToPicker = isCardMode() && !pack && previewId === SOMETHING_ELSE;
    const back =
      page > quoteFloor() || backToPicker
        ? `<button type="button" class="film-quote-back" data-back>Back</button>`
        : `<span></span>`;
    return `<div class="film-quote">
      <div class="film-quote-bar">
        <button type="button" class="film-quote-close" data-quote-close aria-label="Close">${filmCloseIcon()}</button>
        ${filmDots()}
        ${price ? `<p class="film-quote-price">${escapeHtml(price)}</p>` : `<span class="film-quote-price"></span>`}
      </div>
      ${intro}
      <div class="film-quote-body">${body}</div>
      <div class="film-quote-nav">${back}${next || ""}</div>
    </div>`;
  }

  function render(options) {
    const previousConfig = root.querySelector(".slim-quote-config");
    const previousConfigTop =
      options && options.preservePosition && !isCardMode() && previousConfig
        ? previousConfig.getBoundingClientRect().top
        : null;
    const step = currentStep();
    const rows = lines();
    const total = pack && page > 0 ? totalCents(rows) : null;
    const atBase =
      pack &&
      typeof pack.basePriceCents === "number" &&
      total === pack.basePriceCents;
    const figure =
      total === null
        ? ""
        : isServicePage()
          ? `${copy(
              atBase ? "quote.chrome.startingAt" : "quote.chrome.estimated",
              atBase ? "Starting at" : "Estimated"
            )} ${formatMoney(total)}`
          : `${copy("quote.chrome.from", "From")} ${formatMoney(total)}`;
    const heading = pack
      ? pack.title
      : isCardMode() && previewId === SOMETHING_ELSE
        ? copy("quote.chrome.somethingElse", "Something Else?")
        : copy("quote.chrome.heading", "Build Your Package.");

    let body = "";
    let sheetNext = "";
    if (isCardMode() && previewId === SOMETHING_ELSE && !pack) {
      body = `<p class="film-quote-ask">${escapeHtml(
        copy("service.something-else.enquire.title", "Tell us your idea.")
      )}</p>${enquireForm()}`;
    } else if (isCardMode() && !pack && page <= 0) {
      body = filmServicePicker();
    } else if (isCardMode() && step) {
      const needsNext = step.type === "multi" ? !step.acknowledge && !step.requireAll : false;
      const chosen = optionById(step, selected[step.id]);
      const needsDetail = Boolean(chosen && chosen.input);
      if (step.acknowledge) {
        const nextAck = nextAckOption(step);
        const total = (step.options || []).length;
        const index = Math.min(selectionList(step).length + 1, total);
        body = `<p class="film-quote-ask">${escapeHtml(filmAsk(step))}</p>
          ${total ? `<p class="film-quote-ack-count">${index} of ${total}</p>` : ""}
          <div class="film-quote-choices is-ack">${
            nextAck ? renderFilmChoice(step, nextAck) : ""
          }</div>`;
      } else {
        const visible = (step.options || []).filter((option) => !isHidden(step, option));
        const count = visible.length;
        const cols = count <= 2 || count === 4 ? 2 : count === 7 ? 4 : 3;
        body = `<p class="film-quote-ask">${escapeHtml(filmAsk(step))}</p>
          <div class="film-quote-choices is-n${count} is-cols-${cols}">${(step.options || [])
            .map((option) => renderFilmChoice(step, option))
            .join("")}</div>`;
        if (needsNext || needsDetail) sheetNext = filmNext();
      }
    } else if (isCardMode() && pack && !step) {
      body = filmDetailsForm();
    } else if (!step && page <= 0) {
      const serviceRows = packages
        .map(
          (item) =>
            `<button type="button" class="slim-pill" data-service="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>`
        )
        .join("");
      const other = `<button type="button" class="slim-pill${
        previewId === SOMETHING_ELSE ? " is-selected" : ""
      }" data-enquire>${escapeHtml(copy("quote.chrome.somethingElse", "Something Else?"))}</button>`;
      body = renderGroup(
        copy("quote.chrome.chooseService", "Choose a service"),
        "",
        serviceRows + other,
        "",
        "pills"
      );
    } else if (step) {
      const needsNext = step.type === "multi" ? !step.acknowledge && !step.requireAll : false;
      const chosen = optionById(step, selected[step.id]);
      const needsDetail = Boolean(chosen && chosen.input);
      const next = needsNext || needsDetail ? continueControls(rows) : "";
      body = `${renderGroup(
        step.title,
        step.acknowledge ? "" : step.hint || "",
        (step.options || []).map((option) => renderOption(step, option)).join(""),
        stepIndexLabel(),
        step.acknowledge ? "" : "pills"
      )}${next}`;
    } else if (pack) {
      body = `${rundown()}<form class="slim-group slim-quote-form" data-slim-form novalidate>
          <h3 class="slim-group-title"><strong>${escapeHtml(copy("quote.chrome.whoTitle", "Your details."))}</strong> <span>${escapeHtml(copy("quote.chrome.whoHint", "Where should we send your estimate?"))}</span></h3>
          <div class="slim-fields">
            <input name="name" type="text" autocomplete="name" placeholder="${escapeHtml(copy("quote.chrome.name", "Name"))}" aria-label="${escapeHtml(copy("quote.chrome.name", "Name"))}" required value="${escapeHtml(details.name)}" />
            <input name="email" type="email" autocomplete="email" placeholder="${escapeHtml(copy("quote.chrome.email", "Email"))}" aria-label="${escapeHtml(copy("quote.chrome.email", "Email"))}" required value="${escapeHtml(details.email)}" />
          </div>
          <div class="slim-fields slim-fields--single">
            <input name="phone" type="tel" autocomplete="tel" placeholder="${escapeHtml(copy("quote.chrome.phone", "Phone"))}" aria-label="${escapeHtml(copy("quote.chrome.phone", "Phone"))}" required value="${escapeHtml(details.phone)}" />
          </div>
          <h3 class="slim-group-title slim-form-part"><strong>${escapeHtml(copy("quote.chrome.whenTitle", "When and where."))}</strong> <span>${escapeHtml(copy("quote.chrome.whenHint", "Tell us when and where our services are needed."))}</span></h3>
          <div class="slim-fields">
            <input name="date" type="date" aria-label="${escapeHtml(copy("quote.chrome.date", "Event date"))}" required value="${escapeHtml(details.date)}" />
            <input name="time" type="time" aria-label="${escapeHtml(copy("quote.chrome.time", "Event time"))}" required value="${escapeHtml(details.time)}" />
          </div>
          <div class="slim-fields slim-fields--single">
            <input name="address" type="text" autocomplete="street-address" placeholder="${escapeHtml(copy("quote.chrome.address", "Address"))}" aria-label="${escapeHtml(copy("quote.chrome.address", "Address"))}" required value="${escapeHtml(addressValue())}" />
          </div>
          <label class="slim-more">
            <span>${escapeHtml(copy("quote.chrome.tellUsMore", "Tell us more"))}</span>
            <textarea name="more" rows="3" placeholder="${escapeHtml(copy("quote.chrome.morePlaceholder", "Anything else we should know"))}">${escapeHtml(details.more)}</textarea>
          </label>
          <button class="slim-send" type="submit"${sent ? " disabled" : ""}>${escapeHtml(sent ? copy("quote.chrome.sent", "Quote sent") : copy("quote.chrome.send", "Submit Enquiry"))}</button>
          <p class="slim-error" data-slim-error role="alert"></p>
          <p class="slim-success" data-slim-success role="status"></p>
        </form>`;
    }

    if (isCardMode()) {
      root.innerHTML = filmMarkup(step, rows, body, sheetNext);
    } else {
      root.innerHTML = `<div class="slim-quote-panel${page <= 0 ? " is-picker" : ""}">
      <div class="slim-quote-head">
        <h2>${escapeHtml(heading)}</h2>
        ${figure ? `<p class="slim-quote-total">${escapeHtml(figure)}</p>` : ""}
      </div>
      <div class="slim-quote-layout">
        ${renderOverview(rows)}
        <div class="slim-quote-config">
          ${body}
          ${backControl()}
        </div>
      </div>
    </div>`;
    }

    if (options && options.focusExtra) {
      const field = root.querySelector("[data-extra]");
      if (field) field.focus({ preventScroll: true });
    }
    if (previousConfigTop !== null) {
      const nextConfig = root.querySelector(".slim-quote-config");
      if (nextConfig) {
        window.scrollBy({
          top: nextConfig.getBoundingClientRect().top - previousConfigTop,
          behavior: "instant",
        });
      }
    }
    if (options && options.scroll && !isCardMode()) {
      const section = root.closest(".slim-quote") || root;
      section.scrollIntoView({ block: "start" });
    }
    bindEnquireForm();
  }

  function chooseService(id, options) {
    const next = packages.find((item) => item.id === id);
    if (!next) return;
    if (!pack || pack.id !== next.id) {
      pack = next;
      Object.keys(selected).forEach((key) => delete selected[key]);
      Object.keys(quantities).forEach((key) => delete quantities[key]);
      Object.keys(extras).forEach((key) => delete extras[key]);
      sent = false;
      overviewOpen = false;
    }
    previewId = next.id;
    page = 1;
    render(options);
  }

  function choose(step, optionId) {
    const option = optionById(step, optionId);
    if (!option || isHidden(step, option) || isLocked(step, option)) return;
    if (isCardMode() && step.acknowledge) {
      const nextAck = nextAckOption(step);
      if (!nextAck || nextAck.id !== optionId) return;
      const list = selectionList(step);
      list.push(optionId);
      selected[step.id] = list;
      prune(step);
      if (stepReady(step)) {
        advance();
        return;
      }
      render();
      return;
    }
    if (step.type === "multi") {
      let list = selectionList(step);
      if (list.includes(optionId)) {
        list = list.filter((id) => id !== optionId);
        if (quantities[step.id]) delete quantities[step.id][optionId];
      } else {
        if (option.exclusive) {
          const blocked = new Set(
            (step.options || [])
              .filter((item) => item.exclusive === option.exclusive)
              .map((item) => item.id)
          );
          list = list.filter((id) => !blocked.has(id));
        }
        list.push(optionId);
        if (option.quantity) {
          if (!quantities[step.id]) quantities[step.id] = {};
          quantities[step.id][optionId] = 1;
        }
      }
      selected[step.id] = list;
      prune(step);
      if ((step.acknowledge || step.requireAll) && stepReady(step)) {
        advance();
        return;
      }
      render({ preservePosition: true });
      return;
    }
    selected[step.id] = optionId;
    if (option.input) {
      render({ focusExtra: true, preservePosition: true });
      return;
    }
    advance();
  }

  function goNext() {
    const step = currentStep();
    if (!step) return;
    rememberFields();
    if (!stepReady(step)) {
      const option = optionById(step, selected[step.id]);
      const error = root.querySelector("[data-step-error]");
      if (error) error.textContent = (option && option.inputError) || copy("quote.chrome.missingDetail", "Add the missing detail.");
      return;
    }
    advance();
  }

  function changeQuantity(step, optionId, direction) {
    const option = optionById(step, optionId);
    if (!option || !selectionList(step).includes(optionId)) return;
    const max = option.max || 12;
    const next = quantityOf(step, optionId) + (direction === "up" ? 1 : -1);
    if (next < 1 || next > max) return;
    if (!quantities[step.id]) quantities[step.id] = {};
    quantities[step.id][optionId] = next;
    render({ preservePosition: true });
  }

  function rememberFields() {
    const extra = root.querySelector("[data-extra]");
    if (extra) extras[extra.getAttribute("data-extra")] = extra.value;
    const form = root.querySelector("[data-slim-form]");
    if (!form) return;
    details.name = String((form.elements.name && form.elements.name.value) || "");
    details.email = String((form.elements.email && form.elements.email.value) || "");
    details.phone = String((form.elements.phone && form.elements.phone.value) || "");
    details.date = String((form.elements.date && form.elements.date.value) || "");
    details.time = String((form.elements.time && form.elements.time.value) || "");
    details.address = String((form.elements.address && form.elements.address.value) || "");
    details.more = String((form.elements.more && form.elements.more.value) || "");
  }

  function eventWhen(date, time) {
    const parsed = new Date(`${date}T${time}`);
    if (Number.isNaN(parsed.getTime())) return `${date} ${time}`;
    return new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
  }

  function notifySms() {
    const cfg = window.GLADSTONE_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !pack) return;
    fetch(`${cfg.supabaseUrl.replace(/\/$/, "")}/functions/v1/notify-sms`, {
      method: "POST",
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "quote",
        name: details.name,
        phone: details.phone,
        service: pack.title,
      }),
    }).catch(() => {});
  }

  function send(form) {
    const error = form.querySelector("[data-slim-error]");
    const success = form.querySelector("[data-slim-success]");
    const name = String((form.elements.name && form.elements.name.value) || "").trim();
    const email = String((form.elements.email && form.elements.email.value) || "").trim();
    const phone = String((form.elements.phone && form.elements.phone.value) || "").trim();
    const date = String((form.elements.date && form.elements.date.value) || "").trim();
    const time = String((form.elements.time && form.elements.time.value) || "").trim();
    const address = String((form.elements.address && form.elements.address.value) || "").trim();
    const more = String((form.elements.more && form.elements.more.value) || "").trim();
    if (error) error.textContent = "";
    if (success) success.textContent = "";
    const gap = missing();
    if (gap) {
      if (error) error.textContent = gap;
      return;
    }
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (error) error.textContent = copy("quote.chrome.invalidContact", "Add your name and a valid email.");
      return;
    }
    if (isCardMode() && !more) {
      if (error) error.textContent = "Add what you need, when, and where.";
      return;
    }
    if (!isCardMode()) {
      if (!phone) {
        if (error) error.textContent = copy("quote.chrome.missingPhone", "Add a phone number.");
        return;
      }
      if (!date || !time) {
        if (error) error.textContent = copy("quote.chrome.missingWhen", "Add the event date and time.");
        return;
      }
      if (!address) {
        if (error) error.textContent = copy("quote.chrome.missingAddress", "Add the address.");
        return;
      }
    }
    const accessKey = window.GLADSTONE_CONFIG && window.GLADSTONE_CONFIG.quoteAccessKey;
    if (!accessKey) {
      if (error) error.textContent = copy("quote.chrome.emailUnavailable", "Email isn’t set up yet.");
      return;
    }
    const submit = form.querySelector("[type=submit]");
    if (submit) {
      submit.disabled = true;
      submit.textContent = copy("quote.chrome.sending", "Sending…");
    }
    const rows = lines();
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Quote — ${pack.title}`,
        from_name: "Gladstone Uncovered",
        name,
        email,
        replyto: email,
        phone,
        message: `${name} asked for a quote.${
          phone ? `\nPhone: ${phone}` : ""
        }${date && time ? `\nWhen: ${eventWhen(date, time)}` : ""}${
          address ? `\nWhere: ${address}` : ""
        }\n\n${summaryText(rows)}${more ? `\n\n${more}` : ""}`,
      }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.success !== true && String(data.success) !== "true") {
          if (error) error.textContent = copy("quote.chrome.sendFailed", "Couldn’t send the quote. Try again in a moment.");
          if (submit) {
            submit.disabled = false;
            submit.textContent = copy("quote.chrome.send", "Submit Enquiry");
          }
          return;
        }
        sent = true;
        if (success) success.textContent = copy("quote.chrome.sentNote", "Quote sent. We’ll reply by email.");
        if (submit) submit.textContent = copy("quote.chrome.sent", "Quote sent");
        notifySms();
      })
      .catch(() => {
        if (error) error.textContent = copy("quote.chrome.sendFailed", "Couldn’t send the quote. Try again in a moment.");
        if (submit) {
          submit.disabled = false;
          submit.textContent = copy("quote.chrome.send", "Submit Enquiry");
        }
      });
  }

  document.addEventListener("click", (event) => {
    const quoteOpen = event.target.closest("[data-quote-open]");
    if (quoteOpen) {
      event.preventDefault();
      openQuotePicker();
      return;
    }
    const quoteBtn = event.target.closest("[data-card-quote]");
    if (quoteBtn) {
      event.preventDefault();
      event.stopPropagation();
      openCardQuote(quoteBtn.closest(".home-film"), quoteBtn.getAttribute("data-card-quote"));
      return;
    }
    const book = event.target.closest("[data-book]");
    if (!book) return;
    const id = book.getAttribute("data-book");
    if (!packages.some((item) => item.id === id)) return;
    event.preventDefault();
    chooseService(id, { scroll: true });
  });

  root.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-overview-toggle]");
    if (toggle && root.contains(toggle)) {
      overviewOpen = !overviewOpen;
      const overview = root.querySelector("[data-quote-overview]");
      if (overview) overview.classList.toggle("is-open", overviewOpen);
      toggle.setAttribute("aria-expanded", overviewOpen ? "true" : "false");
      toggle.textContent = overviewToggleLabel();
      return;
    }
    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton && root.contains(qtyButton)) {
      if (qtyButton.disabled) return;
      rememberFields();
      const step = steps().find((item) => item.id === qtyButton.getAttribute("data-step"));
      if (step) changeQuantity(step, qtyButton.getAttribute("data-qty-option"), qtyButton.getAttribute("data-qty"));
      return;
    }
    const closeButton = event.target.closest("[data-quote-close]");
    if (closeButton && root.contains(closeButton)) {
      closeCardQuote();
      return;
    }
    const backButton = event.target.closest("[data-back]");
    if (backButton && root.contains(backButton)) {
      rememberFields();
      if (isCardMode() && !pack && previewId === SOMETHING_ELSE && page <= quoteFloor()) {
        previewId = packages[0] ? packages[0].id : "";
        render();
        return;
      }
      if (isCardMode()) {
        const current = currentStep();
        if (current && current.acknowledge) {
          const list = selectionList(current);
          if (list.length) {
            selected[current.id] = list.slice(0, -1);
            render();
            return;
          }
        }
      }
      if (page > quoteFloor()) {
        page -= 1;
        if (cardHost === quoteSheet && page <= 0) {
          pack = null;
          previewId = packages[0] ? packages[0].id : "";
        }
        const previous = currentStep();
        if (isCardMode() && previous && previous.acknowledge) {
          const list = selectionList(previous);
          if (list.length) selected[previous.id] = list.slice(0, -1);
        }
        render({ preservePosition: !isCardMode() });
        return;
      }
      if (isCardMode()) closeCardQuote();
      return;
    }
    const nextButton = event.target.closest("[data-next]");
    if (nextButton && root.contains(nextButton)) {
      goNext();
      return;
    }
    const enquireButton = event.target.closest("[data-enquire]");
    if (enquireButton && root.contains(enquireButton)) {
      if (isCardMode()) {
        pack = null;
        previewId = SOMETHING_ELSE;
        page = 0;
        render();
        return;
      }
      showOverview(SOMETHING_ELSE);
      return;
    }
    const serviceButton = event.target.closest("[data-service]");
    if (serviceButton && root.contains(serviceButton)) {
      chooseService(serviceButton.getAttribute("data-service"), { preservePosition: true });
      return;
    }
    const optionButton = event.target.closest("[data-option]");
    if (optionButton && root.contains(optionButton)) {
      if (optionButton.disabled) return;
      rememberFields();
      const step = steps().find((item) => item.id === optionButton.getAttribute("data-step"));
      if (step) choose(step, optionButton.getAttribute("data-option"));
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const field = event.target.closest("[data-extra]");
    if (!field || !root.contains(field)) return;
    event.preventDefault();
    goNext();
  });

  root.addEventListener("input", (event) => {
    if (event.target.closest("[data-quote-enquire]")) enquireSent = false;
    const field = event.target.closest("[data-extra]");
    if (field && root.contains(field)) extras[field.getAttribute("data-extra")] = field.value;
  });

  root.addEventListener("gladstone:enquiry-sent", (event) => {
    if (!event.target.closest("[data-quote-enquire]")) return;
    enquireSent = true;
    enquire.name = "";
    enquire.email = "";
    enquire.phone = "";
    enquire.message = "";
  });

  function previewFromTarget(target) {
    const enquireButton = target.closest("[data-enquire]");
    if (enquireButton && root.contains(enquireButton)) {
      showOverview(SOMETHING_ELSE);
      return;
    }
    const service = target.closest("[data-service]");
    if (service && root.contains(service)) showOverview(service.getAttribute("data-service"));
  }

  root.addEventListener("mouseover", (event) => {
    previewFromTarget(event.target);
  });

  root.addEventListener("focusin", (event) => {
    previewFromTarget(event.target);
  });

  root.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-slim-form]");
    if (!form || !root.contains(form)) return;
    event.preventDefault();
    rememberFields();
    send(form);
  });

  if (quoteSheet) {
    quoteSheet.addEventListener("close", () => {
      if (cardHost) closeCardQuote({ fromDialog: true });
    });
  }

  render();
  const openQuoteFromHash = () => {
    if (window.location.hash === "#quote") openQuotePicker();
  };
  openQuoteFromHash();
  window.addEventListener("hashchange", openQuoteFromHash);
  const refreshCopy = () => {
    rememberEnquire();
    rememberFields();
    render({ preservePosition: true });
  };
  document.addEventListener("gladstone:copy", refreshCopy);
  if (window.GLADSTONE_COPY_READY) refreshCopy();
})();
