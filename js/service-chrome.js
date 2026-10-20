(() => {
  if (!document.body || !document.body.classList.contains("page-service")) return;

  const script = document.currentScript;
  const root = script && script.src
    ? script.src.replace(/\/js\/service-chrome\.js(?:\?.*)?$/i, "/")
    : new URL("../../", window.location.href).href;

  const home = `${root}index.html`;
  const logo = `${root}images/logo.png`;

  const chrome = {
    header: `<header class="site-header">
      <nav class="nav" aria-label="Primary">
        <a class="logo" href="${home}" aria-label="Gladstone Uncovered, home">
          <img src="${logo}" alt="" width="156" height="62" />
        </a>
        <button class="nav-contact" type="button" data-enquire-open data-copy="nav.contact">Contact</button>
      </nav>
    </header>`,
    footer: `<footer class="site-footer">
      <div class="footer-inner">
        <p class="footer-brand-line" data-copy="footer.line">Uncover a different perspective.</p>
        <nav class="footer-actions" aria-label="Footer">
          <button type="button" class="footer-pill" data-enquire-open>Contact</button>
          <a class="footer-pill" href="${home}#quote">Quote</a>
          <a class="footer-pill" href="${root}more-info.html">More info</a>
        </nav>
      </div>
    </footer>`,
    enquire: `<dialog class="enquire-dialog" data-enquire-dialog aria-labelledby="enquire-title">
      <button type="button" class="enquire-dialog-close" data-enquire-close aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <h2 id="enquire-title" data-copy="home.enquire.title">Send a message.</h2>
      <p class="enquire-dialog-note" data-copy="home.enquire.note">Tell us what you need and we’ll get back to you.</p>
      <form
        class="home-enquire-form"
        data-contact-form
        data-contact-source="the website"
        data-contact-subject="Enquiry — Gladstone Uncovered"
        novalidate
      >
        <div class="home-enquire-fields">
          <input name="name" type="text" autocomplete="name" placeholder="Name" aria-label="Name" required />
          <input name="email" type="email" autocomplete="email" placeholder="Email" aria-label="Email" required />
        </div>
        <label class="home-enquire-message">
          <span class="sr-only">Message</span>
          <textarea name="message" rows="3" placeholder="What do you need?" required></textarea>
        </label>
        <button class="home-enquire-send" type="submit">Send</button>
        <p class="home-enquire-error" data-contact-error role="alert"></p>
        <p class="home-enquire-success" data-contact-success role="status"></p>
      </form>
    </dialog>`,
  };

  function mount(slot, html) {
    const target = document.querySelector(`[data-service-chrome="${slot}"]`);
    if (target) {
      target.outerHTML = html;
      return;
    }

    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    const node = wrap.firstElementChild;
    if (!node) return;

    const main = document.querySelector("main");
    if (slot === "header") {
      document.body.insertBefore(node, main || document.body.firstChild);
      return;
    }

    if (slot === "footer") {
      if (main) main.after(node);
      else document.body.appendChild(node);
      return;
    }

    const footer = document.querySelector(".site-footer");
    if (footer) footer.after(node);
    else if (main) main.after(node);
    else document.body.appendChild(node);
  }

  mount("header", chrome.header);
  mount("footer", chrome.footer);
  mount("enquire", chrome.enquire);
})();
