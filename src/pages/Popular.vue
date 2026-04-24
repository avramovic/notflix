<template>
  <div class="min-h-screen bg-netflix-bg-gray text-white pt-30 z-[1]">
    <Navbar />

    <div class="relative mx-auto px-4 py-4 space-y-4">
      <div v-for="grid in contentGrids" :key="grid.id">
        <component
          :is="grid.component"
          :title="grid.title"
          :items="grid.items"
          :logos="grid.logos"
          :content-type="grid.contentType"
          :is-loading="isLoading"
          @content-click="handleContentClick"
        />
      </div>
    </div>

    <Footer />

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Navbar from "@/components/Navbar.vue";
import ContentCarousel from "@/components/Grids/ContentGrid/ContentCarousel.vue";
import TopTenContentGrid from "@/components/Grids/TopTenContentGrid.vue";
import Footer from "@/components/Footer.vue";
import {
  fetchNewReleases,
  fetchComingNextMonth,
  fetchComingSoon,
  fetchTopTenMovies,
  fetchTopTenTVShows,
} from "@/api/tmdb";
import { hydrateTitlesBatch } from "@/api/batchHydrate";
import { navigateToContentRoute } from "@/utils/contentRoutes";

const router = useRouter();
const isLoading = ref(true);

const gridConfig = [
  {
    id: "newThisMonth",
    title: "New This Month",
    component: ContentCarousel,
    contentType: "movie",
    fetcher: fetchNewReleases,
  },
  {
    id: "comingNextMonth",
    title: "Coming Next Month",
    component: ContentCarousel,
    contentType: "movie",
    fetcher: fetchComingNextMonth,
  },
  {
    id: "comingSoon",
    title: "Coming Soon",
    component: ContentCarousel,
    contentType: "movie",
    fetcher: fetchComingSoon,
  },
  {
    id: "topTenMovies",
    title: "Top 10 Movies Today",
    component: TopTenContentGrid,
    contentType: "movie",
    fetcher: fetchTopTenMovies,
    process: (items) =>
      items.map((item, index) => ({ ...item, ranking: index + 1 })),
  },
  {
    id: "topTenTV",
    title: "Top 10 TV Shows Today",
    component: TopTenContentGrid,
    contentType: "tv",
    fetcher: fetchTopTenTVShows,
    process: (items) =>
      items.map((item, index) => ({ ...item, ranking: index + 1 })),
  },
];

const contentGrids = ref(
  gridConfig.map((config) => ({ ...config, items: [], logos: {} }))
);

function handleContentClick(payload) {
  navigateToContentRoute(router, payload);
}

async function fetchAllContent() {
  try {
    isLoading.value = true;
    const dataPromises = contentGrids.value.map((grid) => grid.fetcher());
    const allData = await Promise.all(dataPromises);

    allData.forEach((items, index) => {
      const grid = contentGrids.value[index];
      grid.items = grid.process ? grid.process(items) : items;
    });

    for (const grid of contentGrids.value) {
      hydrateTitlesBatch(grid.items, grid.contentType);
    }
  } catch (error) {
    console.error("Error fetching data for Popular page:", error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchAllContent);
</script>

<style scoped>
.swiper-pagination-bullet {
  width: 12px;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0;
  margin: 0 4px;
  opacity: 0.5;
}

.swiper-pagination-bullet-active {
  background: #ffffff;
  opacity: 1;
}
</style>
