<template>
  <div
    class="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-h-full overflow-y-auto lg:max-w-5xl mx-auto my-8 bg-netflix-bg-gray rounded-lg shadow-lg overflow-hidden"
      @click.stop
    >
      <div class="sticky top-0 z-10 flex items-center justify-between p-6 bg-netflix-bg-gray/95 backdrop-blur-sm border-b border-white/10">
        <div>
          <h2 class="text-3xl font-semibold text-white">Favorites</h2>
          <p class="text-sm text-white/60 mt-1">
            {{ userStore.currentProfile?.name || "Guest" }}'s picks
          </p>
        </div>

        <button
          class="bg-black/40 rounded-full p-2 hover:bg-white/20 transition-colors cursor-pointer"
          @click="emit('close')"
          aria-label="Close favorites"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 text-white">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div class="p-6">
        <div
          v-if="!favoriteItems.length"
          class="py-20 text-center text-white"
        >
          <h3 class="text-2xl font-semibold mb-4">No favorites yet</h3>
          <p class="text-white/70">
            Tap the heart on a title to save it here for this profile.
          </p>
        </div>

        <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="item in favoriteItems"
            :key="item.docId"
            class="group relative bg-netflix-gray-250 rounded-lg overflow-hidden cursor-pointer"
            @click="openContent(item)"
          >
            <div class="flex flex-col h-full">
              <div class="aspect-video relative">
                <img
                  :src="item.backdrop_path || item.poster_path || '/NotflixLogo.png'"
                  :alt="item.title || item.name"
                  class="w-full h-full object-cover"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                >
                  <img
                    v-if="logos[item.id]"
                    :src="logos[item.id]"
                    :alt="`${item.title || item.name} Logo`"
                    class="max-h-16 w-auto drop-shadow-lg"
                    draggable="false"
                  />
                  <h3
                    v-else
                    class="text-white text-center font-bold text-sm md:text-base px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    {{ item.title || item.name }}
                  </h3>
                </div>
              </div>

              <div class="bg-netflix-gray-800 p-3 flex flex-col flex-grow">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="border border-netflix-gray-100 rounded text-xs text-white px-1"
                    >
                      {{ getMediaLabel(item) }}
                    </span>
                    <span class="text-sm text-gray-300">{{ getYear(item) }}</span>
                  </div>

                  <button
                    @click.stop="toggleFavorite(item)"
                    class="border border-red-500 border-2 bg-red-600/20 text-red-500 rounded-full p-2 transition-colors cursor-pointer hover:bg-red-600/30"
                    title="Remove from favorites"
                    aria-label="Remove from favorites"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="w-4 h-4"
                      fill="currentColor"
                    >
                      <path
                        d="M12 21s-7-4.35-7-10.13C5 7.91 7.24 6 9.86 6c1.45 0 2.83.67 3.64 1.73C14.31 6.67 15.69 6 17.14 6 19.76 6 22 7.91 22 10.87 22 16.65 15 21 15 21h-3z"
                      />
                    </svg>
                  </button>
                </div>

                <p class="text-sm text-white/80 line-clamp-3 mt-2 flex-grow">
                  {{
                    item.overview
                      ? item.overview.substring(0, 150) +
                        (item.overview.length > 150 ? "..." : "")
                      : "No description available."
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { fetchMovieLogos, fetchTVShowLogos } from "@/api/tmdb";
import { navigateToContentRoute } from "@/utils/contentRoutes";

const emit = defineEmits(["close"]);
const router = useRouter();
const userStore = useUserStore();
const logos = ref({});

const favoriteItems = computed(() =>
  [...userStore.currentMyList].sort((a, b) => {
    const first = new Date(b.addedAt || 0).getTime();
    const second = new Date(a.addedAt || 0).getTime();
    return first - second;
  })
);

function getMediaType(item) {
  return item.media_type || (item.first_air_date ? "tv" : "movie");
}

function getMediaLabel(item) {
  return getMediaType(item) === "tv" ? "TV" : "Movie";
}

function getYear(item) {
  const date = item.release_date || item.first_air_date;
  return date ? new Date(date).getFullYear().toString() : "N/A";
}

async function loadLogos(items) {
  const nextLogos = {};

  await Promise.all(
    items.map(async (item) => {
      const fetchLogo =
        getMediaType(item) === "tv" ? fetchTVShowLogos : fetchMovieLogos;

      try {
        const logo = await fetchLogo(item.id);
        if (logo) {
          nextLogos[item.id] = logo;
        }
      } catch (error) {
        console.error(`Failed to load logo for ${item.id}:`, error);
      }
    })
  );

  logos.value = nextLogos;
}

async function openContent(item) {
  await navigateToContentRoute(router, item);
}

async function toggleFavorite(item) {
  await userStore.toggleListItem(item, getMediaType(item));
}

watch(
  favoriteItems,
  (items) => {
    loadLogos(items);
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
</style>
