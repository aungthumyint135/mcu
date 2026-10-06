# Multiverse — MCU fan experience

Next.js 16 (App Router) + Three.js + GSAP (ScrollTrigger, Observer) + Lenis.

```bash
npm install
npm run dev
```

## Sections
1. **Hero** — procedural 3D shield + split letters; on scroll the letters explode and the shield flies through the camera.
2. **Film tunnel** — pinned; the camera flies through every released MCU film poster. Click a poster for details.
3. **Marquee** — infinite loops that speed up / skew with scroll velocity.
4. **Hero roster** — pinned 3D showcase; scroll (or the side dots) swaps heroes with GSAP transitions. Click the model or "Open dossier".
5. **Detail panel** — GSAP slide-in with stat bars; heroes and films cross-link.

## Data
Fetched server-side in `lib/api.js` and cached for 24h:
- [MCU API](https://mcuapi.up.railway.app) — films (poster, director, box office, phase) and characters (actor, description).
- [SuperHero API](https://akabab.github.io/superhero-api/) — power stats, biography, comic portrait.

The official Marvel developer API was returning HTTP 500 at build time (2026-10-06), so it isn't used.
Featured heroes, their API ids and film lists are configured in `lib/heroes.js`.

## 3D models
Every hero has a procedural prop built from Three.js primitives in `lib/props3d.js` (shield, Mjolnir, arc reactor, …),
so the site works with no downloaded assets.

To use a real model instead, put a `.glb` in `public/models/` and set `model` on that hero in `lib/heroes.js`:

```js
{ key: "ironman", ..., model: "/models/iron-man.glb" }
```

It's auto-centred and scaled, and its first animation clip plays. If loading fails it falls back to the procedural prop.
Check the licence of any fan-made model you use — most Marvel character models on Sketchfab etc. are for personal / non-commercial use only.

## Notes
- Pinned sections must stay in top-to-bottom order in `components/Experience.jsx`.
- Don't centre GSAP-animated elements with CSS `transform` — GSAP owns that property.
- Unofficial fan project, not affiliated with Marvel or Disney.
