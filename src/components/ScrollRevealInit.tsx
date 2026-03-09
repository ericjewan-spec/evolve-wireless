"use client";

import { useEffect } from "react";

export default function ScrollRevealInit() {
  useEffect(() => {
    // ── SCROLL REVEAL (motion spec: 700ms ease-out, 28px, stagger by sibling index) ──
    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger siblings: find index among siblings with .reveal
            const parent = entry.target.parentElement;
            if (parent) {
              const siblings = parent.querySelectorAll(":scope > .reveal, :scope > * > .reveal");
              const idx = Array.from(siblings).indexOf(entry.target as Element);
              const delay = idx >= 0 ? idx * 80 : 0;
              setTimeout(() => entry.target.classList.add("visible"), delay);
            } else {
              entry.target.classList.add("visible");
            }
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "-5% 0px" }
    );
    reveals.forEach((el) => revealObserver.observe(el));

    // ── HERO WORD STAGGER (motion spec: 600ms ease-out, 55ms per word) ──
    const heroWords = document.querySelectorAll(".hero-word");
    if (heroWords.length) {
      heroWords.forEach((word, i) => {
        setTimeout(() => {
          const el = word as HTMLElement;
          el.style.transition = `opacity 600ms cubic-bezier(0.16,1,0.3,1) ${i * 55}ms, transform 600ms cubic-bezier(0.16,1,0.3,1) ${i * 55}ms`;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, 200); // 200ms initial delay after page load
      });
    }

    // ── STAT COUNTERS (motion spec: easeOutCubic, 1200ms duration) ──
    function countTo(el: HTMLElement, target: number, duration: number, suffix: string = "", decimals: number = 0) {
      const start = performance.now();
      const fmt = (v: number) => decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
      function frame(now: number) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = fmt(ease * target) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const target = parseFloat(el.dataset.countTo || "0");
            const suffix = el.dataset.countSuffix || "";
            const decimals = parseInt(el.dataset.countDecimals || "0");
            countTo(el, target, 1200, suffix, decimals);
            statObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-count-to]").forEach((el) => statObserver.observe(el));

    // ── NAV ENTRANCE (motion spec: 500ms ease-out, translateY -12px, 0ms delay) ──
    const nav = document.querySelector("nav");
    if (nav) {
      const navEl = nav as HTMLElement;
      navEl.style.animation = "navEntrance 500ms cubic-bezier(0.16,1,0.3,1) both";
    }

    return () => {
      revealObserver.disconnect();
      statObserver.disconnect();
    };
  }, []);

  return null;
}
