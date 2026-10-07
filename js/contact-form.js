(() => {
  function bindContactForm(form) {
    if (!form || form.dataset.contactBound === "true") return;
    form.dataset.contactBound = "true";
    const error = form.querySelector("[data-contact-error]");
    const success = form.querySelector("[data-contact-success]");
    const source = form.getAttribute("data-contact-source") || "the bookings page";
    const subject =
      form.getAttribute("data-contact-subject") || "Email — Gladstone Uncovered";

    function fieldValue(name) {
      const field = form.elements.namedItem(name);
      return String((field && field.value) || "").trim();
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = fieldValue("name");
      const email = fieldValue("email");
      const phone = fieldValue("phone");
      const message = fieldValue("message");
      const submit = form.querySelector("[type=submit]");
      const sendLabel = submit ? submit.textContent : "Send email";

      if (error) error.textContent = "";
      if (success) {
        success.textContent = "";
        success.classList.remove("is-visible");
      }

      if (!name || !email || !message) {
        if (error) error.textContent = "Add your name, email and message.";
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (error) error.textContent = "Enter a valid email address.";
        return;
      }

      const accessKey =
        window.GLADSTONE_CONFIG && window.GLADSTONE_CONFIG.quoteAccessKey;
      if (!accessKey) {
        if (error) error.textContent = "Email isn’t set up yet.";
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending…";
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
          subject,
          from_name: "Gladstone Uncovered",
          name,
          email,
          phone,
          replyto: email,
          message: `${name} wrote from ${source}.${phone ? `\nPhone: ${phone}` : ""}\n\n${message}`,
        }),
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          if (data.success !== true && String(data.success) !== "true") {
            if (error) {
              error.textContent =
                String(data.message || "") || "Couldn’t send the email. Try again in a moment.";
            }
            return;
          }
          form.reset();
          if (success) {
            success.textContent = "Message sent. We’ll reply to the email you entered.";
            success.classList.add("is-visible");
          }
          form.dispatchEvent(new CustomEvent("gladstone:enquiry-sent", { bubbles: true }));
          const cfg = window.GLADSTONE_CONFIG || {};
          if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
            fetch(`${cfg.supabaseUrl.replace(/\/$/, "")}/functions/v1/notify-sms`, {
              method: "POST",
              headers: {
                apikey: cfg.supabaseAnonKey,
                Authorization: `Bearer ${cfg.supabaseAnonKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ kind: "enquiry", name }),
            }).catch(() => {});
          }
        })
        .catch(() => {
          if (error) error.textContent = "Couldn’t send the email. Try again in a moment.";
        })
        .finally(() => {
          clearTimeout(timer);
          if (submit) {
            submit.disabled = false;
            submit.textContent = sendLabel;
          }
        });
    });
  }

  window.GLADSTONE_BIND_CONTACT_FORM = bindContactForm;
  document.querySelectorAll("[data-contact-form]").forEach(bindContactForm);
})();
