import { ref, watch, onMounted } from "vue";
import {
  fetchMovieDetails,
  fetchTVShowDetails,
  fetchMovieCast,
  fetchTVShowCast,
  fetchSimilarMovies,
  fetchSimilarTVShows,
  fetchMovieRatings,
  fetchTVShowRatings,
  fetchMovieTrailers,
  fetchTVShowTrailers,
} from "@/api/tmdb";
import { hydrateTitlesBatch } from "@/api/batchHydrate";

export function useContentModalData(props) {
  const isLoading = ref(true);
  const details = ref(null);
  const cast = ref([]);
  const trailerKey = ref(null);
  const logoPath = ref(null);
  const similarContent = ref([]);
  const contentRating = ref(null);
  const similarLogos = ref({});

  const loadContent = async () => {
    if (!props.id) return;
    isLoading.value = true;
    try {
      const fetchDetailsFn =
        props.contentType === "movie" ? fetchMovieDetails : fetchTVShowDetails;
      const fetchCreditsFn =
        props.contentType === "movie" ? fetchMovieCast : fetchTVShowCast;
      const fetchSimilarFn =
        props.contentType === "movie"
          ? fetchSimilarMovies
          : fetchSimilarTVShows;
      const fetchTrailersFn =
        props.contentType === "movie"
          ? fetchMovieTrailers
          : fetchTVShowTrailers;
      const fetchRatingsFn =
        props.contentType === "movie" ? fetchMovieRatings : fetchTVShowRatings;

      const [
        detailsRes,
        creditsRes,
        similarRes,
        trailersRes,
        ratingRes,
      ] = await Promise.all([
        fetchDetailsFn(props.id),
        fetchCreditsFn(props.id),
        fetchSimilarFn(props.id),
        fetchTrailersFn(props.id),
        fetchRatingsFn(props.id),
      ]);

      details.value = detailsRes;
      cast.value = Array.isArray(creditsRes) ? creditsRes : [];
      similarContent.value = similarRes?.slice(0, 12) || [];
      hydrateTitlesBatch(similarContent.value, props.contentType);
      logoPath.value = null;
      contentRating.value = ratingRes;

      if (trailersRes && trailersRes.length > 0) {
        const officialTrailer = trailersRes.find(
          (t) => t.type === "Trailer" && t.official
        );
        trailerKey.value = officialTrailer?.key || trailersRes[0].key;
      }
    } catch (error) {
      console.error(
        `Error loading content modal data for ${props.contentType} ID ${props.id}:`,
        error
      );
    } finally {
      isLoading.value = false;
    }
  };
  onMounted(loadContent);
  watch(() => [props.id, props.contentType], loadContent, { immediate: true });

  return {
    isLoading,
    details,
    cast,
    trailerKey,
    logoPath,
    similarContent,
    contentRating,
    similarLogos,
  };
}
