"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const GAP = 520; // z distance between posters
const clamp01 = gsap.utils.clamp(0, 1);

/** Pinned section: the camera flies forward through every MCU film poster. Click one for details. */
export default function Tunnel({ movies, onSelect }) {
  const root = useRef(null);

  useGSAP(() => {
    const posters = gsap.utils.toArray(".poster", root.current);
    if (!posters.length) return;
    const label = root.current.querySelector(".tunnel-label");
    const yearEl = root.current.querySelector(".tunnel-year");
    // Random layout is generated client-side so SSR markup stays deterministic.
    const layout = posters.map((_, i) => ({
      z: -(i + 1) * GAP,
      x: (i % 2 ? 1 : -1) * gsap.utils.random(150, 360),
      y: gsap.utils.random(-120, 120),
      r: gsap.utils.random(-10, 10),
    }));
    const cam = { z: 0 };
    let shownYear = "";

    const render = () => {
      const spread = Math.min(1, innerWidth / 1100);
      let nearest = null;
      posters.forEach((p, i) => {
        const l = layout[i];
        const z = l.z + cam.z;
        // fade in from the far distance, fade out as it passes the camera
        const o = clamp01(z > 0 ? 1 - z / 450 : (z + 3600) / 1400);
        gsap.set(p, {
          xPercent: -50, yPercent: -50, x: l.x * spread, y: l.y * spread,
          z, rotationZ: l.r, opacity: o, visibility: o <= 0 ? "hidden" : "visible",
          pointerEvents: z > -2200 && z < 250 ? "auto" : "none",
        });
        if (z < 200 && (nearest === null || z > layout[nearest].z + cam.z)) nearest = i;
      });
      const year = nearest === null ? "" : movies[nearest].year;
      if (year !== shownYear) {
        shownYear = year;
        yearEl.textContent = year;
        gsap.fromTo(yearEl, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
      }
      gsap.set(label, { opacity: 1 - cam.z / 600, z: cam.z * 0.6 });
    };
    render();

    gsap.to(cam, {
      z: posters.length * GAP + 300,
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: root.current, start: "top top", end: `+=${posters.length * 22}%`, scrub: 1, pin: true,
        onUpdate: (self) => gsap.set(".tunnel-progress span", { scaleX: self.progress }),
      },
    });
    gsap.from(".tunnel-label > *", {
      y: 60, opacity: 0, duration: 1, stagger: 0.1, ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 70%" },
    });
  }, { scope: root });

  const first = movies[0]?.year;
  const last = movies.at(-1)?.year;

  return (
    <section className="tunnel" id="films" ref={root}>
      <div className="tunnel-stage">
        {movies.map((m) => (
          <button key={m.id} className="poster" onClick={() => onSelect({ type: "movie", id: m.id })}>
            <img src={m.poster} alt={m.title} draggable={false} />
            <span className="poster-meta">{m.year} · Phase {m.phase}</span>
          </button>
        ))}
      </div>
      <div className="tunnel-label">
        <p className="eyebrow">01 — The films</p>
        <h2>Fly through<br />the saga</h2>
        <p className="tunnel-sub">
          {movies.length ? `${movies.length} films · ${first}–${last} · click any poster` : "Film data is unavailable right now."}
        </p>
      </div>
      <div className="tunnel-year" aria-hidden="true" />
      <div className="tunnel-progress"><span /></div>
    </section>
  );
}
