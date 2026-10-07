(() => {
  const root = document.querySelector("[data-service-quote]");
  if (!root) return;
  root.classList.add("service-quote");

  const packages = window.GLADSTONE_SERVICE_QUOTES || [];
  const quoteId = root.getAttribute("data-service-quote");
  const combined = quoteId === "all";
  let pack = combined
    ? null
    : packages.find((item) => item.id === quoteId);
  if (!combined && !pack) return;

  let steps = pack ? pack.steps || [] : [];

  function stepTotal() {
    return (combined ? 1 : 0) + steps.length + (pack ? 1 : 0);
  }

  function currentStep() {
    return steps[combined ? index - 1 : index] || null;
  }
  const selected = {};
  const quantities = {};
  const extras = {};
  const details = {};
  let index = 0;
  let lastIndex = -1;
  let enquirySent = false;

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

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

  function quantityOf(step, id) {
    const bucket = quantities[step.id] || {};
    const qty = bucket[id];
    return Number.isInteger(qty) && qty > 0 ? qty : 1;
  }

  function reelSplit(during, included) {
    const after = Math.max(0, included - during);
    const reelWord = (count) => (count === 1 ? "reel" : "reels");
    if (after === 0) {
      return `${during} ${reelWord(during)} delivered during the event.`;
    }
    return `${during} ${reelWord(during)} delivered during the event + ${after} ${reelWord(after)} delivered after the event.`;
  }

  function selectionList(step) {
    const value = selected[step.id];
    if (step.type === "multi") return Array.isArray(value) ? value.slice() : [];
    return value ? [value] : [];
  }

  function optionById(step, id) {
    return (step.options || []).find((item) => item.id === id) || null;
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

  function pruneSelection(step) {
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
    selected[step.id] = list;
    if (quantities[step.id]) {
      Object.keys(quantities[step.id]).forEach((id) => {
        if (!list.includes(id)) delete quantities[step.id][id];
      });
    }
  }

  function detailSchema() {
    const finish = pack.finish || {};
    return [
      { name: "name", label: "Name", error: "name", type: "text", auto: "name" },
      { name: "phone", label: "Phone", error: "phone", type: "tel", auto: "tel" },
      { name: "email", label: "Email", error: "email", type: "email", auto: "email" },
      {
        name: "venue",
        label: finish.venueLabel || "Location of the event",
        error: finish.venueError || "event location",
        type: "text",
      },
      {
        name: "eventDate",
        label: finish.dateLabel || "Date of event",
        error: finish.dateError || "date of event",
        type: "text",
        auto: "off",
        pair: "when",
      },
      {
        name: "arrivalTime",
        label: finish.timeLabel || "Time we should arrive",
        error: finish.timeError || "time we should arrive",
        type: "text",
        auto: "off",
        pair: "when",
      },
      {
        name: "message",
        label: finish.messageLabel || "Describe the event and your vision",
        error: "description",
        type: "textarea",
      },
    ];
  }

  function holdCents(lines, portion) {
    const total = totalCents(lines);
    if (portion === "full") return total;
    const percent = (pack.finish && pack.finish.depositPercent) || 20;
    return Math.round((total * percent) / 100);
  }

  function selectionPayload() {
    const payload = {};
    steps.forEach((step) => {
      if (step.acknowledge) return;
      if (step.type === "multi") {
        payload[step.id] = selectionList(step).map((id) => {
          const option = optionById(step, id);
          if (option && option.quantity) return { id, qty: quantityOf(step, id) };
          return id;
        });
      }
      else if (selected[step.id]) payload[step.id] = selected[step.id];
    });
    return payload;
  }

  function chosenLines() {
    const lines = [];
    if (typeof pack.basePriceCents === "number") {
      lines.push({
        step: "Package",
        label: pack.baseLabel || "One drone flight",
        detail: pack.baseDetail || "",
        priceCents: pack.basePriceCents,
      });
    }

    steps.forEach((step) => {
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
        lines.push({
          step: step.title,
          label,
          detail: option.detail || "",
          aside:
            option.countsToward && qty
              ? reelSplit(Math.min(qty, option.countsToward), option.countsToward)
              : "",
          priceCents: typeof unit === "number" ? unit * qty : unit,
          included: Boolean(option.included),
          confirm: Boolean(option.confirm),
        });
      });
    });

    return lines;
  }

  function acknowledgementLines() {
    const step = steps.find((item) => item.acknowledge);
    if (!step) return [];
    return selectionList(step)
      .map((id) => optionById(step, id))
      .filter(Boolean);
  }

  function totalCents(lines) {
    return lines.reduce(
      (sum, line) =>
        typeof line.priceCents === "number" ? sum + line.priceCents : sum,
      0
    );
  }

  function lineValue(line) {
    if (line.confirm) return "We'll confirm";
    if (line.included) return "Included";
    if (typeof line.priceCents === "number") return formatMoney(line.priceCents);
    return "";
  }

  function estimateText(lines) {
    return `Estimate ${formatMoney(totalCents(lines))}`;
  }

  function focusStep() {
    if (lastIndex < 0 || lastIndex === index) {
      lastIndex = index;
      return;
    }
    lastIndex = index;
    const heading = root.querySelector("h3");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }

  function optionNote(option) {
    if (option.note) return option.note;
    if (option.included) return "Included";
    return "";
  }

  function stepHead(title, prompt) {
    return `<h3 id="service-quote-step"><span class="service-quote-kicker">${escapeHtml(
      title
    )}.</span>${
      prompt
        ? ` <span class="service-quote-prompt">${escapeHtml(prompt)}</span>`
        : ""
    }</h3>`;
  }

  function fromLine() {
    if (!pack || typeof pack.basePriceCents !== "number") return "";
    return `<p class="service-quote-from">From ${escapeHtml(
      formatMoney(totalCents(chosenLines()))
    )}</p>`;
  }

  function renderOption(step, option) {
    if (isHidden(step, option)) return "";
    const chosen = selectionList(step).includes(option.id);
    const locked = isLocked(step, option);
    const note = optionNote(option);
    const detail = option.detail
      ? `<span class="service-quote-option-detail">${escapeHtml(option.detail)}</span>`
      : "";
    const split =
      option.countsToward && chosen
        ? `<span class="service-quote-option-detail">${escapeHtml(
            reelSplit(quantityOf(step, option.id), option.countsToward)
          )}</span>`
        : "";
    const long = step.acknowledge ? " is-long" : "";
    const check = step.type === "multi" ? " is-check" : "";
    const nested = option.parent ? " is-nested" : "";
    const button = `<button type="button" class="service-quote-option${long}${check}${nested}${
      chosen ? " is-selected" : ""
    }" data-step="${escapeHtml(step.id)}" data-option="${escapeHtml(
      option.id
    )}" aria-pressed="${chosen ? "true" : "false"}"${locked ? " disabled" : ""}>
      <span class="service-quote-option-mark" aria-hidden="true"></span>
      <span class="service-quote-option-copy">
        <span class="service-quote-option-text">
          <span class="service-quote-option-label">${escapeHtml(option.label)}</span>
          ${detail}
          ${split}
        </span>
        ${
          note
            ? `<span class="service-quote-option-note">${escapeHtml(note)}</span>`
            : ""
        }
      </span>
    </button>`;
    if (!option.quantity) return button;
    const qty = chosen ? quantityOf(step, option.id) : 1;
    const max = option.max || 12;
    const stepper = chosen
      ? `<div class="service-quote-qty">
          <button type="button" data-qty="down" data-step="${escapeHtml(
            step.id
          )}" data-qty-option="${escapeHtml(option.id)}" aria-label="Fewer ${escapeHtml(
          option.label
        )}"${qty <= 1 ? " disabled" : ""}>−</button>
          <span>${qty}</span>
          <button type="button" data-qty="up" data-step="${escapeHtml(
            step.id
          )}" data-qty-option="${escapeHtml(option.id)}" aria-label="More ${escapeHtml(
          option.label
        )}"${qty >= max ? " disabled" : ""}>+</button>
        </div>`
      : "";
    return `<div class="service-quote-option-line${
      chosen ? " is-selected" : ""
    }">${button}${stepper}</div>`;
  }

  function renderExtra(step) {
    const option = optionById(step, selected[step.id]);
    if (!option || !option.input) return "";
    const fieldId = `quote-extra-${step.id}`;
    return `<div class="field service-quote-other">
      <label for="${fieldId}">${escapeHtml(option.inputLabel || "Details")}</label>
      <input id="${fieldId}" type="text" data-quote-extra="${escapeHtml(
        step.id
      )}" value="${escapeHtml(extras[step.id] || "")}" />
    </div>`;
  }

  function renderServices() {
    const options = packages
      .map((item) => {
        const chosen = Boolean(pack && pack.id === item.id);
        const price =
          typeof item.basePriceCents === "number"
            ? `From ${formatMoney(item.basePriceCents)}`
            : "";
        const summary = item.summary
          ? `<span class="service-quote-option-summary">${escapeHtml(item.summary)}</span>`
          : "";
        return `<button type="button" class="service-quote-option is-service${
          chosen ? " is-selected" : ""
        }" data-service="${escapeHtml(item.id)}" aria-pressed="${
          chosen ? "true" : "false"
        }">
      <span class="service-quote-option-mark" aria-hidden="true"></span>
      <span class="service-quote-option-copy">
        <span class="service-quote-option-text">
          <span class="service-quote-option-label">${escapeHtml(item.title)}</span>
          ${summary}
        </span>
        ${
          price
            ? `<span class="service-quote-option-note">${escapeHtml(price)}</span>`
            : ""
        }
      </span>
    </button>`;
      })
      .join("");

    root.innerHTML = `
      ${fromLine()}
      ${stepHead("Service", "Which service do you need?")}
      <div class="service-quote-options" role="group" aria-labelledby="service-quote-step">
        ${options}
      </div>
      <p class="service-quote-error" data-quote-error role="alert"></p>
      <div class="service-quote-nav">
        <span></span>
        <button type="button" class="btn btn-light" data-quote-next>Continue</button>
      </div>
    `;
    focusStep();
  }

  function renderChoice() {
    const step = currentStep();
    if (!step) return;
    const options = (step.options || []).map((option) => renderOption(step, option)).join("");

    root.innerHTML = `
      ${fromLine()}
      ${stepHead(step.title, step.hint || "")}
      <div class="service-quote-options" role="group" aria-labelledby="service-quote-step">
        ${options}
      </div>
      ${renderExtra(step)}
      <p class="service-quote-error" data-quote-error role="alert"></p>
      <div class="service-quote-nav">
        ${
          index > 0
            ? `<button type="button" class="btn service-quote-back" data-quote-back>Back</button>`
            : "<span></span>"
        }
        <button type="button" class="btn btn-light" data-quote-next>Continue</button>
      </div>
    `;
    focusStep();
  }

  function renderEstimate() {
    const lines = chosenLines();
    const hasConfirm = lines.some((line) => line.confirm);
    const rows = lines
      .map(
        (line) => `<li>
          <span>${escapeHtml(line.label)}${
            line.aside
              ? `<small class="service-quote-line-aside">${escapeHtml(line.aside)}</small>`
              : ""
          }</span>
          <span>${escapeHtml(lineValue(line))}</span>
        </li>`
      )
      .join("");
    const acks = acknowledgementLines()
      .map(
        (line) => `<li>
          <strong>${escapeHtml(line.label)}</strong>
          ${
            line.detail
              ? `<span>${escapeHtml(line.detail)}</span>`
              : ""
          }
        </li>`
      )
      .join("");
    const paying = pack.finish && pack.finish.type === "payment";
    const depositOnly = Boolean(paying && pack.finish.depositOnly);
    const percent = (pack.finish && pack.finish.depositPercent) || 20;
    const totalLabel = (pack.finish && pack.finish.totalLabel) || "Estimate";
    const note = hasConfirm
      ? paying
        ? "This is an estimate. Items marked “We'll confirm” are not included in the figure. We’ll confirm the price before payment. You can still enquire."
        : "This is an estimate. Items marked “We'll confirm” are not included in the figure. We’ll confirm the details before anything is booked."
      : depositOnly
        ? "The remaining balance is payable in accordance with the booking terms."
        : paying
          ? "This is an estimate. Pay a 20% deposit or the full amount, or enquire. You aren’t charged unless we confirm the job."
          : "This is an estimate. We’ll confirm the details before anything is booked.";
    const depositLine =
      depositOnly && !hasConfirm
        ? `<p class="service-quote-due"><span>${percent}% deposit due today</span><span>${escapeHtml(
            formatMoney(holdCents(lines, "deposit"))
          )}</span></p>`
        : "";
    const schema = detailSchema();
    const whenFields = schema.filter((field) => field.pair === "when");
    const otherFields = schema.filter((field) => field.pair !== "when" && field.type !== "textarea");
    const messageField = schema.find((field) => field.type === "textarea");
    const fieldHtml = (field) => `<div class="field">
          <label for="quote-${escapeHtml(field.name)}">${escapeHtml(field.label)}</label>
          <input id="quote-${escapeHtml(field.name)}" name="${escapeHtml(
            field.name
          )}" type="${escapeHtml(field.type)}" ${
            field.auto ? `autocomplete="${escapeHtml(field.auto)}" ` : ""
          }required value="${escapeHtml(details[field.name] || "")}" />
        </div>`;
    const enquireButton = `<button type="submit" class="btn btn-light" data-pay="enquire"${
      enquirySent ? " disabled" : ""
    }>${enquirySent ? "Enquiry sent" : "Enquire"}</button>`;
    const actions =
      paying && !hasConfirm
        ? depositOnly
          ? `<button type="submit" class="btn btn-light" data-pay="deposit">Continue to booking</button>`
          : `<div class="service-quote-pay">
            <button type="submit" class="btn btn-light" data-pay="deposit">${percent}% deposit · ${escapeHtml(
            formatMoney(holdCents(lines, "deposit"))
          )}</button>
            <button type="submit" class="btn btn-light" data-pay="full">Full amount · ${escapeHtml(
            formatMoney(holdCents(lines, "full"))
          )}</button>
            ${enquireButton}
          </div>`
        : paying
          ? enquireButton
          : `<button type="submit" class="btn btn-light">Send request</button>`;

    root.innerHTML = `
      ${stepHead("Your quote", combined && pack ? pack.title : totalLabel)}
      <p class="service-quote-from">From ${escapeHtml(formatMoney(totalCents(lines)))}</p>
      <ul class="service-quote-lines">${rows}</ul>
      ${depositLine}
      <p class="service-quote-note">${escapeHtml(note)}</p>
      <h3>Acknowledgements</h3>
      <ul class="service-quote-acks">${acks}</ul>
      <form class="service-quote-form" data-quote-form novalidate>
        <h3>Your details</h3>
        ${otherFields.map(fieldHtml).join("")}
        <div class="service-quote-when">
          ${whenFields.map(fieldHtml).join("")}
        </div>
        <div class="field">
          <label for="quote-message">${escapeHtml(messageField.label)}</label>
          <textarea id="quote-message" name="message" required>${escapeHtml(
            details.message || ""
          )}</textarea>
        </div>
        <p class="service-quote-error" data-quote-error role="alert"></p>
        <div class="service-quote-nav${
          paying && !hasConfirm && !depositOnly ? " is-pay" : ""
        }">
          <button type="button" class="btn service-quote-back" data-quote-back>Back</button>
          ${actions}
        </div>
        <p class="service-quote-success" data-quote-success></p>
      </form>
    `;
    focusStep();
  }

  function render() {
    if (combined && index === 0) renderServices();
    else if ((combined ? index - 1 : index) < steps.length) renderChoice();
    else renderEstimate();
  }

  function clearAnswers() {
    Object.keys(selected).forEach((key) => {
      delete selected[key];
    });
    Object.keys(extras).forEach((key) => {
      delete extras[key];
    });
    Object.keys(quantities).forEach((key) => {
      delete quantities[key];
    });
    enquirySent = false;
  }

  function chooseService(id) {
    const next = packages.find((item) => item.id === id);
    if (!next) return;
    if (!pack || pack.id !== next.id) {
      clearAnswers();
      pack = next;
      steps = pack.steps || [];
    }
    render();
  }

  function readExtra(step) {
    const field = root.querySelector("[data-quote-extra]");
    if (field) extras[step.id] = field.value;
    return String(extras[step.id] || "").trim();
  }

  function canContinue(step) {
    const error = root.querySelector("[data-quote-error]");
    const chosen = selectionList(step);
    if (step.requireAll) {
      const missing = (step.options || []).some(
        (option) => !chosen.includes(option.id)
      );
      if (missing) {
        if (error) error.textContent = "Accept each acknowledgement to continue.";
        return false;
      }
      return true;
    }
    if (step.required && !chosen.length) {
      if (error) error.textContent = "Choose an option to continue.";
      return false;
    }
    const option = chosen.length === 1 ? optionById(step, chosen[0]) : null;
    if (option && option.input && !readExtra(step)) {
      if (error) {
        const name = String(option.inputLabel || "details")
          .replace(/\?$/, "")
          .trim()
          .toLowerCase();
        error.textContent =
          option.inputError || `Enter the ${name} to continue.`;
      }
      return false;
    }
    return true;
  }

  function fieldValue(form, name) {
    const field = form.elements.namedItem(name);
    return String((field && field.value) || "").trim();
  }

  function readDetails(form) {
    const schema = detailSchema();
    schema.forEach((field) => {
      details[field.name] = fieldValue(form, field.name);
    });
    return schema.filter((field) => !details[field.name]).map((field) => field.error);
  }

  function quoteBody(lines, extra) {
    const total = estimateText(lines);
    const acks = acknowledgementLines();
    const schema = detailSchema();
    const heading =
      (pack.finish && pack.finish.messageHeading) || "Event and vision:";
    return [
      `${pack.title} quote request`,
      "",
      total,
      ...(extra || []),
      ...lines.map((line) => {
        const value = lineValue(line);
        const aside = line.aside ? ` (${line.aside})` : "";
        return value
          ? `${line.step}: ${line.label} — ${value}${aside}`
          : `${line.step}: ${line.label}${aside}`;
      }),
      "",
      "Acknowledgements:",
      ...acks.map((line) =>
        line.detail ? `- ${line.label}: ${line.detail}` : `- ${line.label}`
      ),
      "",
      ...schema
        .filter((field) => field.name !== "message")
        .map((field) => `${field.label}: ${details[field.name]}`),
      "",
      heading,
      details.message,
    ].join("\n");
  }

  async function sendRequest(form) {
    const error = form.querySelector("[data-quote-error]");
    const success = form.querySelector("[data-quote-success]");
    const missing = readDetails(form);

    if (missing.length) {
      if (error) {
        error.textContent = `Add your ${missing.join(", ")}.`;
      }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      if (error) error.textContent = "Enter a valid email address.";
      return;
    }

    const lines = chosenLines();
    const total = estimateText(lines);
    const body = quoteBody(lines);

    const submit =
      form.querySelector("[data-pay=enquire]") || form.querySelector("[type=submit]");
    const idleLabel =
      submit && submit.getAttribute("data-pay") === "enquire" ? "Enquire" : "Send request";
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Sending…";
    }
    if (error) error.textContent = "";
    if (success) success.textContent = "";

    const accessKey =
      window.GLADSTONE_CONFIG && window.GLADSTONE_CONFIG.quoteAccessKey;

    const restore = () => {
      if (!form.isConnected || !submit) return;
      submit.disabled = false;
      submit.textContent = idleLabel;
    };

    const fail = (notice) => {
      if (!form.isConnected) return;
      if (success) success.textContent = "";
      if (error) {
        error.textContent = notice || "Couldn’t send the request. Try again in a moment.";
      }
      restore();
    };

    if (!accessKey) {
      fail("Quote email isn’t set up yet.");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        access_key: accessKey,
        subject: `${pack.title} quote — ${total}`,
        from_name: "Gladstone Uncovered",
        name: details.name,
        email: details.email,
        phone: details.phone,
        replyto: details.email,
        message: body,
      }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.success !== true && String(data.success) !== "true") {
          fail(String(data.message || ""));
          return;
        }
        if (!form.isConnected) return;
        if (submit && submit.getAttribute("data-pay") === "enquire") {
          enquirySent = true;
          submit.disabled = true;
          submit.textContent = "Enquiry sent";
        } else {
          restore();
        }
        if (success) {
          success.textContent = "Request sent. We’ll reply to the email you entered.";
        }
        notifySms("enquiry", lines);
      })
      .catch(() => fail(""))
      .finally(() => clearTimeout(timer));
  }

  function notifyInbox(lines, portion) {
    const accessKey =
      window.GLADSTONE_CONFIG && window.GLADSTONE_CONFIG.quoteAccessKey;
    if (!accessKey) return;
    const total = estimateText(lines);
    const percent = (pack.finish && pack.finish.depositPercent) || 20;
    const paymentLabel =
      portion === "full" ? "full amount" : `${percent}% deposit`;
    const amount = formatMoney(holdCents(lines, portion));
    const body = quoteBody(lines, [
      `Opening Stripe for the ${paymentLabel} (${amount}).`,
      "The payment appears in Stripe once they finish checkout. Capture it after the job is confirmed, or cancel it if the job doesn’t go ahead.",
      "",
    ]);
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `${pack.title} quote — ${total} — ${paymentLabel}`,
        from_name: "Gladstone Uncovered",
        name: details.name,
        email: details.email,
        phone: details.phone,
        replyto: details.email,
        message: body,
      }),
    }).catch(() => {});
    notifySms("quote", lines);
  }

  function notifySms(kind, lines) {
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

  async function sendPayment(form, portion) {
    const error = form.querySelector("[data-quote-error]");
    const success = form.querySelector("[data-quote-success]");
    const missing = readDetails(form);
    if (missing.length) {
      if (error) error.textContent = `Add your ${missing.join(", ")}.`;
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      if (error) error.textContent = "Enter a valid email address.";
      return;
    }

    const lines = chosenLines();
    if (lines.some((line) => line.confirm)) {
      if (error) {
        error.textContent = "We’ll confirm this price before payment.";
      }
      return;
    }

    const cfg = window.GLADSTONE_CONFIG || {};
    const buttons = form.querySelectorAll("[data-pay]");
    buttons.forEach((button) => {
      button.disabled = true;
    });
    const active = form.querySelector(`[data-pay="${portion}"]`);
    if (active) active.textContent = "Opening checkout…";
    if (error) error.textContent = "";
    if (success) success.textContent = "";

    const fail = (notice) => {
      if (!root.isConnected) return;
      render();
      const nextError = root.querySelector("[data-quote-error]");
      if (nextError) {
        nextError.textContent =
          notice || "Couldn’t open checkout. Try again in a moment.";
      }
    };

    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      fail("Payment isn’t set up yet.");
      return;
    }

    const payload = {
      packageId: pack.id,
      pay: portion,
      amountCents: holdCents(lines, portion),
      selections: selectionPayload(),
      customer: {
        name: details.name,
        phone: details.phone,
        email: details.email,
        venue: details.venue,
        eventDate: details.eventDate,
        arrivalTime: details.arrivalTime,
        message: details.message,
      },
      successUrl: `${window.location.origin}/quote-held.html?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: window.location.href,
    };

    fetch(
      `${cfg.supabaseUrl.replace(/\/$/, "")}/functions/v1/create-service-checkout`,
      {
        method: "POST",
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )
      .then((res) => res.json().catch(() => ({})).then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (!res.ok || !data.url) {
          fail(String(data.error || ""));
          return;
        }
        notifyInbox(lines, portion);
        window.location.href = data.url;
      })
      .catch(() => fail(""));
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
      pruneSelection(step);
    } else if (selected[step.id] !== optionId) {
      selected[step.id] = optionId;
    } else {
      return;
    }
    render();
  }

  function changeQuantity(step, optionId, direction) {
    const option = optionById(step, optionId);
    if (!option || !selectionList(step).includes(optionId)) return;
    const max = option.max || 12;
    const current = quantityOf(step, optionId);
    const next = direction === "up" ? current + 1 : current - 1;
    if (next < 1 || next > max) return;
    if (!quantities[step.id]) quantities[step.id] = {};
    quantities[step.id][optionId] = next;
    render();
  }

  root.addEventListener("click", (event) => {
    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton && root.contains(qtyButton)) {
      if (qtyButton.disabled) return;
      const step = steps.find((item) => item.id === qtyButton.getAttribute("data-step"));
      if (step) {
        changeQuantity(
          step,
          qtyButton.getAttribute("data-qty-option"),
          qtyButton.getAttribute("data-qty")
        );
      }
      return;
    }

    const serviceButton = event.target.closest("[data-service]");
    if (serviceButton && root.contains(serviceButton)) {
      chooseService(serviceButton.getAttribute("data-service"));
      return;
    }

    const option = event.target.closest("[data-option]");
    if (option && root.contains(option)) {
      if (option.disabled) return;
      const step = steps.find((item) => item.id === option.getAttribute("data-step"));
      if (step) choose(step, option.getAttribute("data-option"));
      return;
    }

    if (event.target.closest("[data-quote-back]")) {
      const step = currentStep();
      if (step) readExtra(step);
      index = Math.max(0, index - 1);
      render();
      return;
    }

    if (event.target.closest("[data-quote-next]")) {
      if (combined && index === 0) {
        const error = root.querySelector("[data-quote-error]");
        if (!pack) {
          if (error) error.textContent = "Choose a service to continue.";
          return;
        }
        index += 1;
        render();
        return;
      }
      const step = currentStep();
      if (step && !canContinue(step)) return;
      index += 1;
      render();
    }
  });

  root.addEventListener("input", (event) => {
    const extra = event.target.closest("[data-quote-extra]");
    if (extra) {
      extras[extra.getAttribute("data-quote-extra")] = extra.value;
      return;
    }
    if (event.target.name && event.target.closest("[data-quote-form]")) {
      details[event.target.name] = event.target.value;
    }
  });

  root.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-quote-form]");
    if (!form) return;
    event.preventDefault();
    const portion = event.submitter && event.submitter.getAttribute("data-pay");
    if (portion === "enquire" && enquirySent) return;
    if (portion && portion !== "enquire") sendPayment(form, portion);
    else sendRequest(form);
  });

  function resetQuote() {
    Object.keys(selected).forEach((key) => {
      delete selected[key];
    });
    Object.keys(extras).forEach((key) => {
      delete extras[key];
    });
    Object.keys(details).forEach((key) => {
      delete details[key];
    });
    Object.keys(quantities).forEach((key) => {
      delete quantities[key];
    });
    index = 0;
    lastIndex = -1;
    enquirySent = false;
    if (combined) {
      pack = null;
      steps = [];
    }
    render();
  }

  const reset = document.querySelector("[data-quote-reset]");
  if (reset) reset.addEventListener("click", resetQuote);

  render();
})();
