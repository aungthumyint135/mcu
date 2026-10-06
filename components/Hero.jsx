"use client";

import { useRef } from "react";
import * as THREE from "three";
import { gsap, useGSAP } from "@/lib/gsap";
import { createStage } from "@/lib/stage3d";
import { BUILDERS } from "@/lib/props3d";

const LINES = [{ text: "Earth's" }, { text: "Mightiest" }, { text: "Heroes", outline: true }];

/** 3D shield + split letters. On scroll the letters explode and the shield flies through the camera. */
export default function Hero() {
  const root = useRef(null);
  const canvas = useRef(null);

  useGSAP(() => {
    /* ---------- 3D: shield + starfield ---------- */
    const stage = createStage(canvas.current, { z: 7 });
    const pivot = new THREE.Group(); // mouse parallax
    const flight = new THREE.Group(); // scroll-driven fly-through
    const shield = BUILDERS.shield();
    flight.add(shield.group);
    pivot.add(flight);
    stage.scene.add(pivot);

    const starPos = new Float32Array(900 * 3).map((_, i) =>
      i % 3 === 2 ? -Math.random() * 30 : (Math.random() - 0.5) * 30
    );
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(starPos, 3)),
      new THREE.PointsMaterial({ color: "#ffffff", size: 0.035, transparent: true, opacity: 0.7 })
    );
    stage.scene.add(stars);

    stage.onFrame((t, dt) => {
      shield.tick(t, dt);
      shield.group.scale.setScalar(1.3 * Math.min(1, stage.camera.aspect / 1.4)); // smaller on portrait screens
      shield.group.rotation.y = Math.sin(t * 0.6) * 0.45;
      shield.group.position.y = Math.sin(t * 1.2) * 0.06;
      stars.rotation.z = t * 0.01;
    });

    const io = new IntersectionObserver(([e]) => stage.setActive(e.isIntersecting));
    io.observe(root.current);

    /* ---------- intro ---------- */
    gsap.from(flight.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 1.1, ease: "expo.out", delay: 0.1 });
    gsap.from(flight.rotation, { z: -Math.PI * 2, duration: 1.2, ease: "expo.out", delay: 0.1 });
    // Intro animates the inner span; scroll animates the outer span — they never fight.
    gsap.from(".char-in", {
      yPercent: 110, rotationX: -90, opacity: 0, transformOrigin: "50% 100%",
      duration: 0.9, ease: "expo.out", stagger: 0.02, delay: 0.25,
    });
    gsap.from(".hero-sub, .scroll-hint", { opacity: 0, y: 20, duration: 0.7, delay: 0.6, stagger: 0.1 });
    gsap.to(".grid-floor", { backgroundPosition: "0px 80px", duration: 1.2, ease: "none", repeat: -1 });

    /* ---------- scroll ---------- */
    const chars = root.current.querySelectorAll(".char");
    gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "+=140%", scrub: 1, pin: true },
    })
      .to(chars, {
        z: () => gsap.utils.random(300, 1100),
        x: () => gsap.utils.random(-400, 400),
        y: () => gsap.utils.random(-300, 300),
        rotationX: () => gsap.utils.random(-180, 180),
        rotationY: () => gsap.utils.random(-180, 180),
        opacity: 0,
        stagger: { each: 0.015, from: "center" },
        ease: "power2.in",
      }, 0)
      .to(flight.position, { z: 6.6, ease: "power2.in" }, 0)
      .to(flight.rotation, { z: Math.PI * 3, ease: "power1.in" }, 0)
      .to(stars.position, { z: 12, ease: "power1.in" }, 0)
      .to(".hero-sub, .scroll-hint", { opacity: 0, y: -40, duration: 0.3 }, 0)
      .to(".grid-floor", { rotationX: 88, opacity: 0.3 }, 0)
      .to(".glow", { scale: 2.2, opacity: 0 }, 0);

    /* ---------- mouse parallax ---------- */
    const title = root.current.querySelector(".hero-title");
    const trx = gsap.quickTo(title, "rotationX", { duration: 0.8, ease: "power3" });
    const try_ = gsap.quickTo(title, "rotationY", { duration: 0.8, ease: "power3" });
    const prx = gsap.quickTo(pivot.rotation, "x", { duration: 1.2, ease: "power3" });
    const pry = gsap.quickTo(pivot.rotation, "y", { duration: 1.2, ease: "power3" });
    const onMove = (e) => {
      const x = e.clientX / innerWidth - 0.5;
      const y = e.clientY / innerHeight - 0.5;
      try_(x * 16);
      trx(-y * 12);
      pry(x * 0.6);
      prx(y * 0.4);
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
      stage.dispose();
    };
  }, { scope: root });

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-stage">
        <div className="glow" />
        <div className="grid-floor" />
        <div className="hero-canvas"><canvas ref={canvas} /></div>
        <h1 className="hero-title" aria-label="Earth's Mightiest Heroes">
          {LINES.map(({ text, outline }) => (
            <span key={text} className={`line${outline ? " outline" : ""}`} aria-hidden="true">
              {[...text].map((c, i) => (
                <span key={i} className="char"><span className="char-in">{c}</span></span>
              ))}
            </span>
          ))}
        </h1>
        <p className="hero-sub">An MCU fan experience · Three.js · GSAP</p>
      </div>
      <div className="scroll-hint"><span />Scroll</div>
    </section>
  );
}
