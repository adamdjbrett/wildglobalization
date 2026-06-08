const header = document.querySelector("[data-site-header]");
const hero = document.querySelector("[data-hero]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-site-nav]");
const themeToggle = document.querySelector("[data-theme-toggle]");

if (header && hero && document.body.classList.contains("is-home")) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle("site-header--transparent", entry.isIntersecting);
      header.classList.toggle("site-header--solid", !entry.isIntersecting);
    },
    { rootMargin: "-92px 0px 0px 0px", threshold: 0 }
  );
  observer.observe(hero);
}

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
  });
}

document.querySelectorAll(".submenu-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    button.closest(".nav-item").classList.toggle("is-open", !isOpen);
  });
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  });
}
