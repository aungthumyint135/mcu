import Experience from "@/components/Experience";
import { getHeroes, getMovies } from "@/lib/api";

export const revalidate = 86400; // API data refreshes daily

export default async function Page() {
  const movies = await getMovies();
  const heroes = await getHeroes(movies);
  return <Experience movies={movies} heroes={heroes} />;
}
