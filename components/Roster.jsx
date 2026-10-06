"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
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
      pivot.scale.setScalar(gsap.utils.clamp(0.78, 1, canvas.current.clientHeight / 640)); // keep tall props inside short canvases
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

    // Swap timing (seconds). Out and in overlap so there's never an empty stage.
    const OUT = 0.6;
    const IN_AT = 0.32;
    const IN = 1.15;

    let current = 0;
    let swap = null;
    const isShown = (el) => getComputedStyle(el).visibility !== "hidden";

    // One interruptible timeline per swap. Every tween animates *from the current state*,
    // so scrolling quickly or reversing mid-swap blends instead of snapping back to a start pose.
    const show = contextSafe((next) => {
      if (next === current) return;
      const dir = next > current ? 1 : -1;
      current = next;
      setActive(next);
      const hero = heroes[next];
      swap?.kill();
      swap = gsap.timeline();

      /* 3D: everything else drifts away, the new prop swings in from the other side */
      holders.forEach((h, i) => {
        if (i === next || !h.visible) return;
        swap.to(h.scale, { x: 0.001, y: 0.001, z: 0.001, duration: OUT, ease: "power2.in", onComplete: () => (h.visible = false) }, 0)
          .to(h.rotation, { y: dir * Math.PI * 0.6, duration: OUT, ease: "power2.in" }, 0)
          .to(h.position, { x: -dir * 1.4, duration: OUT, ease: "power2.in" }, 0);
      });
      const inn = holders[next];
      if (!inn.visible || inn.scale.x < 0.05) { // fresh entrance; otherwise resume from where it is
        inn.scale.setScalar(0.001);
        inn.rotation.y = -dir * Math.PI * 0.8;
        inn.position.x = dir * 1.4;
      }
      inn.visible = true;
      swap.to(inn.scale, { x: 1, y: 1, z: 1, duration: IN, ease: "power3.out" }, IN_AT)
        .to(inn.rotation, { y: 0, duration: IN + 0.25, ease: "power3.out" }, IN_AT)
        .to(inn.position, { x: 0, duration: IN, ease: "power3.out" }, IN_AT);

      /* theme colours + rim light blend across the whole swap */
      rimColor.set(hero.accent);
      swap.to(root.current, { "--c": hero.color, "--a": hero.accent, duration: OUT + IN * 0.6, ease: "sine.inOut" }, 0)
        .to(stage.rim.color, { r: rimColor.r, g: rimColor.g, b: rimColor.b, duration: OUT + IN * 0.6, ease: "sine.inOut" }, 0);

      /* copy: other blocks fade up and out, the new block's lines rise in one after another */
      cards.forEach((c, i) => {
        if (i !== next && isShown(c)) swap.to(c, { autoAlpha: 0, y: -24 * dir, duration: OUT * 0.75, ease: "power2.in" }, 0);
      });
      const card = cards[next];
      const name = card.querySelector(".hero-name span");
      const lines = card.querySelectorAll(".hero-anim");
      const bars = card.querySelectorAll(".mini-fill");
      if (!isShown(card)) {
        gsap.set(card, { autoAlpha: 0, y: 24 * dir });
        gsap.set(name, { yPercent: 105 * dir, rotationX: -50 * dir });
        gsap.set(lines, { y: 22 * dir, opacity: 0 });
        gsap.set(bars, { scaleX: 0 });
      }
      swap.to(card, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, IN_AT)
        .to(name, { yPercent: 0, rotationX: 0, duration: IN, ease: "power3.out" }, IN_AT)
        .to(lines, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", stagger: 0.07 }, IN_AT + 0.12)
        .to(bars, { scaleX: (_, el) => el.dataset.v / 100, duration: IN, ease: "power3.out", stagger: 0.08 }, IN_AT + 0.25);
    });

    gsap.set(".mini-fill", { scaleX: (_, el) => el.dataset.v / 100 });
    gsap.set(root.current, { "--c": heroes[0].color, "--a": heroes[0].accent });

    trigger.current = gsap.timeline({
      scrollTrigger: {
        trigger: root.current, start: "top top", end: `+=${N * 70}%`, scrub: true, pin: true,
        onUpdate: (self) => show(Math.min(N - 1, Math.floor(self.progress * N))),
      },
    }).to(".roster-progress span", { scaleX: 1, ease: "none" }).scrollTrigger;

    // When scrolling stops inside the section, glide to the centre of the current hero's segment
    // so the page never rests halfway between two heroes.
    const settle = () => {
      const st = trigger.current;
      const lenis = getLenis();
      if (!st?.isActive || !lenis || lenis.isStopped) return;
      const seg = (st.end - st.start) / N;
      const target = st.start + (current + 0.5) * seg;
      if (Math.abs(window.scrollY - target) > seg * 0.08) lenis.scrollTo(target, { duration: 0.9, easing: (t) => 1 - Math.pow(1 - t, 3) });
    };
    ScrollTrigger.addEventListener("scrollEnd", settle);

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
      ScrollTrigger.removeEventListener("scrollEnd", settle);
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
