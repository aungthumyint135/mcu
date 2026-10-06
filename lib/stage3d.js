"use client";

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "./gsap";

/**
 * A transparent WebGL canvas with studio lighting + reflections.
 * Rendering is driven by GSAP's ticker and can be paused while the section is off screen.
 */
export function createStage(canvas, { fov = 35, z = 6 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, z);

  const key = new THREE.DirectionalLight("#ffffff", 2.2);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight("#ff4d4d", 2.5);
  rim.position.set(-4, 1, -3);
  scene.add(key, rim, new THREE.AmbientLight("#ffffff", 0.25));

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas.parentElement;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  resize();

  const callbacks = new Set();
  let active = true;
  let last = performance.now();
  const tick = () => {
    if (!active) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const t = now / 1000;
    callbacks.forEach((cb) => cb(t, dt));
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);

  return {
    THREE, scene, camera, renderer, rim,
    onFrame: (cb) => callbacks.add(cb),
    setActive(v) { active = v; last = performance.now(); },
    dispose() {
      gsap.ticker.remove(tick);
      ro.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose();
        [].concat(o.material ?? []).forEach((m) => m.dispose());
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
