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
        <!-- Export / Import -->
        <div class="mb-8 rounded-lg border border-white/10 bg-black/20 overflow-hidden">
          <button
            type="button"
            class="w-full flex items-center justify-between gap-2 p-4 text-left hover:bg-white/5 transition-colors cursor-pointer"
            :aria-expanded="exportImportOpen"
            @click="exportImportOpen = !exportImportOpen"
          >
            <h3 class="text-lg font-semibold text-white">Export / Import</h3>
            <svg
              class="w-5 h-5 text-white/70 shrink-0 transition-transform"
              :class="{ 'rotate-180': exportImportOpen }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div v-show="exportImportOpen" class="space-y-4 px-4 pb-4">
            <!-- Export -->
            <div>
              <label class="block text-sm text-white/70 mb-1">Export (IMDb IDs)</label>
              <div class="flex gap-2">
                <input
                  :value="exportString"
                  type="text"
                  readonly
                  class="flex-1 min-w-0 rounded bg-netflix-gray-800 text-white text-sm px-3 py-2 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30"
                  placeholder="No favorites to export"
                  @click="selectExportField"
                />
                <button
                  type="button"
                  class="shrink-0 px-4 py-2 rounded bg-netflix-red text-white text-sm font-medium hover:bg-netflix-red/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!favoriteItems.length"
                  @click="copyExport"
                >
                  Copy
                </button>
              </div>
              <p v-if="copyFeedback" class="text-xs text-green-400 mt-1">{{ copyFeedback }}</p>
            </div>

            <!-- Import -->
            <div>
              <label class="block text-sm text-white/70 mb-1">Import (paste comma-separated tt IDs)</label>
              <textarea
                v-model="importInput"
                rows="2"
                class="w-full rounded bg-netflix-gray-800 text-white text-sm px-3 py-2 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 resize-y"
                placeholder="tt1234567,tt7654321"
              />
              <div v-if="favoriteItems.length && importIdsValid.length > 0" class="flex gap-4 mt-2 text-sm text-white/80">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="importMode" type="radio" value="merge" class="rounded" />
                  Merge with current
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="importMode" type="radio" value="replace" class="rounded" />
                  Clear and import
                </label>
              </div>
              <p v-if="importError" class="text-sm text-red-400 mt-1">{{ importError }}</p>
              <button
                type="button"
                class="mt-2 px-4 py-2 rounded bg-netflix-red text-white text-sm font-medium hover:bg-netflix-red/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="importLoading || !importIdsValid.length"
                @click="doImport"
              >
                {{ importLoading ? "Importing…" : "Import" }}
              </button>
            </div>
          </div>
        </div>

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
            <div class="flex min-h-0 flex-col h-full">
              <div class="aspect-video relative shrink-0">
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

              <div class="bg-netflix-gray-800 p-3 flex min-h-0 flex-col flex-grow">
                <div class="flex items-center justify-between mb-2 shrink-0">
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

                <p class="text-sm text-white/80 line-clamp-3 mt-2 min-h-0 flex-grow overflow-hidden">
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
import { fetchTitlesBatch } from "@/api/tmdb";
import { hydrateTitlesBatch } from "@/api/batchHydrate";
import { navigateToContentRoute } from "@/utils/contentRoutes";

const TT_ID_REGEX = /^tt\d+$/;

function normalizeIdForExport(id) {
  if (id == null) return "";
  const s = String(id).trim();
  if (/^\d+$/.test(s)) return `tt${s}`;
  return s;
}

function parseAndValidateIds(raw) {
  if (!raw || typeof raw !== "string") return { valid: [], invalid: [] };
  const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean);
  const valid = [];
  const invalid = [];
  for (const t of tokens) {
    if (TT_ID_REGEX.test(t)) valid.push(t);
    else invalid.push(t);
  }
  return { valid, invalid };
}

function tmdbLikeToListItem(tmdbItem) {
  const mediaType = tmdbItem.media_type || "movie";
  return {
    docId: `${mediaType}:${tmdbItem.id}`,
    id: tmdbItem.id,
    title: tmdbItem.title || null,
    name: tmdbItem.name || tmdbItem.title || null,
    poster_path: tmdbItem.poster_path || null,
    backdrop_path: tmdbItem.backdrop_path || null,
    media_type: mediaType,
    overview: tmdbItem.overview || null,
    vote_average: tmdbItem.vote_average || 0,
    release_date: tmdbItem.release_date || null,
    first_air_date: tmdbItem.first_air_date || tmdbItem.release_date || null,
    genre_ids: tmdbItem.genre_ids || [],
    addedAt: new Date().toISOString(),
  };
}

const emit = defineEmits(["close"]);
const router = useRouter();
const userStore = useUserStore();
const logos = ref({});

const exportString = computed(() =>
  userStore.currentMyList
    .map((item) => normalizeIdForExport(item.id))
    .filter(Boolean)
    .join(",")
);

const exportImportOpen = ref(false);
const copyFeedback = ref("");
const importInput = ref("");
const importMode = ref("merge");
const importError = ref("");
const importLoading = ref(false);

const importIdsValid = computed(() => {
  const { valid } = parseAndValidateIds(importInput.value);
  return valid;
});

const favoriteItems = computed(() =>
  [...userStore.currentMyList].sort((a, b) => {
    const first = new Date(b.addedAt || 0).getTime();
    const second = new Date(a.addedAt || 0).getTime();
    return first - second;
  })
);

function selectExportField(event) {
  event.target?.select();
}

async function copyExport() {
  if (!exportString.value) return;
  try {
    await navigator.clipboard.writeText(exportString.value);
    copyFeedback.value = "Copied to clipboard";
    setTimeout(() => { copyFeedback.value = ""; }, 2000);
  } catch (err) {
    console.error("Copy failed:", err);
    copyFeedback.value = "Copy failed";
  }
}

async function doImport() {
  const raw = importInput.value;
  const { valid, invalid } = parseAndValidateIds(raw);
  importError.value = "";
  if (invalid.length > 0) {
    importError.value = `Invalid IDs: ${invalid.join(", ")}. Use format tt1234567.`;
    return;
  }
  if (valid.length === 0) {
    importError.value = "Enter at least one valid IMDb ID (tt + numbers).";
    return;
  }
  importLoading.value = true;
  try {
    const titles = await fetchTitlesBatch(valid);
    const listItems = titles.map((t) => tmdbLikeToListItem(t));
    const hasExisting = userStore.currentMyList.length > 0;
    if (hasExisting && importMode.value === "replace") {
      userStore.setCurrentProfileMyList(listItems);
    } else {
      for (const item of listItems) {
        await userStore.addToMyList(item);
      }
    }
    importInput.value = "";
    importError.value = "";
  } catch (err) {
    console.error("Import failed:", err);
    importError.value = err?.message || "Import failed. Check IDs and try again.";
  } finally {
    importLoading.value = false;
  }
}

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

function loadLogos(items) {
  const movies = items.filter((i) => getMediaType(i) !== "tv");
  const tvs = items.filter((i) => getMediaType(i) === "tv");
  hydrateTitlesBatch(movies, "movie");
  hydrateTitlesBatch(tvs, "tv");
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
