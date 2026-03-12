<template>
  <div v-if="similarContent && similarContent.length" class="mt-12">
    <h2 class="text-2xl font-semibold text-white mb-4">More Like This</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div
        v-for="item in similarContent"
        :key="item.id"
        class="group relative bg-netflix-gray-250 rounded-lg overflow-hidden cursor-pointer"
        @click="handleContentClick(item)"
      >
        <div class="flex flex-col h-full">
          <div class="aspect-video relative">
            <img
              :src="
                item.backdrop_path
                  ? `${item.backdrop_path}`
                  : 'null'
              "
              :alt="item.title || item.name"
              class="w-full h-full object-cover"
            />
            <div
              class="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            >
              <img
                v-if="logos[item.id]"
                :src="`${logos[item.id]}`"
                :alt="`${item.title || item.name} Logo`"
                class="max-h-16 w-auto drop-shadow-lg"
                draggable="false"
              />
              <h3
                v-else
                class="text-white text-center font-bold 2xl:text-md 3xl:text-xl px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              >
                {{ item.title || item.name }}
              </h3>
            </div>
          </div>

          <div class="bg-netflix-gray-800 p-2 flex flex-col flex-grow">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
<!--                <span-->
<!--                  class="border border-netflix-gray-100 text-md px-1 py-0 inline-flex text-netflix-gray-25 leading-tight"-->
<!--                  >{{ mainContentRating || "N/A" }}</span-->
<!--                >-->
                <span
                  class="border border-netflix-gray-100 rounded xl:text-xs 2xl:text-sm text-white px-1"
                  >HD</span
                >
                <span class="lg:text-md 3xl:text-lg text-gray-300">{{
                  getYear(item)
                }}</span>
              </div>
              <button
                @click.stop="toggleInList(item)"
                :class="[
                  'border border-2 rounded-full p-1.5 sm:p-2 transition-colors cursor-pointer',
                  isItemInList(item)
                    ? 'bg-red-600/20 border-red-500 text-red-500 hover:bg-red-600/30'
                    : 'bg-transparent border-gray-400/70 text-white hover:border-white hover:bg-white/25',
                ]"
                :title="
                  isItemInList(item) ? 'Remove from favorites' : 'Add to favorites'
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  class="w-4 h-4 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5"
                  :fill="isItemInList(item) ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M12 20.5s-7-4.35-7-10.13C5 7.41 7.24 5.5 9.86 5.5c1.45 0 2.83.67 3.64 1.73.81-1.06 2.19-1.73 3.64-1.73C19.76 5.5 22 7.41 22 10.37 22 16.15 15 20.5 15 20.5h-3z"
                  />
                </svg>
              </button>
            </div>
            <p
              class="relative xl:text-sm 2xl:text-md text-white/80 line-clamp-3 sm:line-clamp-4 mt-2 flex-grow"
            >
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
</template>

<script setup>
import { useUserStore } from "@/stores/user";

const props = defineProps({
  similarContent: { type: Array, default: () => [] },
  logos: { type: Object, default: () => ({}) },
  mainContentRating: { type: String, default: "N/A" },
});

const userStore = useUserStore();

const getMediaType = (item) =>
  item.media_type || (item.first_air_date ? "tv" : "movie");

const getYear = (item) => {
  const date = item.release_date || item.first_air_date;
  return date ? new Date(date).getFullYear().toString() : "N/A";
};

const isItemInList = (item) =>
  userStore.isItemInMyList(item, getMediaType(item));

const toggleInList = (item) => {
  userStore.toggleListItem(item, getMediaType(item));
};

const emit = defineEmits(["content-click"]);

function handleContentClick(item) {
  emit("content-click", item);
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
.line-clamp-4 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.group > .flex.flex-col {
  min-height: 100%;
}
</style>
