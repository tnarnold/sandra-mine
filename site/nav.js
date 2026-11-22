// Mobile menu for the site header (landing page and course). Plain script, no dependencies.
(function () {
  "use strict";
  var nav = document.getElementById("nav");
  var btn = nav && nav.querySelector(".menu-btn");
  if (!btn) return;
  function set(open) {
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  btn.addEventListener("click", function () { set(!nav.classList.contains("open")); });
  // Close after following a link, on Escape, and when the screen gets wide again.
  nav.addEventListener("click", function (e) { if (e.target.closest(".nav-links a")) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1000) set(false); });
})();
