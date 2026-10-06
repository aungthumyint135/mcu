import "server-only";
import { HEROES } from "./heroes";

const MCU = "https://mcuapi.up.railway.app/api/v1";
const SUPERHERO = "https://akabab.github.io/superhero-api/api";
const DAY = 60 * 60 * 24;

/** Ask Cloudinary for a resized WebP/AVIF instead of the ~764x1132 original. */
const resizePoster = (url, width) =>
  url.includes("res.cloudinary.com") ? url.replace("/image/upload/", `/image/upload/w_${width},f_auto,q_auto/`) : url;

async function getJSON(url) {
  try {
    const res = await fetch(url, { next: { revalidate: DAY } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[api] ${url} failed: ${err.message}`);
    return null;
  }
}

/** Released MCU films with a poster, in release order. */
export async function getMovies() {
  const data = await getJSON(`${MCU}/movies?limit=100`);
  const today = new Date().toISOString().slice(0, 10);
  return (data?.data ?? [])
    .filter((m) => m.is_mcu && m.cover_url && m.release_date && m.release_date <= today)
    .sort((a, b) => a.release_date.localeCompare(b.release_date))
    .map((m) => ({
      id: m.id,
      title: m.title,
      year: m.release_date.slice(0, 4),
      releaseDate: m.release_date,
      overview: m.overview,
      poster: resizePoster(m.cover_url, 400), // tunnel + thumbnails (rendered <= 250px wide)
      posterLarge: resizePoster(m.cover_url, 700), // detail panel
      trailer: m.trailer_url,
      director: m.directed_by,
      phase: m.phase,
      saga: m.saga,
      duration: m.duration,
      boxOffice: Number(m.box_office) || null,
      postCredits: m.post_credit_scenes,
    }));
}

/** Featured heroes merged with MCU API (actor) + SuperHero API (stats, bio) data. */
export async function getHeroes(movies) {
  return Promise.all(
    HEROES.map(async (hero) => {
      const [mcu, sh] = await Promise.all([
        getJSON(`${MCU}/characters/${hero.mcuId}`),
        getJSON(`${SUPERHERO}/id/${hero.shId}.json`),
      ]);
      const titles = new Set(hero.movies.map((t) => t.toLowerCase()));
      const { movies: _titles, ...rest } = hero;
      return {
        ...rest,
        realName: mcu?.name ?? sh?.biography?.fullName ?? null,
        actor: mcu?.played_by ?? null,
        actorImage: mcu?.image_url ?? null,
        description: mcu?.description ?? null,
        image: sh?.images?.lg ?? null,
        powerstats: sh?.powerstats ?? null,
        firstAppearance: sh?.biography?.firstAppearance ?? null,
        height: sh?.appearance?.height?.[1] ?? null,
        occupation: sh?.work?.occupation ?? null,
        base: sh?.work?.base ?? null,
        movieIds: movies.filter((m) => titles.has(m.title.toLowerCase())).map((m) => m.id),
      };
    })
  );
}
