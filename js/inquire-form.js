(() => {
  const form = document.querySelector("[data-inquire-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const date = String(data.get("date") || "").trim();
    const details = String(data.get("details") || "").trim();
    if (!name || !email || !date || !details) return;

    const inbox =
      (window.GLADSTONE_CONFIG &&
        (window.GLADSTONE_CONFIG.bookingEmail ||
          window.GLADSTONE_CONFIG.inquiryEmail)) ||
      window.GLADSTONE_BOOKING_EMAIL ||
      "";
    const subject = `Gladstone Uncovered enquiry — ${date}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Date: ${date}`,
      "",
      "Details:",
      details,
    ].join("\n");

    const success = form.querySelector("[data-inquire-success]");
    if (inbox) {
      window.location.href = `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    }
    if (success) {
      success.textContent = inbox
        ? "Your email app should open with the enquiry ready to send."
        : "Enquiry ready — add bookingEmail in js/config.js to send via email.";
      success.classList.add("is-visible");
    }
  });
})();
