"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";

const STATS = ["intelligence", "strength", "speed", "durability", "power", "combat"];
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });
const longDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });
const runtime = (min) => (min ? `${Math.floor(min / 60)}h ${min % 60}m` : null);

function Facts({ items }) {
  const rows = items.filter(([, v]) => v);
  return (
    <dl className="dp-facts dp-anim">
      {rows.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

function MovieView({ movie, heroes, onSelect }) {
  const cast = heroes.filter((h) => h.movieIds.includes(movie.id));
  return (
    <>
      <div className="dp-poster dp-anim"><img src={movie.poster} alt={movie.title} /></div>
      <p className="eyebrow dp-anim">Phase {movie.phase} · {movie.saga}</p>
      <h2 className="dp-title dp-anim">{movie.title}</h2>
      <Facts items={[
        ["Released", longDate.format(new Date(movie.releaseDate))],
        ["Directed by", movie.director],
        ["Runtime", runtime(movie.duration)],
        ["Box office", movie.boxOffice && money.format(movie.boxOffice)],
        ["Post-credit scenes", movie.postCredits != null && String(movie.postCredits)],
      ]} />
      {movie.overview && <p className="dp-text dp-anim">{movie.overview}</p>}
      {movie.trailer && (
        <a className="btn dp-anim" href={movie.trailer} target="_blank" rel="noreferrer">Watch trailer <span>↗</span></a>
      )}
      {cast.length > 0 && (
        <>
          <h4 className="dp-sub dp-anim">Featured heroes</h4>
          <div className="dp-chips dp-anim">
            {cast.map((h) => (
              <button key={h.key} className="chip" style={{ "--c": h.color }} onClick={() => onSelect({ type: "hero", key: h.key })}>
                {h.image && <img src={h.image} alt="" />} {h.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function HeroView({ hero, movies, onSelect }) {
  const films = movies.filter((m) => hero.movieIds.includes(m.id));
  return (
    <>
      <div className="dp-hero-head dp-anim" style={{ "--c": hero.color, "--a": hero.accent }}>
        {hero.image && <img className="dp-hero-img" src={hero.image} alt={hero.name} />}
        <div>
          <p className="eyebrow">Dossier</p>
          <h2 className="dp-title">{hero.name}</h2>
          {hero.realName && <p className="dp-real">{hero.realName}</p>}
        </div>
      </div>
      {hero.actor && (
        <div className="dp-actor dp-anim">
          {hero.actorImage && <img src={hero.actorImage} alt={hero.actor} />}
          <div><span>Played by</span><b>{hero.actor}</b></div>
        </div>
      )}
      {hero.description && <p className="dp-text dp-anim">{hero.description}</p>}
      {hero.powerstats && (
        <div className="dp-stats dp-anim" style={{ "--a": hero.accent }}>
          {STATS.map((s) => (
            <div className="stat" key={s}>
              <span className="stat-label">{s}</span>
              <div className="stat-bar"><div className="stat-fill" data-v={hero.powerstats[s] ?? 0} /></div>
              <span className="stat-num">{hero.powerstats[s] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
      <Facts items={[
        ["First appearance", hero.firstAppearance],
        ["Height", hero.height],
        ["Occupation", hero.occupation],
        ["Base", hero.base],
      ]} />
      {films.length > 0 && (
        <>
          <h4 className="dp-sub dp-anim">Films · {films.length}</h4>
          <div className="dp-films dp-anim">
            {films.map((m) => (
              <button key={m.id} className="film" onClick={() => onSelect({ type: "movie", id: m.id })}>
                <img src={m.poster} alt={m.title} />
                <span>{m.year}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/**
 * Slide-in detail panel. GSAP handles open (overlay + panel + staggered content + stat bars),
 * content swaps when jumping hero <-> movie, and close. `current` lags `selection`
 * so the outgoing content stays mounted while it animates out.
 */
export default function DetailPanel({ selection, movies, heroes, onSelect, onClose }) {
  const root = useRef(null);
  const body = useRef(null);
  const isOpen = useRef(false);
  const [current, setCurrent] = useState(null);

  const { contextSafe } = useGSAP(() => {
    gsap.set(root.current, { autoAlpha: 0 });
    gsap.set(".dp-panel", { xPercent: 100 });
  }, { scope: root });

  const animateIn = contextSafe(() => {
    body.current.scrollTop = 0;
    const tl = gsap.timeline();
    if (!isOpen.current) {
      isOpen.current = true;
      getLenis()?.stop();
      tl.set(root.current, { autoAlpha: 1 })
        .fromTo(".dp-overlay", { opacity: 0 }, { opacity: 1, duration: 0.5 })
        .fromTo(".dp-panel", { xPercent: 100 }, { xPercent: 0, duration: 0.9, ease: "expo.out" }, 0);
    }
    tl.fromTo(".dp-anim", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.05 }, tl.duration() ? 0.25 : 0)
      .fromTo(".stat-fill", { scaleX: 0 }, { scaleX: (_, el) => el.dataset.v / 100, duration: 1.2, ease: "expo.out", stagger: 0.07 }, "<0.3")
      .from(".stat-num", { textContent: 0, snap: { textContent: 1 }, duration: 1.2, ease: "expo.out", stagger: 0.07 }, "<");
  });

  const swapOut = contextSafe((next) => {
    gsap.to(".dp-anim", {
      y: -20, opacity: 0, duration: 0.25, ease: "power2.in", stagger: 0.015,
      onComplete: () => setCurrent(next),
    });
  });

  const animateOut = contextSafe(() => {
    gsap.timeline({
      onComplete: () => {
        isOpen.current = false;
        gsap.set(root.current, { autoAlpha: 0 });
        setCurrent(null);
        getLenis()?.start();
      },
    })
      .to(".dp-anim", { y: -20, opacity: 0, duration: 0.25, stagger: 0.01 })
      .to(".dp-panel", { xPercent: 100, duration: 0.6, ease: "expo.in" }, 0.05)
      .to(".dp-overlay", { opacity: 0, duration: 0.4 }, 0.3);
  });

  // selection changed from outside -> open, swap or close
  useEffect(() => {
    if (selection && !current) setCurrent(selection);
    else if (selection && selection !== current) swapOut(selection);
    else if (!selection && current) animateOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  // new content rendered -> animate it in
  useEffect(() => {
    if (current) animateIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const movie = current?.type === "movie" && movies.find((m) => m.id === current.id);
  const hero = current?.type === "hero" && heroes.find((h) => h.key === current.key);

  return (
    <div className="dp" ref={root} aria-hidden={!current} role="dialog" aria-modal="true">
      <div className="dp-overlay" onClick={onClose} />
      <aside className="dp-panel">
        <button className="dp-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="dp-body" ref={body} data-lenis-prevent>
          {movie && <MovieView movie={movie} heroes={heroes} onSelect={onSelect} />}
          {hero && <HeroView hero={hero} movies={movies} onSelect={onSelect} />}
        </div>
      </aside>
    </div>
  );
}
