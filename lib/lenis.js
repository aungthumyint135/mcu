"use client";

// Shared Lenis instance so sections can scrollTo() and the detail panel can stop()/start() scrolling.
let instance = null;
export const setLenis = (l) => (instance = l);
export const getLenis = () => instance;
