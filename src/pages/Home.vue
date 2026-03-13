<template>
  <div
    class="min-h-screen bg-netflix-bg-gray text-white relative lg:pt-0 pt-13"
  >
    <div
      v-if="isMobileView"
      class="absolute top-0 left-0 right-0 h-[200vh] z-[-1]"
      :style="backgroundGradientStyle"
    ></div>

    <Navbar />

    <div class="relative w-full">
      <div
        v-if="isMobileView"
        class="flex justify-center items-center gap-2 mt-4 mb-4"
      >
        <button
          class="bg-transparent border border-white/60 text-white/60 px-4 py-1.5 rounded-full"
          @click="router.push({ name: 'TV' })"
        >
          TV Shows
        </button>
        <button
          class="bg-transparent border border-white/60 text-white/60 px-4 py-1.5 rounded-full"
          @click="router.push({ name: 'Movies' })"
        >
          Movies
        </button>
        <button
          class="bg-transparent border border-white/60 text-white/60 px-4 py-1.5 rounded-full"
          @click="router.push('/favorites')"
        >
          Favorites
        </button>
      </div>

      <div
        class="relative w-full h-[150vw] lg:h-[60vh] xl:h-[70vh] 2xl:h-[80vh] min-h-[300px] max-h-[1000px]"
      >
        <MobileFeaturedPoster
          v-if="featuredMovie && isMobileView"
          :movie="featuredMovie"
          :poster-path="featuredMovie.poster_path"
          :title="featuredMovie.title"
          :overview="featuredMovie.overview"
          :movie-id="featuredMovie.id"
          :logo-path="featuredLogo"
          content-type="movie"
          @colors-extracted="updateBackgroundColors"
        />
        <FeaturedTrailer
          v-if="featuredMovie && !isMobileView"
          :title="featuredMovie.title"
          :overview="featuredMovie.overview"
          :backdrop-path="featuredMovie.backdrop_path"
          :trailer-key="featuredTrailerKey"
          :logo-path="featuredLogo"
          :movie-id="featuredMovie.id"
          :genres="featuredMovie.genres"
          :type="featuredMovie.media_type"
          content-type="movie"
          class="hidden lg:block"
          @showMoreInfo="openModal"
        />
      </div>
    </div>

    <div class="relative z-30 pointer-events-auto space-y-4">
      <div v-for="grid in contentGrids" :key="grid.id">
        <component
          :is="grid.component"
          :title="grid.title"
          :items="grid.items"
          :logos="grid.logos"
          :content-type="grid.contentType"
          :is-loading="isLoading"
          @content-click="openModalFromGrid"
        />
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/user";
import {
  fetchNewReleases,
  fetchMoviesByGenre,
  fetchTopTenMovies,
  MOVIE_GENRES,
  fetchMovieLogos,
  fetchMovieTrailers,
  fetchMovieDetails,
} from "@/api/tmdb";
import {
  fetchTrendingTVShows,
  fetchTVShowsByGenre,
  TV_GENRES,
  fetchTVShowLogos,
} from "@/api/tmdb";
import Navbar from "@/components/Navbar.vue";
import FeaturedTrailer from "@/components/FeaturedTrailer/FeaturedTrailer.vue";
import MobileFeaturedPoster from "@/components/Mobile/MobileFeaturedPoster.vue";
import ContentCarousel from "@/components/Grids/ContentGrid/ContentCarousel.vue";
import TopTenContentGrid from "@/components/Grids/TopTenContentGrid.vue";
import Footer from "@/components/Footer.vue";
import { navigateToContentRoute } from "@/utils/contentRoutes";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const isLoading = ref(true);
const isMobileView = ref(window.innerWidth < 1024);

const featuredMovie = ref(null);
const featuredTrailerKey = ref(null);
const featuredLogo = ref(null);

const dominantColors = reactive({ primary: null, secondary: null });

const FIXED_SECTIONS = [
  {
    id: "newReleases",
    title: "New Releases",
    component: ContentCarousel,
    contentType: "movie",
    fetcher: fetchNewReleases,
  },
  {
    id: "topTenMovies",
    title: "Top 10 Movies Today",
    component: TopTenContentGrid,
    contentType: "movie",
    fetcher: fetchTopTenMovies,
  },
];

const DEFAULT_GENRE_ROWS = [
  {
    id: "actionTV",
    title: "Action & Adventure",
    component: ContentCarousel,
    contentType: "tv",
    fetcher: () => fetchTVShowsByGenre(TV_GENRES.ACTION_ADVENTURE),
  },
  {
    id: "dramaTV",
    title: "TV Dramas",
    component: ContentCarousel,
    contentType: "tv",
    fetcher: () => fetchTVShowsByGenre(TV_GENRES.DRAMA),
  },
  {
    id: "crimeTV",
    title: "Crime TV Shows",
    component: ContentCarousel,
    contentType: "tv",
    fetcher: () => fetchTVShowsByGenre(TV_GENRES.CRIME),
  },
  {
    id: "comedyTV",
    title: "Comedy",
    component: ContentCarousel,
    contentType: "tv",
    fetcher: () => fetchTVShowsByGenre(TV_GENRES.COMEDY),
  },
  {
    id: "documentaryTV",
    title: "Documentaries",
    component: ContentCarousel,
    contentType: "tv",
    fetcher: () => fetchTVShowsByGenre(TV_GENRES.DOCUMENTARY),
  },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getMediaType(item) {
  return item.media_type || (item.first_air_date ? "tv" : "movie");
}

function buildGenreRowsForHome() {
  const list = userStore.currentMyList || [];
  const allGenreIds = list.flatMap((item) => item.genre_ids || []);
  const distinctGenres = [...new Set(allGenreIds)];

  if (distinctGenres.length < 5) {
    return DEFAULT_GENRE_ROWS;
  }

  const countByGenre = {};
  allGenreIds.forEach((g) => {
    countByGenre[g] = (countByGenre[g] || 0) + 1;
  });
  const top5Genres = Object.entries(countByGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g]) => g);
  const shuffled = shuffleArray(top5Genres);

  const tvCount = list.filter((i) => getMediaType(i) === "tv").length;
  const movieCount = list.filter((i) => getMediaType(i) === "movie").length;
  const moreTV = tvCount > movieCount;
  // Naizmenično: više serija -> TV, Movie, TV, Movie, TV; više filmova -> Movie, TV, Movie, TV, Movie
  const rows = [];
  for (let i = 0; i < 5; i++) {
    const isTV = moreTV ? i % 2 === 0 : i % 2 === 1;
    const genre = shuffled[i];
    if (isTV) {
      rows.push({
        id: `genre-tv-${i}-${genre}`,
        title: `${genre} TV Shows`,
        component: ContentCarousel,
        contentType: "tv",
        fetcher: () => fetchTVShowsByGenre(genre),
      });
    } else {
      rows.push({
        id: `genre-movie-${i}-${genre}`,
        title: `${genre} Movies`,
        component: ContentCarousel,
        contentType: "movie",
        fetcher: () => fetchMoviesByGenre(genre),
      });
    }
  }
  return rows;
}

function buildContentGrids() {
  const genreRows = buildGenreRowsForHome();
  return [...FIXED_SECTIONS, ...genreRows];
}

const contentGrids = ref(
  buildContentGrids().map((config) => ({ ...config, items: [], logos: {} }))
);

const backgroundGradientStyle = computed(() => {
  const primary = dominantColors.primary
    ? `rgba(${dominantColors.primary.join(",")}, 0.85)`
    : "rgba(229, 9, 20, 0.85)";
  const secondary = dominantColors.secondary
    ? `rgba(${dominantColors.secondary.join(",")}, 0.6)`
    : "rgba(40, 40, 40, 0.6)";
  return {
    background: `linear-gradient(to bottom, ${primary} 0%, ${primary} 10%, ${secondary} 30%, rgba(20, 20, 20, 0.95) 50%, rgba(20, 20, 20, 1) 70%)`,
    transition: "background 0.5s ease-out",
  };
});

const checkMobileView = () => (isMobileView.value = window.innerWidth < 1024);

const enhanceColor = (color) => {
  const [r, g, b] = color;
  const max = Math.max(r, g, b);
  if (max === Math.min(r, g, b)) return color;
  const boostedColor = [...color];
  const dominantChannel = r === max ? 0 : g === max ? 1 : 2;
  boostedColor[dominantChannel] = Math.min(
    255,
    Math.round(boostedColor[dominantChannel] * 1.15)
  );
  return boostedColor;
};

const updateBackgroundColors = (colors) => {
  if (colors?.primary) {
    dominantColors.primary = enhanceColor(colors.primary);
    dominantColors.secondary = colors.secondary;
  }
};

const openModal = (content) => {
  navigateToContentRoute(router, content);
};

const openModalFromGrid = (payload) => {
  openModal(payload);
};

const initializeUserProfile = () => {
  if (!userStore.profilesLoaded || userStore.profiles.length === 0) {
    if (!userStore.currentProfile) {
      console.warn(
        "initializeUserProfile: Profiles not loaded or empty, and no current profile. Skipping initialization."
      );
    }
    return;
  }

  const profileIdFromUrl = route.query.profile;
  let targetProfileId = profileIdFromUrl;
  let profileToSet = null;

  if (targetProfileId) {
    profileToSet = userStore.profiles.find((p) => p.id === targetProfileId);
  }

  if (
    !profileToSet &&
    userStore.profiles.length > 0 &&
    !userStore.currentProfile
  ) {
    profileToSet = userStore.profiles[0];
  } else if (
    !profileToSet &&
    userStore.currentProfile?.id === targetProfileId
  ) {
    // If the target is already the current profile, do nothing.
    return;
  }

  if (profileToSet) {
    userStore.setActiveProfile(profileToSet);
  } else if (
    !targetProfileId &&
    !userStore.currentProfile &&
    userStore.profiles.length > 0
  ) {
    userStore.setActiveProfile(userStore.profiles[0]);
  } else if (targetProfileId && !profileToSet) {
    console.warn(
      `initializeUserProfile: Profile with ID "${targetProfileId}" not found. Defaulting if possible.`
    );
    if (!userStore.currentProfile && userStore.profiles.length > 0) {
      userStore.setActiveProfile(userStore.profiles[0]);
    }
  }
};

const fetchAllContent = async () => {
  try {
    isLoading.value = true;
    const dataPromises = contentGrids.value.map((grid) => grid.fetcher());
    const allData = await Promise.all(dataPromises);

    const logoPromises = [];
    allData.forEach((items, index) => {
      const grid = contentGrids.value[index];
      grid.items = items;
      const logoFetcher =
        grid.contentType === "tv" ? fetchTVShowLogos : fetchMovieLogos;
      items.forEach((item) => {
        logoPromises.push(
          logoFetcher(item.id).then((logo) => ({
            gridId: grid.id,
            itemId: item.id,
            logo,
          }))
        );
      });
    });

    // const allLogos = await Promise.all(logoPromises);
    // allLogos.forEach(({ gridId, itemId, logo }) => {
    //   if (logo) {
    //     const grid = contentGrids.value.find((g) => g.id === gridId);
    //     if (grid) grid.logos[itemId] = logo;
    //   }
    // });

    const moviesWithBackdrop = contentGrids.value[0].items.filter(
      (m) => m.backdrop_path
    );
    if (moviesWithBackdrop.length > 0) {
      featuredMovie.value =
        moviesWithBackdrop[
          Math.floor(Math.random() * moviesWithBackdrop.length)
        ];

      const movieDetails = await fetchMovieDetails(featuredMovie.value.id);

      // [featuredLogo.value, featuredTrailerKey.value] = await Promise.all([
      //   fetchMovieLogos(featuredMovie.value.id),
      //   fetchMovieTrailers(featuredMovie.value.id).then(
      //     (trailers) => trailers[0]?.key || null
      //   ),
      // ]);
      featuredMovie.value = { ...featuredMovie.value, ...movieDetails };
    }
  } catch (error) {
    console.error("Error fetching page content:", error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => userStore.currentProfile?.id,
  (newProfileId, oldProfileId) => {
    // Only fetch content if the profile ID actually changes to a new, valid ID
    if (newProfileId && newProfileId !== oldProfileId) {
      contentGrids.value = buildContentGrids().map((config) => ({
        ...config,
        items: [],
        logos: {},
      }));
      fetchAllContent();
    } else if (!newProfileId && oldProfileId) {
      // Handle case where profile becomes null (e.g., last profile deleted)
      featuredMovie.value = null;
      contentGrids.value.forEach((grid) => (grid.items = []));
      console.log("Profile became null, content cleared.");
    }
  },
  { immediate: true }
);

watch(
  () => userStore.profilesLoaded,
  (loaded) => {
    if (loaded) {
      initializeUserProfile();
    }
  },
  { immediate: true } // immediate: true to run it once when the watcher is set up
);

onMounted(() => {
  // initializeUserProfile(); // Moved to the watcher for profilesLoaded
  window.addEventListener("resize", checkMobileView);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkMobileView);
});

fetchAllContent();
</script>

<style scoped>
.absolute {
  transition: background 0.5s ease-out;
}

.netflix-gradient-fallback {
  background: linear-gradient(
    to bottom,
    rgba(229, 9, 20, 0.85) 0%,
    rgba(229, 9, 20, 0.6) 10%,
    rgba(40, 40, 40, 0.7) 30%,
    rgba(20, 20, 20, 0.95) 50%,
    rgba(20, 20, 20, 1) 70%
  );
}
</style>
