"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { gsap, useGSAP } from "@/lib/gsap";
import { createStage } from "@/lib/stage3d";
import { buildProp } from "@/lib/props3d";
import { getLenis } from "@/lib/lenis";

const pad = (n) => String(n).padStart(2, "0");
const TOP_STATS = ["strength", "intelligence", "combat"];

/**
 * Pinned 3D showcase. Scrolling steps through the heroes; each step swaps the 3D prop,
 * the copy and the theme colours with GSAP. Clicking the model opens the hero dossier.
 */
export default function Roster({ heroes, onSelect }) {
  const root = useRef(null);
  const canvas = useRef(null);
  const trigger = useRef(null);
  const [active, setActive] = useState(0);
  const N = heroes.length;

  useGSAP((_, contextSafe) => {
    /* ---------- 3D scene: one holder per hero, only the active one is visible ---------- */
    const stage = createStage(canvas.current, { z: 6.2 });
    const pivot = new THREE.Group();
    stage.scene.add(pivot);
    const ticks = [];
    let disposed = false;
    const holders = heroes.map((hero, i) => {
      const holder = new THREE.Group(); // transition transforms
      const wobble = new THREE.Group(); // idle motion
      holder.add(wobble);
      holder.visible = i === 0;
      pivot.add(holder);
      buildProp(hero).then((prop) => {
        if (disposed) return;
        wobble.add(prop.group);
        ticks.push(prop.tick);
      });
      return holder;
    });
    stage.onFrame((t, dt) => {
      pivot.scale.setScalar(Math.min(1, canvas.current.clientHeight / 640)); // keep tall props inside short canvases
      ticks.forEach((tick) => tick(t, dt));
      holders.forEach((h, i) => {
        if (!h.visible) return;
        h.children[0].rotation.y = Math.sin(t * 0.5 + i) * 0.5;
        h.children[0].position.y = Math.sin(t * 1.1 + i) * 0.07;
      });
    });
    const io = new IntersectionObserver(([e]) => stage.setActive(e.isIntersecting));
    io.observe(root.current);

    /* ---------- copy blocks ---------- */
    const cards = gsap.utils.toArray(".hero-card", root.current);
    gsap.set(cards.slice(1), { autoAlpha: 0 });
    const rimColor = new THREE.Color();

    let current = 0;
    const show = contextSafe((next) => {
      if (next === current) return;
      const prev = current;
      const dir = next > prev ? 1 : -1;
      current = next;
      setActive(next);
      const hero = heroes[next];

      // 3D: old prop spins away and shrinks, new one spins in from the other side
      const out = holders[prev];
      const inn = holders[next];
      gsap.killTweensOf([out.scale, out.rotation, out.position, inn.scale, inn.rotation, inn.position]);
      gsap.to(out.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3, ease: "power3.in", onComplete: () => (out.visible = false) });
      gsap.to(out.rotation, { y: dir * Math.PI, duration: 0.3, ease: "power3.in" });
      gsap.to(out.position, { x: -dir * 1.5, duration: 0.3, ease: "power3.in" });
      inn.visible = true;
      gsap.fromTo(inn.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.65, ease: "expo.out", delay: 0.12 });
      gsap.fromTo(inn.rotation, { y: -dir * Math.PI * 1.5 }, { y: 0, duration: 0.8, ease: "expo.out", delay: 0.12 });
      gsap.fromTo(inn.position, { x: dir * 1.5 }, { x: 0, duration: 0.65, ease: "expo.out", delay: 0.12 });

      // theme colours + rim light
      gsap.to(root.current, { "--c": hero.color, "--a": hero.accent, duration: 0.6, ease: "power2.out" });
      rimColor.set(hero.accent);
      gsap.to(stage.rim.color, { r: rimColor.r, g: rimColor.g, b: rimColor.b, duration: 0.6 });

      // copy: old block slides out, new block's lines rise in
      gsap.to(cards[prev], { autoAlpha: 0, y: -40 * dir, duration: 0.22, ease: "power2.in" });
      gsap.set(cards[next], { autoAlpha: 1, y: 0 });
      gsap.fromTo(cards[next].querySelector(".hero-name span"),
        { yPercent: 110 * dir, rotationX: -70 * dir },
        { yPercent: 0, rotationX: 0, duration: 0.6, ease: "expo.out", delay: 0.1 });
      gsap.fromTo(cards[next].querySelectorAll(".hero-anim"),
        { y: 30 * dir, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.04, delay: 0.15 });
      gsap.fromTo(cards[next].querySelectorAll(".mini-fill"),
        { scaleX: 0 },
        { scaleX: (_, el) => el.dataset.v / 100, duration: 0.7, ease: "expo.out", stagger: 0.05, delay: 0.2 });
    });

    gsap.set(".mini-fill", { scaleX: (_, el) => el.dataset.v / 100 });
    gsap.set(root.current, { "--c": heroes[0].color, "--a": heroes[0].accent });

    trigger.current = gsap.timeline({
      scrollTrigger: {
        trigger: root.current, start: "top top", end: `+=${N * 70}%`, scrub: true, pin: true,
        onUpdate: (self) => show(Math.min(N - 1, Math.floor(self.progress * N))),
      },
    }).to(".roster-progress span", { scaleX: 1, ease: "none" }).scrollTrigger;

    gsap.from(".roster-head > *, .hero-card:first-child", {
      y: 60, opacity: 0, duration: 0.7, stagger: 0.08, ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 70%" },
    });

    /* ---------- pointer: parallax, hover + click on the model ---------- */
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = (e) => {
      const r = canvas.current.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, stage.camera);
      return raycaster.intersectObject(holders[current], true).length > 0;
    };
    const prx = gsap.quickTo(pivot.rotation, "x", { duration: 1, ease: "power3" });
    const pry = gsap.quickTo(pivot.rotation, "y", { duration: 1, ease: "power3" });
    const onMove = (e) => {
      pry((e.clientX / innerWidth - 0.5) * 0.8);
      prx((e.clientY / innerHeight - 0.5) * 0.5);
      canvas.current.style.cursor = hit(e) ? "pointer" : "default";
    };
    const onClick = (e) => { if (hit(e)) onSelect({ type: "hero", key: heroes[current].key }); };
    const el = root.current;
    const cv = canvas.current;
    el.addEventListener("pointermove", onMove);
    cv.addEventListener("click", onClick);

    return () => {
      disposed = true;
      el.removeEventListener("pointermove", onMove);
      cv.removeEventListener("click", onClick);
      io.disconnect();
      stage.dispose();
    };
  }, { scope: root });

  // jump to the middle of a hero's scroll segment
  const goTo = (i) => {
    const st = trigger.current;
    if (!st) return;
    const y = st.start + ((i + 0.5) / N) * (st.end - st.start);
    getLenis() ? getLenis().scrollTo(y, { duration: 1.2 }) : window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section className="roster" id="heroes" ref={root}>
      <div className="roster-bg" />
      <div className="roster-canvas"><canvas ref={canvas} /></div>
      <div className="roster-head">
        <p className="eyebrow">02 — The heroes</p>
      </div>
      <div className="roster-info">
        {heroes.map((h, i) => (
          <div className="hero-card" key={h.key}>
            <span className="hero-index hero-anim">{pad(i + 1)} / {pad(N)}</span>
            <h2 className="hero-name"><span>{h.name}</span></h2>
            {(h.realName || h.actor) && (
              <p className="hero-real hero-anim">
                {h.realName}{h.actor && <> · played by <b>{h.actor}</b></>}
              </p>
            )}
            {h.description && <p className="hero-desc hero-anim">{h.description}</p>}
            {h.powerstats && (
              <div className="mini-stats hero-anim">
                {TOP_STATS.map((s) => (
                  <div className="mini-stat" key={s}>
                    <span>{s}</span>
                    <div className="mini-bar"><div className="mini-fill" data-v={h.powerstats[s] ?? 0} /></div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn hero-anim" onClick={() => onSelect({ type: "hero", key: h.key })}>
              Open dossier <span>→</span>
            </button>
          </div>
        ))}
      </div>
      <div className="roster-dots">
        {heroes.map((h, i) => (
          <button key={h.key} className={i === active ? "on" : ""} onClick={() => goTo(i)} aria-label={h.name}>
            <span>{h.name}</span>
          </button>
        ))}
      </div>
      <p className="roster-hint">Scroll to switch · click the model for the dossier</p>
      <div className="roster-progress"><span /></div>
    </section>
  );
}
