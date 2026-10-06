"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/lenis";

/** Lenis smooth scrolling driven by GSAP's ticker so ScrollTrigger stays in sync. */
export default function SmoothScroll() {
  useEffect(() => {
    // pinned sections + restored scroll positions don't mix well: always start at the top
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ lerp: 0.09, anchors: { duration: 1.6 } });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);
  return null;
}
