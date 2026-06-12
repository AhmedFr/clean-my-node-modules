/* landing.js — pixel meters, scroll reveals, nav state. */
(function () {
  "use strict";

  // ---------- color helpers (ported from the app) ----------
  function hexToRgb(c) {
    if (c[0] === "#") {
      var h = c.slice(1);
      if (h.length === 3) h = h.split("").map(function (x) { return x + x; }).join("");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    var m = c.match(/(\d+\.?\d*)/g) || [136, 143, 152];
    return [+m[0], +m[1], +m[2]];
  }
  function mix(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var A = hexToRgb(a), B = hexToRgb(b);
    return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," +
      Math.round(A[1] + (B[1] - A[1]) * t) + "," +
      Math.round(A[2] + (B[2] - A[2]) * t) + ")";
  }
  var ACCENT = "#ff6363";
  function statusColor(ratio) {
    var safe = "#34d399", warn = "#f5b14c";
    if (ratio <= 0.5) return mix("#22b378", safe, ratio / 0.5);
    if (ratio <= 0.82) return mix(safe, warn, (ratio - 0.5) / 0.32);
    return mix(warn, ACCENT, Math.min(1, (ratio - 0.82) / 0.18));
  }

  // ---------- pixel meter ----------
  function buildMeter(el) {
    var usedGB = parseFloat(el.dataset.used);
    var thresholdGB = parseFloat(el.dataset.threshold);
    var cells = parseInt(el.dataset.cells || "32", 10);
    var trackMaxGB = Math.max(thresholdGB * 1.5, usedGB * 1.05);
    var limitPos = Math.min(0.94, thresholdGB / trackMaxGB);
    var limitIdx = Math.min(cells - 1, Math.max(0, Math.floor(limitPos * cells)));
    var frag = document.createDocumentFragment();
    for (var i = 0; i < cells; i++) {
      var d = document.createElement("div");
      d.className = "cell";
      var p = ((i + 0.5) / cells) * trackMaxGB;
      if (i === limitIdx) {
        d.className = "cell hatch";
        d.title = thresholdGB + " GB limit";
      } else if (p <= usedGB) {
        var col = statusColor(p / thresholdGB);
        d.style.backgroundColor = col;
        if (p > thresholdGB) d.style.boxShadow = "0 0 7px " + col;
      }
      frag.appendChild(d);
    }
    el.appendChild(frag);
  }

  // ---------- init ----------
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  ready(function () {
    document.querySelectorAll(".lp-meter").forEach(buildMeter);

    // decorative pixel strips (brand motif)
    document.querySelectorAll(".pixrow").forEach(function (el) {
      var n = parseInt(el.dataset.cells || "7", 10);
      for (var i = 0; i < n; i++) {
        var c = document.createElement("i");
        c.style.background = statusColor((i + 0.5) / n);
        el.appendChild(c);
      }
    });

    // nav scrolled state
    var nav = document.querySelector(".lp-nav");
    function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // scroll reveals (rAF/scroll check — more reliable than IO in embedded views)
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    function checkReveals() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = revealEls.length - 1; i >= 0; i--) {
        var el = revealEls[i];
        if (el.getBoundingClientRect().top < vh * 0.92) {
          el.classList.add("in");
          revealEls.splice(i, 1);
        }
      }
    }
    checkReveals();
    window.addEventListener("scroll", checkReveals, { passive: true });
    window.addEventListener("resize", checkReveals);
    window.addEventListener("load", checkReveals);

    // gentle pointer tilt on the hero screen
    var screen = document.querySelector(".lp-screen");
    var scene = document.querySelector(".lp-scene-wrap");
    if (screen && scene && !matchMedia("(prefers-reduced-motion: reduce)").matches && matchMedia("(pointer: fine)").matches) {
      scene.addEventListener("pointermove", function (ev) {
        var r = scene.getBoundingClientRect();
        var dx = (ev.clientX - r.left) / r.width - 0.5;
        var dy = (ev.clientY - r.top) / r.height - 0.5;
        screen.style.transform = "perspective(1600px) rotateY(" + (dx * 3.2) + "deg) rotateX(" + (-dy * 2.6) + "deg)";
      });
      scene.addEventListener("pointerleave", function () {
        screen.style.transform = "perspective(1600px) rotateY(0deg) rotateX(0deg)";
      });
    }
  });
})();
