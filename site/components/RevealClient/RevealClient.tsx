"use client";

import { useEffect } from "react";

// Ports the behavior from the original site/landing.js: scroll-reveal of
// `.reveal` elements, the `.scrolled` nav state, and the hero pointer-tilt.
// Renders nothing; it only wires up listeners against the static markup.
export function RevealClient() {
  useEffect(() => {
    // nav scrolled state
    const nav = document.querySelector<HTMLElement>(".lp-nav");
    const onScrollNav = () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScrollNav();

    // scroll reveals (scroll check, reliable everywhere)
    const revealEls = Array.prototype.slice.call(
      document.querySelectorAll(".reveal"),
    ) as HTMLElement[];
    const checkReveals = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      for (let i = revealEls.length - 1; i >= 0; i--) {
        const el = revealEls[i];
        if (el.getBoundingClientRect().top < vh * 0.92) {
          el.classList.add("in");
          revealEls.splice(i, 1);
        }
      }
    };
    checkReveals();

    window.addEventListener("scroll", onScrollNav, { passive: true });
    window.addEventListener("scroll", checkReveals, { passive: true });
    window.addEventListener("resize", checkReveals);
    window.addEventListener("load", checkReveals);

    // gentle pointer tilt on the hero screen
    const screen = document.querySelector<HTMLElement>(".lp-screen");
    const scene = document.querySelector<HTMLElement>(".lp-scene-wrap");
    let onMove: ((ev: PointerEvent) => void) | undefined;
    let onLeave: (() => void) | undefined;
    if (
      screen &&
      scene &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      matchMedia("(pointer: fine)").matches
    ) {
      onMove = (ev: PointerEvent) => {
        const r = scene.getBoundingClientRect();
        const dx = (ev.clientX - r.left) / r.width - 0.5;
        const dy = (ev.clientY - r.top) / r.height - 0.5;
        screen.style.transform = `perspective(1600px) rotateY(${dx * 3.2}deg) rotateX(${-dy * 2.6}deg)`;
      };
      onLeave = () => {
        screen.style.transform =
          "perspective(1600px) rotateY(0deg) rotateX(0deg)";
      };
      scene.addEventListener("pointermove", onMove);
      scene.addEventListener("pointerleave", onLeave);
    }

    return () => {
      window.removeEventListener("scroll", onScrollNav);
      window.removeEventListener("scroll", checkReveals);
      window.removeEventListener("resize", checkReveals);
      window.removeEventListener("load", checkReveals);
      if (scene && onMove) scene.removeEventListener("pointermove", onMove);
      if (scene && onLeave) scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return null;
}
