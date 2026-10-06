"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Infinite marquees that speed up and skew with scroll velocity. */
export default function Marquee({ heroes }) {
  const root = useRef(null);
  const rows = [
    { reverse: false, sep: "✦", items: [["Avengers"], ["Assemble", 1], ["Infinity Saga"], ["Multiverse", 1]] },
    { reverse: true, sep: "●", items: heroes.map((h, i) => [h.name, i % 2]) },
  ];

  useGSAP(() => {
    const loops = gsap.utils.toArray(".marquee", root.current).map((m) => {
      const reverse = m.classList.contains("reverse");
      // content is rendered twice, so moving -50% lands exactly on a copy -> seamless loop
      return gsap.fromTo(m.firstChild,
        { xPercent: reverse ? -50 : 0 },
        { xPercent: reverse ? 0 : -50, duration: reverse ? 60 : 30, ease: "none", repeat: -1 });
    });
    const skewTo = gsap.quickTo(".marquee-track", "skewX", { duration: 0.5, ease: "power3" });
    let settle;

    ScrollTrigger.create({
      onUpdate(self) {
        const v = self.getVelocity();
        const boost = 1 + Math.min(Math.abs(v) / 250, 8);
        loops.forEach((l) => {
          gsap.to(l, { timeScale: boost, duration: 0.2, overwrite: true });
          gsap.to(l, { timeScale: 1, duration: 1.2, delay: 0.25, ease: "power2.out" });
        });
        skewTo(gsap.utils.clamp(-18, 18, v / -250));
        clearTimeout(settle);
        settle = setTimeout(() => skewTo(0), 120);
      },
    });
    return () => clearTimeout(settle);
  }, { scope: root });

  return (
    <section className="marquee-section" ref={root}>
      {rows.map((row, r) => (
        <div key={r} className={`marquee${row.reverse ? " reverse" : ""}`}>
          <div className="marquee-track">
            {[0, 1].map((copy) =>
              row.items.map(([word, outline]) => (
                <span key={`${copy}-${word}`} className={`marquee-item${outline ? " outline" : ""}`} aria-hidden={copy === 1}>
                  {word} <i>{row.sep}</i>
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
