/**
 * Featured heroes.
 * - mcuId: character id in the MCU API (actor, description, portrait)
 * - shId:  character id in the SuperHero API (power stats, biography)
 * - prop:  procedural 3D model built in lib/props3d.js
 * - model: optional path to a .glb in /public/models — when set it replaces the procedural prop
 * - movies: exact MCU API titles the hero appears in (used to link heroes <-> films)
 */
export const HEROES = [
  {
    key: "ironman", name: "Iron Man", mcuId: 1, shId: 346, prop: "arcReactor", model: null,
    color: "#b3151c", accent: "#ffc94a",
    movies: ["Iron Man", "Iron Man 2", "The Avengers", "Iron Man 3", "Avengers: Age of Ultron",
      "Captain America: Civil War", "Spider-Man: Homecoming", "Avengers: Infinity War", "Avengers: Endgame"],
  },
  {
    key: "cap", name: "Captain America", mcuId: 2, shId: 149, prop: "shield", model: null,
    color: "#1d3f9e", accent: "#e23636",
    movies: ["Captain America: The First Avenger", "The Avengers", "Captain America: The Winter Soldier",
      "Avengers: Age of Ultron", "Captain America: Civil War", "Avengers: Infinity War", "Avengers: Endgame"],
  },
  {
    key: "thor", name: "Thor", mcuId: 3, shId: 659, prop: "mjolnir", model: null,
    color: "#2b4c7e", accent: "#8fd3ff",
    movies: ["Thor", "The Avengers", "Thor: The Dark World", "Avengers: Age of Ultron", "Thor: Ragnarok",
      "Avengers: Infinity War", "Avengers: Endgame", "Thor: Love and Thunder"],
  },
  {
    key: "hulk", name: "Hulk", mcuId: 4, shId: 332, prop: "gamma", model: null,
    color: "#2f6b22", accent: "#9dff6b",
    movies: ["The Incredible Hulk", "The Avengers", "Avengers: Age of Ultron", "Thor: Ragnarok",
      "Avengers: Infinity War", "Avengers: Endgame"],
  },
  {
    key: "widow", name: "Black Widow", mcuId: 5, shId: 107, prop: "hourglass", model: null,
    color: "#5a0d12", accent: "#ff3b3b",
    movies: ["Iron Man 2", "The Avengers", "Captain America: The Winter Soldier", "Avengers: Age of Ultron",
      "Captain America: Civil War", "Avengers: Infinity War", "Avengers: Endgame", "Black Widow"],
  },
  {
    key: "spidey", name: "Spider-Man", mcuId: 13, shId: 620, prop: "spider", model: null,
    color: "#a3121a", accent: "#3d7bff",
    movies: ["Captain America: Civil War", "Spider-Man: Homecoming", "Avengers: Infinity War",
      "Avengers: Endgame", "Spider-Man: Far From Home", "Spider-Man: No Way Home"],
  },
  {
    key: "panther", name: "Black Panther", mcuId: 45, shId: 106, prop: "vibranium", model: null,
    color: "#2a1458", accent: "#b38bff",
    movies: ["Captain America: Civil War", "Black Panther", "Avengers: Infinity War", "Avengers: Endgame"],
  },
  {
    key: "strange", name: "Doctor Strange", mcuId: 31, shId: 226, prop: "eye", model: null,
    color: "#7a2a10", accent: "#ff9d2e",
    movies: ["Doctor Strange", "Thor: Ragnarok", "Avengers: Infinity War", "Avengers: Endgame",
      "Spider-Man: No Way Home", "Doctor Strange in the Multiverse of Madness"],
  },
  {
    key: "thanos", name: "Thanos", mcuId: 104, shId: 655, prop: "stones", model: null,
    color: "#3d1f5c", accent: "#ffcf4a",
    movies: ["The Avengers", "Guardians of the Galaxy", "Avengers: Age of Ultron",
      "Avengers: Infinity War", "Avengers: Endgame"],
  },
];
