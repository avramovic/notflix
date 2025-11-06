const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://imdb.6683549.xyz";
const RATING_FILTER = "&certification_country=US&certification.lte=R";

let preloadedMovies = {};

const filterByBackdropPath = (results) =>
  results.filter((item) => item.backdrop_path && item.release_date && item.genre_ids);

const imdbToTmdb = function(title) {
  let cast = [];
  for (const actor of title.stars || []) {
    cast.push({
      adult: false,
      character: actor.displayName,
      id: actor.id,
      gender: 0,
      credit_id: actor.id,
      name: actor.displayName,
      known_for_department: actor.primaryProfessions?.length > 0 ? actor.primaryProfessions[0] : "actor",
      profile_path: actor.primaryImage?.url ?? null,
    });
  }

  let seasons = [];
  if (title.seasons && title.seasons.length > 0) {
    for (const season of title.seasons) {
      seasons.push({
        air_date: title.startYear ? title.startYear+'-01-01' : null,
        episode_count: season.episodeCount,
        id: parseInt(season.season),
        name: parseInt(season.season),
        overview: null,
        poster_path: title.primaryImage?.url ?? null,
        season_number: parseInt(season.season),
        vote_average: 0,
      });
    }
  }

  let type = title.type;

  if (type === "tvSeries") {
    type = "tv";
  }

  return {
    adult: false,
    media_type: type,
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
    seasons: seasons,
  };
}

/**
 * Fetch trending movies, filtered to exclude ratings above R.
 * @returns {Promise<Array>} List of popular movies
 */
export async function fetchTrendingMovies() {
  let url = `${BASE_URL}/titles?types=MOVIE&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=1.0`;
  const res = await fetch(
    url
  );
  if (!res.ok) throw new Error("Failed to fetch movies");
  const data = await res.json();

  const titles = [];
  for (const title of data.titles) {
    titles.push(imdbToTmdb(title));
  }

  console.log('trending movies fetched:', titles);

  return filterByBackdropPath(titles);
}

export async function fetchMoviesByGenre(genreId) {
  const res = await fetch(
    `${BASE_URL}/titles?types=MOVIE&genres=${genreId}&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=1.0`
  );
  if (!res.ok) throw new Error("Failed to fetch movies");
  const data = await res.json();

  const titles = [];
  for (const title of data.titles) {
    titles.push(imdbToTmdb(title));
  }

  return filterByBackdropPath(titles);
}

export async function fetchMovieTrailers(movieId) {
  const data = await fetchMovieDetails(movieId);

  return data.videos?.filter(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
}

export async function fetchMovieLogos(movieId) {
  // return null;
  const data = await fetchMovieDetails(movieId);

  let tmdb = imdbToTmdb(data);

  return null;

  return "https://dummyimage.com/300x100/000/fff.png&text="+encodeURIComponent(tmdb.title);

  // const logos = data.logos.filter((l) => l.iso_639_1 === "en") || data.logos;
  // return logos.length > 0 ? logos[0].file_path : null;
}

export async function fetchMovieRatings(movieId) {
  try {
    const data = await fetchMovieDetails(movieId);

    return data.vote_average;

    const usRelease = data.find(
      (country) => country.iso_3166_1 === "US"
    );
    if (
      usRelease &&
      usRelease.release_dates &&
      usRelease.release_dates.length > 0
    ) {
      const certifiedRelease = usRelease.release_dates.find(
        (rd) => rd.certification
      );
      if (certifiedRelease && certifiedRelease.certification) {
        return certifiedRelease.certification;
      }
    }

    for (const country of data.results) {
      if (country.release_dates && country.release_dates.length > 0) {
        const certifiedRelease = country.release_dates.find(
          (rd) => rd.certification
        );
        if (certifiedRelease && certifiedRelease.certification) {
          return certifiedRelease.certification;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching movie rating:", error);
    return null;
  }
}

/**
 * Fetch new releases - movies released in the past 60 days, filtered by rating.
 * @returns {Promise<Array>} List of recent movie releases
 */
export async function fetchNewReleases() {
  const today = new Date();
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 60);

  const fromDate = sixtyDaysAgo.toISOString().split("T")[0];
  const toDate = today.toISOString().split("T")[0];

  const year = today.getFullYear();

  const res = await fetch(
    `${BASE_URL}/titles?types=MOVIE&types=TV_SERIES&startYear=${year}&endYear=${year}&sortBy=SORT_BY_YEAR&sortOrder=DESC&minAggregateRating=1.0`
  );
  if (!res.ok) throw new Error("Failed to fetch new releases");
  const data = await res.json();

  const titles = [];
  for (const title of data.titles) {
    titles.push(imdbToTmdb(title));
  }

  return filterByBackdropPath(titles);
}

/**
 * Fetch upcoming movies with improved error handling and more data, filtered by rating.
 * @returns {Promise<Array>} List of upcoming movies
 */
export async function fetchUpcomingMovies() {
  try {
    console.log("Fetching upcoming movies...");
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 90); // Look ahead 90 days

    const fromDate = today.toISOString().split("T")[0];
    const toDate = futureDate.toISOString().split("T")[0];

    const year = today.getFullYear()+1;

    const [page1Res] = await Promise.all([
      fetch(
        `${BASE_URL}/titles?types=MOVIE&startYear=${year}&endYear=${year}&sortBy=SORT_BY_YEAR&sortOrder=ASC&minAggregateRating=1.0`
      ),
      // fetch(
      //   `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${fromDate}&primary_release_date.lte=${toDate}&sort_by=primary_release_date.asc&page=2${RATING_FILTER}`
      // ),
    ]);

    if (!page1Res.ok) {
      console.error("Upcoming Movies Page 1 error:", await page1Res.text());
      throw new Error(`Failed to fetch upcoming movies: ${page1Res.status}`);
    }

    const data1 = await page1Res.json();
    // let results = [...data1.results];

    const results = [];
    for (const title of data1.titles) {
      results.push(imdbToTmdb(title));
    }

    console.log(`Total upcoming movies fetched: ${results.length}`);

    return filterByBackdropPath(results)
      .filter((movie) => movie.poster_path && movie.release_date)
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
  } catch (error) {
    console.error("Error in fetchUpcomingMovies:", error);
    return [];
  }
}

/**
 * Fetch movies coming out this month (next 30 days)
 * @returns {Promise<Array>} Movies releasing within 30 days
 */
export async function fetchComingThisMonth() {
  try {
    const allUpcoming = await fetchUpcomingMovies();
    const today = new Date();

    console.log("Total upcoming movies found:", allUpcoming.length);

    return allUpcoming.filter((movie) => {
      if (!movie.release_date) return false;
      const releaseDate = new Date(movie.release_date);
      const daysDifference = (releaseDate - today) / (1000 * 60 * 60 * 24);
      return daysDifference > 7 && daysDifference <= 30;
    });
  } catch (error) {
    console.error("Error fetching this month's releases:", error);
    return [];
  }
}

/**
 * Fetch movies coming out next month (30-60 days from now)
 * @returns {Promise<Array>} Movies releasing 30-60 days from now
 */
export async function fetchComingNextMonth() {
  try {
    const today = new Date();

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const sixtyDaysFromNow = new Date(today);
    sixtyDaysFromNow.setDate(today.getDate() + 60);

    const fromDate = thirtyDaysFromNow.toISOString().split("T")[0];
    const toDate = sixtyDaysFromNow.toISOString().split("T")[0];

    console.log(`Fetching movies from ${fromDate} to ${toDate}`);

    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${fromDate}&primary_release_date.lte=${toDate}&sort_by=primary_release_date.asc&region=US&with_release_type=3${RATING_FILTER}`
    );

    if (!res.ok) {
      console.error("Coming next month API error:", await res.text());
      throw new Error("Failed to fetch coming next month movies");
    }

    const data = await res.json();
    let results = filterByBackdropPath(data.results);
    if (results.length < 10) {
      const page2Res = await fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${fromDate}&primary_release_date.lte=${toDate}&sort_by=primary_release_date.asc&page=2®ion=US&with_release_type=3${RATING_FILTER}`
      );

      if (page2Res.ok) {
        const page2Data = await page2Res.json();
        results = [...results, ...filterByBackdropPath(page2Data.results)];
        console.log(
          `Added ${page2Data.results.length} more movies from page 2`
        );
      }
    }

    return results.filter((movie) => movie.poster_path);
  } catch (error) {
    console.error("Error fetching next month's releases:", error);
    return [];
  }
}

/**
 * Fetch movies coming out very soon (next 7 days)
 * @returns {Promise<Array>} Movies releasing within a week
 */
export async function fetchComingSoon() {
  try {
    const allUpcoming = await fetchUpcomingMovies();
    const today = new Date();

    return allUpcoming
      .filter((movie) => {
        if (!movie.release_date) return false;
        const releaseDate = new Date(movie.release_date);
        const daysDifference = (releaseDate - today) / (1000 * 60 * 60 * 24);
        return daysDifference >= 0 && daysDifference <= 7;
      })
      .slice(0, 20);
  } catch (error) {
    console.error("Error fetching coming soon releases:", error);
    return [];
  }
}

/**
 * Fetch critically acclaimed movies (high voter average), filtered by rating.
 * @returns {Promise<Array>} List of highly-rated movies
 */
export async function fetchCriticallyAcclaimedMovies() {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=vote_average.desc&vote_count.gte=3000${RATING_FILTER}`
  );
  if (!res.ok) throw new Error("Failed to fetch critically acclaimed movies");
  const data = await res.json();
  return filterByBackdropPath(data.results);
}

export async function fetchTrendingTVShows() {
  const res = await fetch(`${BASE_URL}/titles?types=TV_SERIES&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=1.0`);
  if (!res.ok) throw new Error("Failed to fetch TV shows");
  const data = await res.json();

  const titles = [];
  for (const title of data.titles) {
    titles.push(imdbToTmdb(title));
  }

  return filterByBackdropPath(titles);
}

export async function fetchTVShowsByGenre(genreId) {
  const res = await fetch(
    `${BASE_URL}/titles?types=TV_SERIES&genres=${genreId}&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=1.0`
  );
  if (!res.ok) throw new Error("Failed to fetch TV shows");
  const data = await res.json();

  const titles = [];
  for (const title of data.titles ?? []) {
    titles.push(imdbToTmdb(title));
  }

  return filterByBackdropPath(titles);
}

export async function fetchTVShowTrailers(tvId) {
  const data = await fetchTVShowDetails(tvId);

  return [];

  return data.results.filter(
    (v) => v.site === "YouTube" && v.type === "Trailer"
  );
}

export async function fetchTVShowSeasonDetails(tvId, seasonNumber) {
  try {
    const res = await fetch(
      `${BASE_URL}/titles/${tvId}/episodes?season=${seasonNumber}`
    );
    if (!res.ok) {
      console.error(`Failed to fetch season ${seasonNumber} for TV ID ${tvId}`);

      return { episodes: [] };
    }
    const data = await res.json();

    let episodes = [];

    for (const episode of data.episodes) {
      let air_date = 'unknown';
      if (episode.releaseDate) {
        const { year, month, day } = episode.releaseDate;
        const d = new Date(year, month - 1, day);
        air_date = isNaN(d) ? null : d.toDateString();
      }
      episodes.push({
        air_date: air_date,
        episode_number: episode.episodeNumber,
        id: episode.id,
        name: episode.title || `Episode ${episode.episodeNumber}`,
        overview: episode.plot || null,
        production_code: null,
        season_number: parseInt(episode.season),
        show_id: tvId,
        still_path: episode.primaryImage?.url ?? null,
        vote_average: episode.rating?.aggregateRating ?? 0,
        vote_count: episode.rating?.voteCount ?? 0,
      });
    }

    let bag = {
      episodes: episodes,
    };

    return bag;
  } catch (error) {
    console.error("Error fetching TV show season details:", error);
    return { episodes: [] };
  }
}

export async function fetchTVShowLogos(tvId) {
  const data = await fetchTVShowDetails(tvId);

  return null;

  const logos = data.logos.filter((l) => l.iso_639_1 === "en") || data.logos;
  return logos.length > 0 ? logos[0].file_path : null;
}

export async function fetchTVShowRatings(tvId) {
  try {
    const data = await fetchTVShowDetails(tvId);

    return data.vote_average;

    const usRating = data.results.find((rating) => rating.iso_3166_1 === "US");
    if (usRating && usRating.rating) {
      return usRating.rating;
    }

    for (const rating of data.results) {
      if (rating.rating) {
        return rating.rating;
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching TV show rating:", error);
    return null;
  }
}

/**
 * Fetch the current top 10 popular movies in the USA, filtered by rating.
 * Note: Uses discover/movie endpoint to allow for rating filters.
 * @returns {Promise<Array>} List of top 10 movies with ranking
 */
export async function fetchTopTenMovies() {
  const res = await fetch(
    `${BASE_URL}/titles?types=MOVIE&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=7.0`
  );
  if (!res.ok) throw new Error("Failed to fetch top movies");
  const data = await res.json();

  const titles = [];
  for (let i=0; i<data.titles.length; i++) {
    let title = data.titles[i];
    titles.push(imdbToTmdb(title));
  }

  return filterByBackdropPath(titles)
    .slice(0, 10)
    .map((movie, index) => ({ ...movie, ranking: index + 1 }));
}

/**
 * Fetch the current top 10 TV shows in the USA
 * @returns {Promise<Array>} List of top 10 TV shows with ranking metadata
 */
export async function fetchTopTenTVShows() {
  const res = await fetch(
    `${BASE_URL}/titles?types=TV_SERIES&sortBy=SORT_BY_POPULARITY&sortOrder=ASC&minAggregateRating=5.0`
  );
  if (!res.ok) throw new Error("Failed to fetch top shows");
  const data = await res.json();

  const titles = [];
  console.log(data.titles);
  for (const title of data.titles ?? []) {
    titles.push(imdbToTmdb(title));
  }

  return filterByBackdropPath(titles)
    .slice(0, 10)
    .map((movie, index) => ({ ...movie, ranking: index + 1 }));
}

export async function fetchMovieDetails(movieId) {
  if (preloadedMovies[movieId]) {
    return preloadedMovies[movieId];
  }
  const res = await fetch(
    `${BASE_URL}/titles/${movieId}`
  );
  if (!res.ok)
    throw new Error(`Failed to fetch movie details for ID: ${movieId}`);

  const title = await res.json();
  preloadedMovies[movieId] = imdbToTmdb(title);
  return preloadedMovies[movieId];
}

export async function fetchTVShowDetails(tvId) {
  if (preloadedMovies[tvId]) {
    return preloadedMovies[tvId];
  }
  const res = await fetch(
    `${BASE_URL}/titles/${tvId}`
  );
  if (!res.ok)
    throw new Error(`Failed to fetch TV show details for ID: ${tvId}`);
  const title = await res.json();


  const res2 = await fetch(
    `${BASE_URL}/titles/${tvId}/seasons`
  );
  if (!res2.ok)
    throw new Error(`Failed to fetch TV show seasons for ID: ${tvId}`);
  const seasons = await res2.json();

  title.seasons = seasons.seasons;

  preloadedMovies[tvId] = imdbToTmdb(title);
  return preloadedMovies[tvId];
}

export async function fetchMovieCast(movieId) {
  const data = await fetchMovieDetails(movieId);

  let tmdb = imdbToTmdb(data);
  return tmdb.credits.cast || [];
}

export async function fetchTVShowCast(tvId) {
  const data = await fetchTVShowDetails(tvId);
  let tmdb = imdbToTmdb(data);
  return tmdb.credits.cast || [];
}

export async function fetchSimilarMovies(movieId) {
  const title = await fetchMovieDetails(movieId);

  let genreParams = [];
  let i = 0;
  for (const genre of title.genre_ids ?? []) {
    if (i >= 3) break; // Limit to first 3 genres
    genreParams.push("genres=" + encodeURIComponent(genre));
    i++;
  }

  const res2 = await fetch(`${BASE_URL}/titles?types=MOVIE&sortBy=SORT_BY_POPULARITY&minAggregateRating=1.0&sortOrder=ASC&${genreParams.join('&')}`);
  if (!res2.ok)
    throw new Error(`Failed to fetch similar TV shows for ID: ${movieId}`);
  const data = await res2.json();

  const titles = [];
  for (const movie of data.titles) {
    titles.push(imdbToTmdb(movie));
  }

  return filterByBackdropPath(titles.filter((t) => t.id !== movieId) || []);
}

export async function fetchSimilarTVShows(tvId) {
  const title = await fetchTVShowDetails(tvId);

  let genreParams = [];
  let i = 0;
  for (const genre of title.genre_ids ?? []) {
    if (i >= 3) break; // Limit to first 3 genres
    genreParams.push("genres=" + encodeURIComponent(genre));
    i++;
  }

  const res = await fetch(`${BASE_URL}/titles?types=TV_SERIES&sortBy=SORT_BY_POPULARITY&minAggregateRating=1.0&sortOrder=ASC&${genreParams.join('&')}`);
  if (!res.ok)
    throw new Error(`Failed to fetch similar TV shows for ID: ${tvId}`);
  const data = await res.json();

  const titles = [];
  for (const show of data.titles) {
    titles.push(imdbToTmdb(show));
  }

  return filterByBackdropPath(titles.filter((t) => t.id !== tvId) || []);
}

export const MOVIE_GENRES = {
  ACTION: "Action",
  COMEDY: "Comedy",
  HORROR: "Horror",
  ROMANCE: "Romance",
  DOCUMENTARY: "Documentary",
};

export const TV_GENRES = {
  ACTION_ADVENTURE: "Action",
  COMEDY: "Comedy",
  DRAMA: "Drama",
  REALITY: "Reality",
  CRIME: "Crime",
  DOCUMENTARY: "Documentary",
};

export async function fetchTVShowSeasons(tvId) {
  try {
    const res = await fetch(
      `${BASE_URL}/titles/${tvId}/episodes?season=1`
    );
    if (!res.ok) {
      console.error(`Failed to fetch season 1 for TV ID ${tvId}`);

      return { episodes: [] };
    }
    const data = await res.json();

    let episodes = [];

    for (const episode of data.episodes) {
      episodes.push({
        air_date: (new Date(episode.releaseDate.year, episode.releaseDate.month - 1, episode.releaseDate.day))
          .toISOString().split('T')[0],
        episode_number: episode.episodeNumber,
        id: episode.id,
        name: episode.title || `Episode ${episode.episodeNumber}`,
        overview: episode.plot || null,
        production_code: null,
        season_number: episode.season.toString(),
        show_id: tvId,
        still_path: episode.primaryImage?.url ?? null,
        vote_average: episode.rating?.aggregateRating ?? 0,
        vote_count: episode.rating?.voteCount ?? 0,
      });
    }

    console.log(episodes);

    return episodes;
  } catch (error) {
    console.error("Error fetching TV show seasons:", error);
    return [];
  }
}

export async function fetchMovieCredits(movieId) {
  return fetchMovieCast(movieId);
}

export async function fetchTVShowCredits(tvId) {
  return fetchTVShowCast(tvId);
}

export async function searchMulti(query, page = 1) {
  try {
    const response = await fetch(
      `${BASE_URL}/search/titles?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error(`TMDB API error: ${response.status}`);
    const data = await response.json();

    const titles = [];
    for (const title of data.titles) {
      titles.push(imdbToTmdb(title));
    }

    return titles.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    ) || [];

    // return filterByBackdropPath(
    //   bag.results.filter(
    //     (item) => item.media_type === "movie" || item.media_type === "tv"
    //   ) || []
    // );
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return [];
  }
}
