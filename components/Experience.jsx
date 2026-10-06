"use client";

import { useEffect, useState } from "react";
import SmoothScroll from "./SmoothScroll";
import Nav from "./Nav";
import Hero from "./Hero";
import Tunnel from "./Tunnel";
import Marquee from "./Marquee";
import Roster from "./Roster";
import Footer from "./Footer";
import DetailPanel from "./DetailPanel";

/**
 * Client root. Holds the current selection ({ type: "movie", id } | { type: "hero", key })
 * that drives the detail panel. Section order matters: pinned ScrollTriggers are created top-to-bottom.
 */
export default function Experience({ movies, heroes }) {
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelection(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <Tunnel movies={movies} onSelect={setSelection} />
        <Marquee heroes={heroes} />
        <Roster heroes={heroes} onSelect={setSelection} />
        <Footer />
      </main>
      <DetailPanel
        selection={selection}
        movies={movies}
        heroes={heroes}
        onSelect={setSelection}
        onClose={() => setSelection(null)}
      />
    </>
  );
}
