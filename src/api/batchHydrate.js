import { fetchTitlesBatch, seedPreloadedCache } from "@/api/tmdb";
import { useMovieStore } from "@/stores/movieStore";
import { useTVStore } from "@/stores/tvStore";

export async function hydrateTitlesBatch(items, contentType) {
  if (!items?.length) return;
  const ids = items.map((i) => i.id).filter(Boolean);
  if (!ids.length) return;
  try {
    const titles = await fetchTitlesBatch(ids);
    const movieStore = useMovieStore();
    const tvStore = useTVStore();
    for (const t of titles) {
      seedPreloadedCache(t.id, t);
      if (contentType === "tv") {
        tvStore.seedDetails(t.id, t);
      } else {
        movieStore.seedDetails(t.id, t);
      }
    }
  } catch (err) {
    console.error("hydrateTitlesBatch error:", err);
  }
}
