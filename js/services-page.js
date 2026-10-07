(() => {
  const mount = document.querySelector("[data-service-list]");
  const services = window.GLADSTONE_SERVICES;
  if (!mount || !services) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  services.forEach((service, index) => {
    mount.appendChild(renderServicePreview(service, index, reduced));
  });
  mount.appendChild(renderSomethingElse(reduced));

  if (reduced) return;

  const items = mount.querySelectorAll(".service-preview");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  items.forEach((item) => observer.observe(item));
})();

function renderServicePreview(service, index, reduced) {
  const link = document.createElement("a");
  link.className = "service-preview";
  if (reduced) link.classList.add("is-in");
  link.href = service.href;

  const copy = document.createElement("div");
  copy.className = "service-preview-copy";

  const head = document.createElement("div");
  head.className = "service-preview-head";

  const title = document.createElement("h2");
  title.className = "section-title";
  title.textContent = service.title;

  const price = document.createElement("p");
  price.className = "service-preview-price";
  price.textContent = service.price;

  head.append(title, price);
  copy.appendChild(head);

  service.description.forEach((paragraph) => {
    const text = document.createElement("p");
    text.className = "service-preview-text";
    text.textContent = paragraph;
    copy.appendChild(text);
  });

  const more = document.createElement("span");
  more.className = "service-preview-more";
  more.append("Explore ");
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  more.appendChild(arrow);
  copy.appendChild(more);

  link.appendChild(copy);
  return link;
}

function renderSomethingElse(reduced) {
  const link = document.createElement("a");
  link.className = "service-preview";
  if (reduced) link.classList.add("is-in");
  link.href = "/services/something-else";

  const copy = document.createElement("div");
  copy.className = "service-preview-copy";

  const title = document.createElement("h2");
  title.className = "section-title";
  title.textContent = "Something Else?";

  const text = document.createElement("p");
  text.className = "service-preview-text";
  text.textContent = "Have something different in mind? Tell us your idea and let’s uncover what we can create.";

  const more = document.createElement("span");
  more.className = "service-preview-more";
  more.append("Write to us ");
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  more.appendChild(arrow);

  copy.append(title, text, more);
  link.appendChild(copy);
  return link;
}
