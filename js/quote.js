(() => {
  const root = document.querySelector("[data-quote]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const packageId = params.get("service") || root.dataset.package || "real-estate";
  const pkg = window.GLADSTONE_QUOTE_PACKAGES?.[packageId];

  const titleEl = root.querySelector("[data-quote-title]");
  const sectionsEl = root.querySelector("[data-quote-sections]");
  const totalEl = root.querySelector("[data-quote-total]");
  const totalHint = root.querySelector("[data-quote-hint]");
  const bookBtn = root.querySelector("[data-quote-book]");
  const enquireBtn = root.querySelector("[data-quote-enquire]");
  const statusEl = root.querySelector("[data-quote-status]");
  const breakdownEl = root.querySelector("[data-quote-breakdown]");

  if (!pkg) {
    if (titleEl) titleEl.textContent = "Quote unavailable";
    if (totalHint) {
      totalHint.textContent = "This service package could not be loaded.";
    }
    return;
  }

  if (titleEl) titleEl.textContent = pkg.title;

  /** @type {Record<string, string | string[]>} */
  const selections = {};

  function formatMoney(cents) {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: (pkg.currency || "aud").toUpperCase(),
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  function priceLabel(option) {
    if (option.inquire) return "Inquire";
    if (!option.priceCents) return "Included";
    return `+${formatMoney(option.priceCents).replace(/\.00$/, "")}`;
  }

  function priceClass(option) {
    if (option.inquire) return "is-inquire";
    if (!option.priceCents) return "is-included";
    return "is-extra";
  }

  function getOption(sectionId, optionId) {
    const section = pkg.sections.find((s) => s.id === sectionId);
    return section?.options.find((o) => o.id === optionId);
  }

  function computeQuote() {
    let total = pkg.basePriceCents;
    let inquire = false;
    const lines = [
      { label: pkg.baseLabel || "Base package", cents: pkg.basePriceCents },
    ];

    for (const section of pkg.sections) {
      if (section.type === "single") {
        const id = selections[section.id];
        if (!id) continue;
        const opt = getOption(section.id, id);
        if (!opt) continue;
        if (opt.inquire) {
          inquire = true;
          lines.push({ label: opt.label, cents: null, inquire: true });
        } else if (opt.priceCents) {
          total += opt.priceCents;
          lines.push({ label: opt.label, cents: opt.priceCents });
        } else {
          lines.push({ label: opt.label, cents: 0 });
        }
      } else {
        const ids = selections[section.id] || [];
        ids.forEach((id) => {
          const opt = getOption(section.id, id);
          if (!opt) return;
          if (opt.inquire) {
            inquire = true;
            lines.push({ label: opt.label, cents: null, inquire: true });
          } else if (opt.priceCents) {
            total += opt.priceCents;
            lines.push({ label: opt.label, cents: opt.priceCents });
          }
        });
      }
    }

    const requiredOk = pkg.sections
      .filter((s) => s.required)
      .every((s) => Boolean(selections[s.id]));

    return { total, inquire, lines, requiredOk };
  }

  function renderSections() {
    if (!sectionsEl) return;
    sectionsEl.replaceChildren();

    pkg.sections.forEach((section) => {
      const block = document.createElement("div");
      block.className = "quote-section";
      block.innerHTML = `<h2>${section.title}</h2><p class="quote-hint">${section.hint || ""}</p>`;
      const list = document.createElement("div");
      list.className = "quote-options";
      list.setAttribute("role", section.type === "multi" ? "group" : "radiogroup");
      list.setAttribute("aria-label", section.title);

      section.options.forEach((option) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quote-option";
        const selected =
          section.type === "single"
            ? selections[section.id] === option.id
            : (selections[section.id] || []).includes(option.id);
        if (selected) btn.classList.add("is-selected");
        btn.innerHTML = `
          <span class="quote-option-check" aria-hidden="true"></span>
          <span class="quote-option-label">${option.label}</span>
          <span class="quote-option-price ${priceClass(option)}">${priceLabel(option)}</span>
        `;
        btn.addEventListener("click", () => {
          if (section.type === "single") {
            selections[section.id] = option.id;
          } else {
            const set = new Set(selections[section.id] || []);
            if (set.has(option.id)) {
              set.delete(option.id);
            } else {
              set.add(option.id);
              const group = section.exclusiveGroups?.find((g) =>
                g.includes(option.id)
              );
              if (group) {
                group.forEach((id) => {
                  if (id !== option.id) set.delete(id);
                });
              }
            }
            selections[section.id] = [...set];
          }
          renderSections();
          renderSummary();
        });
        list.appendChild(btn);
      });

      block.appendChild(list);
      if (section.note) {
        const note = document.createElement("p");
        note.className = "quote-note";
        note.textContent = section.note;
        block.appendChild(note);
      }
      sectionsEl.appendChild(block);
    });
  }

  function renderSummary() {
    const quote = computeQuote();

    if (breakdownEl) {
      breakdownEl.replaceChildren();
      quote.lines.forEach((line) => {
        const row = document.createElement("div");
        row.className = "quote-breakdown-row";
        const right = line.inquire
          ? "Inquire"
          : line.cents
            ? `+${formatMoney(line.cents)}`
            : line.cents === 0
              ? "Included"
              : formatMoney(line.cents);
        row.innerHTML = `<span>${line.label}</span><span>${right}</span>`;
        breakdownEl.appendChild(row);
      });
    }

    if (!quote.requiredOk) {
      if (totalEl) totalEl.textContent = "—";
      if (totalHint) {
        totalHint.textContent =
          "Select your location and property type to calculate your estimate.";
      }
      bookBtn && (bookBtn.disabled = true);
      enquireBtn && enquireBtn.setAttribute("hidden", "");
      return;
    }

    if (quote.inquire) {
      if (totalEl) totalEl.textContent = "Inquire";
      if (totalHint) {
        totalHint.textContent =
          "This selection needs a custom quote — send an enquiry and we’ll confirm pricing.";
      }
      bookBtn && (bookBtn.disabled = true);
      enquireBtn && enquireBtn.removeAttribute("hidden");
      return;
    }

    if (totalEl) totalEl.textContent = formatMoney(quote.total);
    if (totalHint) {
      totalHint.textContent =
        "Estimated total for this package. Book now to pay and confirm details via Stripe.";
    }
    bookBtn && (bookBtn.disabled = false);
    enquireBtn && enquireBtn.setAttribute("hidden", "");
  }

  function selectionSummary() {
    const parts = [];
    pkg.sections.forEach((section) => {
      if (section.type === "single") {
        const id = selections[section.id];
        const opt = id && getOption(section.id, id);
        if (opt) parts.push(`${section.title}: ${opt.label}`);
      } else {
        const ids = selections[section.id] || [];
        if (ids.length) {
          const labels = ids
            .map((id) => getOption(section.id, id)?.label)
            .filter(Boolean);
          parts.push(`${section.title}: ${labels.join(", ")}`);
        }
      }
    });
    return parts.join("\n");
  }

  async function startCheckout() {
    const quote = computeQuote();
    if (!quote.requiredOk || quote.inquire || bookBtn?.disabled) return;

    const cfg = window.GLADSTONE_CONFIG || {};
    const payload = {
      packageId: pkg.id,
      selections,
      amountCents: quote.total,
      currency: pkg.currency || "aud",
      description: pkg.title,
      summary: selectionSummary(),
      successUrl: `${window.location.origin}${window.location.pathname.replace(
        /[^/]*$/,
        "quote-success.html"
      )}`,
      cancelUrl: window.location.href,
    };

    if (statusEl) {
      statusEl.textContent = "Opening secure checkout…";
      statusEl.classList.add("is-visible");
    }
    if (bookBtn) bookBtn.disabled = true;

    try {
      if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
        const url = `${cfg.supabaseUrl.replace(/\/$/, "")}/functions/v1/create-checkout`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            apikey: cfg.supabaseAnonKey,
            Authorization: `Bearer ${cfg.supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Checkout failed");
        if (!data.url) throw new Error("No checkout URL returned");
        window.location.href = data.url;
        return;
      }

      // Fallback until Stripe Edge Function is configured: email the quote
      const inbox = cfg.bookingEmail || window.GLADSTONE_BOOKING_EMAIL || "";
      if (!inbox) throw new Error("Add bookingEmail or connect Stripe checkout.");
      const subject = `Booking request — ${pkg.title} — ${formatMoney(quote.total)}`;
      const body = [
        `Service: ${pkg.title}`,
        `Estimated total: ${formatMoney(quote.total)}`,
        "",
        selectionSummary(),
        "",
        "(Stripe checkout not configured yet — this is an email fallback.)",
      ].join("\n");
      window.location.href = `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      if (statusEl) {
        statusEl.textContent =
          "Stripe isn’t connected yet — your email app will open with this quote.";
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || "Could not start checkout.";
      }
    } finally {
      if (bookBtn) bookBtn.disabled = false;
      renderSummary();
    }
  }

  function startEnquire() {
    const cfg = window.GLADSTONE_CONFIG || {};
    const inbox = cfg.bookingEmail || window.GLADSTONE_BOOKING_EMAIL || "";
    const quote = computeQuote();
    const subject = `Quote enquiry — ${pkg.title}`;
    const body = [
      `Service: ${pkg.title}`,
      quote.inquire ? "Total: custom (inquire)" : `Estimate: ${formatMoney(quote.total)}`,
      "",
      selectionSummary(),
      "",
      "Notes:",
      "",
    ].join("\n");
    if (inbox) {
      window.location.href = `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    }
  }

  bookBtn?.addEventListener("click", startCheckout);
  enquireBtn?.addEventListener("click", startEnquire);

  renderSections();
  renderSummary();
})();
