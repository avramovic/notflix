import { defineStore } from "pinia";
import { fetchMovieTrailers } from "@/api/tmdb";

export const useMovieStore = defineStore("movie", {
  state: () => ({
    genres: null,
    apiKey: import.meta.env.VITE_TMDB_API_KEY,
    baseUrl: "http://gdevelop-utils.test/imdb",
    preloadedMovies: {},
  }),

  actions: {
    async fetchGenres() {
      if (this.genres) return this.genres;

      try {
        const response = await fetch(
          `${this.baseUrl}/titles?types=MOVIE&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=1.0`
        );
        const data = await response.json();

        this.genres = data.titles.reduce((acc, title) => {
          for (const genre of title.genres ?? []) {
            acc[genre] = genre;
          }
          // acc[genre.id] = genre.name;
          return acc;
        }, {});

        return this.genres;
      } catch (error) {
        console.error("Error fetching genres:", error);
        return null;
      }
    },

    async getMovieVideos(movieId) {
      try {
        const videos = await fetchMovieTrailers(movieId);
        return videos;
      } catch (error) {
        console.error("Error fetching movie videos:", error);
        return [];
      }
    },

    async getMovieDetails(movieId) {
      if (this.preloadedMovies[movieId]) {
        return this.preloadedMovies[movieId];
      }
      try {
        const response = await fetch(
          `${this.baseUrl}/titles/${movieId}`
        );
        const title = await response.json();

        this.preloadedMovies[movieId] = this.imdbToTmdb(title);

        return this.preloadedMovies[movieId];
      } catch (error) {
        console.error("Error fetching movie details:", error);
        return null;
      }
    },

    imdbToTmdb(title) {
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
        overview: title.plot ?? null,
        popularity: title.rating?.voteCount ?? 0,
        poster_path: title.primaryImage?.url,
        backdrop_path: title.primaryImage?.url,
        release_date: title.startYear ? title.startYear+'-01-01' : null,
        title: title.primaryTitle ?? title.originalTitle ?? "Untitled",
        video: false,
        vote_average: title.rating?.aggregateRating ?? 0,
        vote_count: title.rating?.voteCount ?? 0,
        credits: {
          cast: cast,
        },
      };
    }
  },
});
