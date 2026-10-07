(() => {
  const root = document.querySelector("[data-slim-quote]");
  const packages = window.GLADSTONE_SERVICE_QUOTES;
  if (!root || !packages || !packages.length) return;

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  const lockedId = (root.getAttribute("data-slim-quote") || "").trim();
  let pack = packages.find((item) => item.id === lockedId) || null;
  let previewId = pack ? pack.id : packages[0].id;
  const floor = pack ? 1 : 0;
  let page = floor;
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
        ? `<div class="slim-extra">
            <input type="text" data-extra="${escapeHtml(step.id)}" value="${escapeHtml(extras[step.id] || "")}" placeholder="${escapeHtml(option.inputLabel || "Details")}" aria-label="${escapeHtml(option.inputLabel || "Details")}" />
          </div>`
        : "";
    const detail = infoText(option, qty);
    return `<div class="slim-line">
      <div class="slim-row${step.acknowledge ? " is-ack" : ""}${chosen ? " is-selected" : ""}${locked ? " is-locked" : ""}">
        <button type="button" class="slim-pick" data-step="${escapeHtml(step.id)}" data-option="${escapeHtml(option.id)}"${locked ? " disabled" : ""}>
          <span class="slim-option-copy">
            <span class="slim-label">${escapeHtml(option.label)}</span>
            ${detail ? `<span class="slim-read">${escapeHtml(detail)}</span>` : ""}
          </span>
          ${optionPrice(step, option)}
        </button>
        ${stepper}
      </div>
      ${extra}
    </div>`;
  }

  function renderGroup(title, hint, rows, stepLabel) {
    return `<section class="slim-group">
      ${stepLabel ? `<p class="slim-step-index">${escapeHtml(stepLabel)}</p>` : ""}
      <h3 class="slim-group-title"><strong>${escapeHtml(title)}.</strong>${
        hint ? ` <span>${escapeHtml(hint)}</span>` : ""
      }</h3>
      <div class="slim-rows">${rows}</div>
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

  function enquireOverview() {
    const title = copy("service.something-else.enquire.title", "Tell us your idea.");
    const heading = copy("quote.chrome.somethingElse", "Something Else?");
    const teaser = copy("quote.chrome.somethingElseDetail", "Have something different in mind?");
    const success = enquireSent
      ? `<p class="slim-success is-visible" data-contact-success role="status">${escapeHtml(
          copy("quote.chrome.enquirySent", "Message sent. We’ll reply to the email you entered.")
        )}</p>`
      : `<p class="slim-success" data-contact-success role="status"></p>`;
    return `<div class="slim-overview-compact">
      <p class="slim-overview-compact-line"><strong>${escapeHtml(heading)}</strong></p>
      <p class="slim-overview-teaser">${escapeHtml(teaser)}</p>
    </div>
    <h3 class="slim-overview-title">${escapeHtml(title)}</h3>
    <form
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

  function overviewContent(item, rows) {
    const points = Array.isArray(item.overview) ? item.overview : [];
    const list = points.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
    const price =
      typeof item.basePriceCents === "number"
        ? `<p class="slim-overview-price"><span>${escapeHtml(copy("quote.chrome.startingFrom", "Starting from"))}</span><strong>${escapeHtml(formatMoney(item.basePriceCents))}</strong></p>`
        : "";
    const figure = compactPrice(item, rows);
    const compact = `<div class="slim-overview-compact">
      <p class="slim-overview-compact-line"><strong>${escapeHtml(item.title)}</strong>${
        figure ? ` — ${escapeHtml(figure)}` : ""
      }</p>
      ${item.teaser ? `<p class="slim-overview-teaser">${escapeHtml(item.teaser)}</p>` : ""}
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
    if (isServicePage()) return "";
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
    const selectedRow = enquireRow && enquireRow.closest(".slim-row");
    if (selectedRow) selectedRow.classList.toggle("is-selected", enquirePreview);
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
    if (page <= floor) return "";
    return `<div class="slim-foot">
      <button type="button" class="slim-back" data-back>← ${escapeHtml(copy("quote.chrome.back", "Back"))}</button>
    </div>`;
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

  function render(options) {
    const previousConfig = root.querySelector(".slim-quote-config");
    const previousConfigTop =
      options && options.preservePosition && previousConfig
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
    const heading = pack ? pack.title : copy("quote.chrome.heading", "Build Your Package.");

    let body = "";
    if (!step && page <= 0) {
      const serviceRows = packages
        .map((item) => {
          const price =
            typeof item.basePriceCents === "number"
              ? `${copy("quote.chrome.from", "From")} ${formatMoney(item.basePriceCents)}`
              : "";
          return `<div class="slim-line">
            <div class="slim-row">
              <button type="button" class="slim-pick" data-service="${escapeHtml(item.id)}">
                <span class="slim-option-copy">
                  <span class="slim-label">${escapeHtml(item.title)}</span>
                  <span class="slim-read">${escapeHtml(item.summary)}</span>
                </span>
                ${price ? `<span class="slim-option-price"><strong>${escapeHtml(price)}</strong></span>` : ""}
              </button>
            </div>
          </div>`;
        })
        .join("");
      const other = `<div class="slim-line">
        <div class="slim-row${previewId === SOMETHING_ELSE ? " is-selected" : ""}">
            <button type="button" class="slim-pick" data-enquire>
              <span class="slim-option-copy">
              <span class="slim-label">${escapeHtml(copy("quote.chrome.somethingElse", "Something Else?"))}</span>
                <span class="slim-read">${escapeHtml(copy("quote.chrome.somethingElseDetail", "Have something different in mind?"))}</span>
              </span>
              <span class="slim-option-price"><strong>${escapeHtml(copy("quote.chrome.emailUs", "Enquire"))}</strong></span>
            </button>
        </div>
      </div>`;
      body = renderGroup(
        copy("quote.chrome.chooseService", "Choose a service"),
        copy("quote.chrome.chooseHint", "What would you like us to create?"),
        serviceRows + other
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
        stepIndexLabel()
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

    root.innerHTML = `<div class="slim-quote-panel">
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
    if (options && options.scroll) {
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
        message: `${name} asked for a quote.\nPhone: ${phone}\nWhen: ${eventWhen(date, time)}\nWhere: ${address}\n\n${summaryText(rows)}${more ? `\n\n${more}` : ""}`,
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
    const backButton = event.target.closest("[data-back]");
    if (backButton && root.contains(backButton)) {
      rememberFields();
      if (page > floor) page -= 1;
      render({ preservePosition: true });
      return;
    }
    const nextButton = event.target.closest("[data-next]");
    if (nextButton && root.contains(nextButton)) {
      goNext();
      return;
    }
    const enquireButton = event.target.closest("[data-enquire]");
    if (enquireButton && root.contains(enquireButton)) {
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

  render();
  const refreshCopy = () => {
    rememberEnquire();
    rememberFields();
    render({ preservePosition: true });
  };
  document.addEventListener("gladstone:copy", refreshCopy);
  if (window.GLADSTONE_COPY_READY) refreshCopy();
})();
