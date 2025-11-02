import { defineStore } from "pinia";
import { ref } from "vue";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://imdb.6683549.xyz";

export const useTVStore = defineStore("tv", () => {
  const genres = ref(null);
  let tvShowDetails = ref({});
  const tvShowVideos = ref({});
  const loading = ref(false);
  const error = ref(null);

  async function fetchGenres() {
    if (genres.value) return genres.value;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/titles?types=TV_SERIES&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=1.0`
      );

      if (!response.ok)
        throw new Error(`Failed to fetch TV genres: ${response.status}`);

      const data = await response.json();

      let genreLookup = data.titles.reduce((acc, title) => {
        for (const genre of title.genres ?? []) {
          acc[genre] = genre;
        }
        // acc[genre.id] = genre.name;
        return acc;
      }, {});

      genres.value = genreLookup;
      return genreLookup;
    } catch (err) {
      console.error("Error fetching TV genres:", err);
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function getTVShowDetails(id) {
    if (tvShowDetails.value[id]) return tvShowDetails.value[id];

    loading.value = true;
    error.value = null;

    try {
      let url = `${BASE_URL}/titles/${id}`;
      const response = await fetch(
        url
      );

      if (!response.ok)
        throw new Error(`Failed to fetch TV show details: ${response.status}`);

      const data = await response.json();

      let tmdb = imdbToTmdb(data);

      tvShowDetails.value[id] = tmdb;
      return tmdb;
    } catch (err) {
      console.error(`Error fetching details for TV show ${id}:`, err);
      error.value = err.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function getTVShowVideos(id) {
    if (tvShowVideos.value[id]) return tvShowVideos.value[id];

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/titles/${id}`
      );

      if (!response.ok)
        throw new Error(`Failed to fetch TV show videos: ${response.status}`);

      const data = await response.json();

      tvShowVideos.value[id] = data.results;
      return data.results;
    } catch (err) {
      console.error(`Error fetching videos for TV show ${id}:`, err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function searchTV(query) {
    if (!query) return [];

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/search/tv?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
          query
        )}&page=1`
      );

      if (!response.ok)
        throw new Error(`Failed to search TV shows: ${response.status}`);

      const data = await response.json();
      return data.results;
    } catch (err) {
      console.error("Error searching TV shows:", err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function getTVRecommendations(id) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
      );

      if (!response.ok)
        throw new Error(
          `Failed to fetch TV recommendations: ${response.status}`
        );

      const data = await response.json();
      return data.results;
    } catch (err) {
      console.error(`Error fetching recommendations for TV show ${id}:`, err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function getPopularTVShows() {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`
      );

      if (!response.ok)
        throw new Error(`Failed to fetch popular TV shows: ${response.status}`);

      const data = await response.json();
      return data.results;
    } catch (err) {
      console.error("Error fetching popular TV shows:", err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function getTodaysShows() {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(
        `${BASE_URL}/tv/airing_today?api_key=${API_KEY}&language=en-US&page=1`
      );

      if (!response.ok)
        throw new Error(`Failed to fetch today's TV shows: ${response.status}`);

      const data = await response.json();
      return data.results;
    } catch (err) {
      console.error("Error fetching today's TV shows:", err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  function clearCache() {
    tvShowDetails.value = {};
    tvShowVideos.value = {};
  }

  function imdbToTmdb(title) {
    let cast = [];
    for (const actor of title.stars || []) {
      cast.push({
        adult: false,
        character: actor.displayName,
        id: actor.id,
        geder: 0,
        credit_id: actor.id,
        name: actor.displayName,
        known_for_department: actor.primaryProfessions?.length > 0 ? actor.primaryProfessions[0] : "actor",
        profile_path: actor.primaryImage?.url ?? null,
      });
    }

    return {
      adult: false,
      media_type: title.type === "movie" ? "movie" : "tv",
      genre_ids: title.genres,
      id: title.id,
      original_language: "en",
      original_title: title.originalTitle ?? title.primaryTitle ?? "Untitled",
      overview: title.plot ?? "No overview available.",
      popularity: title.rating?.voteCount ?? 0,
      poster_path: title.primaryImage?.url,
      backdrop_path: title.primaryImage?.url,
      release_date: title.startYear ? title.startYear+'-01-01' : "unknown",
      title: title.primaryTitle ?? title.originalTitle ?? "Untitled",
      video: false,
      vote_average: title.rating?.aggregateRating ?? 0,
      vote_count: title.rating?.voteCount ?? 0,
      credits: {
        cast: cast,
      },
    };
  }

  return {
    genres,
    tvShowDetails,
    tvShowVideos,
    loading,
    error,

    fetchGenres,
    getTVShowDetails,
    getTVShowVideos,
    imdbToTmdb,
    searchTV,
    getTVRecommendations,
    getPopularTVShows,
    getTodaysShows,
    clearCache,
  };
});
