"use client";

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/*
 * Procedural hero props, all built from primitives (no downloaded assets).
 * Each builder returns { group, tick(t, dt) } and fits roughly inside a 2.4-unit box.
 */

const metal = (color, roughness = 0.25) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness });
const paint = (color, roughness = 0.3) =>
  new THREE.MeshPhysicalMaterial({ color, metalness: 0.25, roughness, clearcoat: 1, clearcoatRoughness: 0.12 });
const glow = (color, emissiveIntensity = 2.5) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.35 });
const lines = (color, opacity = 1) =>
  new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });

/** Flat medallion disc facing +z (front face at z = depth / 2). */
function disc(radius, depth, material) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 96), material);
  m.rotation.x = Math.PI / 2;
  return m;
}
function extrude(shape, depth, material) {
  return new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }),
    material
  );
}
function pointLight(color, intensity, distance, z) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.z = z;
  return l;
}
function circleLine(r, material, segments = 128) {
  const pts = Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
  });
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), material);
}

/* ---------- Captain America: vibranium shield ---------- */
function shield() {
  const group = new THREE.Group();
  [[1.0, "#b11f24"], [0.8, "#ececf0"], [0.6, "#b11f24"], [0.4, "#1d3f9e"]].forEach(([r, c], i) => {
    const ring = disc(r, 0.08, paint(c));
    ring.position.z = i * 0.035;
    group.add(ring);
  });
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? 0.15 : 0.37;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starMesh = extrude(star, 0.04, metal("#f4f4f6", 0.18));
  starMesh.position.z = 0.15;
  group.add(starMesh, new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 16, 128), metal("#c9c9cf")));
  return { group, tick() {} };
}

/* ---------- Thor: Mjolnir ---------- */
function mjolnir() {
  const group = new THREE.Group();
  const steel = metal("#a3a9b2", 0.32);
  const head = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.82, 0.82, 4, 0.08), steel);
  head.position.y = 0.85;
  const faceRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.03, 12, 48), metal("#7d838c", 0.4));
  faceRing.position.set(0, 0.85, 0.42);
  const leather = new THREE.MeshStandardMaterial({ color: "#4a2c1a", roughness: 0.85 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.5, 24), leather);
  handle.position.y = -0.3;
  group.add(head, faceRing, handle);
  for (let i = 0; i < 7; i++) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.022, 8, 32), leather);
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = -0.95 + i * 0.19;
    group.add(wrap);
  }
  const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.14, 24), steel);
  pommel.position.y = -1.1;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 10, 40), leather);
  loop.position.y = -1.37;
  group.add(pommel, loop);

  // crackling lightning arcs around the head
  const boltMat = lines("#8fd3ff", 0.9);
  const bolts = Array.from({ length: 3 }, () => {
    const l = new THREE.Line(new THREE.BufferGeometry(), boltMat);
    group.add(l);
    return l;
  });
  const reroll = () => bolts.forEach((b) => {
    const a = Math.random() * Math.PI * 2;
    const pts = Array.from({ length: 7 }, (_, i) => new THREE.Vector3(
      Math.cos(a + i * 0.25) * (0.75 + Math.random() * 0.25),
      0.85 + (Math.random() - 0.5) * 0.8,
      Math.sin(a + i * 0.25) * (0.6 + Math.random() * 0.25)
    ));
    b.geometry.setFromPoints(pts);
  });
  group.rotation.z = -0.3;
  group.position.y = 0.15;
  let next = 0;
  return {
    group,
    tick(t) {
      if (t > next) { reroll(); next = t + 0.08 + Math.random() * 0.12; }
      boltMat.opacity = 0.4 + Math.random() * 0.6;
    },
  };
}

/* ---------- Iron Man: arc reactor ---------- */
function arcReactor() {
  const group = new THREE.Group();
  group.add(disc(0.98, 0.14, metal("#3a3d44", 0.45)));
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.11, 24, 96), paint("#b3151c"));
  const gold = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.05, 16, 96), metal("#d4a537", 0.2));
  gold.position.z = 0.08;
  group.add(outer, gold);
  const coils = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const coil = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.13, 0.12, 2, 0.03), metal("#b87333", 0.3));
    coil.position.set(Math.cos(a) * 0.64, Math.sin(a) * 0.64, 0.1);
    coil.rotation.z = a;
    coils.add(coil);
  }
  const innerMat = glow("#7fd8ff", 2);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.05, 16, 64), innerMat);
  inner.position.z = 0.12;
  const coreMat = glow("#c8f6ff", 4);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 24), coreMat);
  core.scale.z = 0.45;
  core.position.z = 0.12;
  const light = new THREE.PointLight("#7fd8ff", 6, 4);
  light.position.z = 0.8;
  group.add(coils, inner, core, light);
  return {
    group,
    tick(t) {
      const p = 0.5 + 0.5 * Math.sin(t * 3);
      coreMat.emissiveIntensity = 3 + p * 2.5;
      innerMat.emissiveIntensity = 1.5 + p * 1.5;
      coils.rotation.z = t * 0.4;
    },
  };
}

/* ---------- Hulk: gamma core + smashed fragments ---------- */
function gamma() {
  const group = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({ color: "#3f9d2f", roughness: 0.55, metalness: 0.1, flatShading: true });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), rock);
  const cracks = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.87, 1)), lines("#b6ff7a"));
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 16), glow("#7dff4d", 1.5));
  group.add(heart, core, cracks);
  const shards = Array.from({ length: 16 }, (_, i) => {
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.12, 0), rock);
    s.userData = { r: 1.25 + Math.random() * 0.6, a: (i / 16) * Math.PI * 2, y: (Math.random() - 0.5) * 1.6, spd: 0.3 + Math.random() * 0.6 };
    group.add(s);
    return s;
  });
  return {
    group,
    tick(t, dt) {
      core.rotation.y += dt * 0.2;
      cracks.rotation.y = core.rotation.y;
      shards.forEach((s) => {
        const u = s.userData;
        u.a += dt * u.spd * 0.5;
        s.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(t + u.a) * 0.1, Math.sin(u.a) * u.r);
        s.rotation.x += dt * u.spd;
        s.rotation.y += dt * u.spd;
      });
    },
  };
}

/* ---------- Black Widow: hourglass emblem + widow's bites ---------- */
function hourglass() {
  const group = new THREE.Group();
  group.add(disc(1.0, 0.12, paint("#141417", 0.25)));
  group.add(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 16, 128), metal("#2e2e34")));
  const red = paint("#d0121b", 0.22);
  red.emissive = new THREE.Color("#5a0005");
  const tri = (sign) => {
    const s = new THREE.Shape();
    s.moveTo(-0.48, 0.62 * sign);
    s.lineTo(0.48, 0.62 * sign);
    s.lineTo(0, 0.05 * sign);
    s.closePath();
    const m = extrude(s, 0.06, red);
    m.position.z = 0.06;
    return m;
  };
  group.add(tri(1), tri(-1));
  const bites = new THREE.Group();
  [0, Math.PI].forEach((a) => {
    const bite = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 12, 36), glow("#4fc3ff", 2));
    bite.position.set(Math.cos(a) * 1.35, 0, Math.sin(a) * 1.35);
    bites.add(bite);
  });
  group.add(bites);
  return { group, tick(t) { bites.rotation.y = t * 0.8; bites.children.forEach((b) => (b.rotation.x = t)); } };
}

/* ---------- Spider-Man: web medallion + spider emblem ---------- */
function spider() {
  const group = new THREE.Group();
  group.add(disc(1.0, 0.12, paint("#c4151c", 0.28)));
  group.add(new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.045, 16, 128), paint("#1d3f9e")));
  const web = new THREE.Group();
  const webMat = lines("#1a0a0a", 0.75);
  [0.3, 0.52, 0.74, 0.94].forEach((r) => web.add(circleLine(r, webMat, 16)));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    web.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 0.96, Math.sin(a) * 0.96, 0),
    ]), webMat));
  }
  web.position.z = 0.065;
  const black = paint("#0b0b0d", 0.2);
  const body = new THREE.Group();
  [[0, -0.08, 0.15, 0.26], [0, 0.15, 0.1, 0.12], [0, 0.29, 0.065, 0.065]].forEach(([x, y, sx, sy]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), black);
    m.scale.set(sx, sy, 0.06);
    m.position.set(x, y, 0);
    body.add(m);
  });
  const knees = [[0.26, 0.42], [0.32, 0.25], [0.32, 0.0], [0.26, -0.2]];
  const feet = [[0.34, 0.66], [0.52, 0.38], [0.5, -0.24], [0.36, -0.55]];
  [-1, 1].forEach((s) => knees.forEach(([kx, ky], i) => {
    const y0 = 0.2 - i * 0.05;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.05, y0, 0), new THREE.Vector3(s * kx, ky, 0.04), new THREE.Vector3(s * feet[i][0], feet[i][1], 0),
    ]);
    body.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.02, 8), black));
  }));
  body.position.z = 0.1;
  group.add(web, body);
  return { group, tick() {} };
}

/* ---------- Black Panther: vibranium crystal + claw necklace ---------- */
function vibranium() {
  const group = new THREE.Group();
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: "#6b3fd1", emissive: "#3b1590", emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.08,
    clearcoat: 1, flatShading: true,
  });
  const crystal = new THREE.Group();
  const main = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), crystalMat);
  main.scale.y = 1.6;
  crystal.add(main, new THREE.LineSegments(new THREE.EdgesGeometry(main.geometry), lines("#d4bcff")));
  crystal.children[1].scale.y = 1.6;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), crystalMat);
    c.scale.y = 1.8;
    c.position.set(Math.cos(a) * 0.55, -0.55, Math.sin(a) * 0.55);
    c.rotation.z = Math.cos(a) * 0.5;
    c.rotation.x = Math.sin(a) * 0.5;
    crystal.add(c);
  }
  const necklace = new THREE.Group();
  const silver = metal("#d9dce2", 0.18);
  const chain = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.03, 10, 128), silver);
  chain.rotation.x = Math.PI / 2;
  necklace.add(chain);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 12), silver);
    tooth.position.set(Math.cos(a) * 1.25, -0.16, Math.sin(a) * 1.25);
    tooth.rotation.x = Math.PI;
    necklace.add(tooth);
  }
  necklace.rotation.x = 0.35;
  group.add(crystal, necklace, pointLight("#9b6bff", 5, 4, 1.2));
  return { group, tick(t) { crystal.rotation.y = t * 0.5; necklace.rotation.y = -t * 0.25; } };
}

/* ---------- Doctor Strange: Eye of Agamotto + mystic mandala ---------- */
function eye() {
  const group = new THREE.Group();
  const gold = metal("#c9a227", 0.22);
  group.add(disc(0.55, 0.14, gold), new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 16, 96), gold));
  const eyeMat = glow("#3dff8a", 2.5);
  const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), eyeMat);
  eyeball.scale.set(1.15, 0.6, 0.45);
  eyeball.position.z = 0.08;
  const lidTop = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 12, 48, Math.PI), gold);
  lidTop.position.set(0, -0.12, 0.09);
  const lidBottom = lidTop.clone();
  lidBottom.rotation.z = Math.PI;
  lidBottom.position.y = 0.12;
  group.add(eyeball, lidTop, lidBottom);

  const mandala = new THREE.Group();
  const orange = new THREE.LineBasicMaterial({ color: "#ff9d2e", transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
  [1.05, 1.32, 1.52].forEach((r) => mandala.add(circleLine(r, orange)));
  const inner = new THREE.Group();
  [0, Math.PI / 4].forEach((rot) => {
    const sq = circleLine(1.32, orange, 4);
    sq.rotation.z = rot;
    inner.add(sq);
  });
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const len = i % 4 ? 0.06 : 0.14;
    mandala.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a) * 1.32, Math.sin(a) * 1.32, 0),
      new THREE.Vector3(Math.cos(a) * (1.32 + len), Math.sin(a) * (1.32 + len), 0),
    ]), orange));
  }
  mandala.add(inner);
  mandala.position.z = -0.1;
  group.add(mandala, pointLight("#3dff8a", 4, 3, 0.8));
  return {
    group,
    tick(t) {
      mandala.rotation.z = t * 0.35;
      inner.rotation.z = -t * 0.9;
      orange.opacity = 0.65 + Math.sin(t * 4) * 0.25;
      eyeMat.emissiveIntensity = 2 + Math.sin(t * 2) * 1;
    },
  };
}

/* ---------- Thanos: the six Infinity Stones orbiting a gold ring ---------- */
function stones() {
  const group = new THREE.Group();
  const gold = metal("#d4a537", 0.2);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.12, 160, 20, 2, 3), gold);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 16, 128), gold);
  ring.rotation.x = Math.PI / 2;
  group.add(knot, ring);
  const colors = ["#2f6bff", "#ffd23b", "#e0252b", "#a03bff", "#2bdc6a", "#ff8a1f"];
  const gems = colors.map((c, i) => {
    const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), glow(c, 0.7));
    gem.scale.set(1, 1.3, 0.85);
    gem.userData.a = (i / 6) * Math.PI * 2;
    group.add(gem);
    return gem;
  });
  group.rotation.x = 0.35;
  return {
    group,
    tick(t) {
      knot.rotation.y = t * 0.4;
      knot.rotation.x = t * 0.2;
      gems.forEach((g) => {
        const a = g.userData.a + t * 0.5;
        g.position.set(Math.cos(a) * 1.15, Math.sin(t * 2 + g.userData.a) * 0.08, Math.sin(a) * 1.15);
        g.rotation.y = t;
      });
    },
  };
}

export const BUILDERS = { shield, mjolnir, arcReactor, gamma, hourglass, spider, vibranium, eye, stones };

/** Scale + center an arbitrary object so its largest side equals `size`. */
function fit(object, size = 2.4) {
  const box = new THREE.Box3().setFromObject(object);
  const dims = box.getSize(new THREE.Vector3());
  const scale = size / Math.max(dims.x, dims.y, dims.z);
  const center = box.getCenter(new THREE.Vector3());
  object.scale.setScalar(scale);
  object.position.copy(center.multiplyScalar(-scale));
}

/**
 * Hero prop: the hero's .glb model when `hero.model` is set (and loads), otherwise the procedural prop.
 * GLB animations (if any) play automatically.
 */
export async function buildProp(hero) {
  if (hero.model) {
    try {
      const gltf = await new GLTFLoader().loadAsync(hero.model);
      const group = new THREE.Group();
      fit(gltf.scene);
      group.add(gltf.scene);
      const mixer = gltf.animations.length ? new THREE.AnimationMixer(gltf.scene) : null;
      mixer?.clipAction(gltf.animations[0]).play();
      return { group, tick: (_, dt) => mixer?.update(dt) };
    } catch (err) {
      console.warn(`[props3d] could not load ${hero.model}, using procedural prop`, err);
    }
  }
  return BUILDERS[hero.prop]();
}
