<template>
  <div class="mb-14">
    <div class="flex justify-between items-center mb-4">
      <div class="relative w-full max-w-xs season-dropdown">
        <button
          @click="toggleSeasonDropdown"
          class="w-full bg-netflix-gray-200 text-white py-2 px-4 rounded flex justify-between items-center"
        >
          <span>{{ currentSeasonName }}</span>
          <svg
            class="w-4 h-4 ml-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <div
          v-if="isSeasonDropdownOpen"
          class="absolute mt-1 w-full rounded border border-netflix-gray-150 z-50 max-h-60 overflow-auto netflix-dropdown-menu"
        >
          <div class="py-2">
            <button
              v-for="season in seasons"
              :key="season.id"
              @click="selectSeason(season.season_number)"
              class="block w-full text-left px-4 py-2 text-white hover:bg-netflix-gray-150"
              :class="{
                'bg-netflix-gray-800': selectedSeason === season.season_number,
              }"
            >
              {{ season.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="episodes.length > 0" class="space-y-4">
      <div
        v-for="episode in episodes"
        :key="episode.id"
        class="flex bg-netflix-bg-gray rounded-md overflow-hidden cursor-pointer"
        @click="playEpisode(episode, $event)"
      >
        <div class="w-1/3 relative">
          <img
            :src="
              episode.still_path
                ? `${episode.still_path}`
                : 'https://via.placeholder.com/300x169/000000/FFFFFF?text=No+Preview'
            "
            :alt="episode.name"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="bg-black/50 border border-white rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="w-2/3 p-3">
          <div class="flex justify-between">
            <h3 class="font-medium">
              {{ episode.episode_number }}. {{ episode.name }}
            </h3>
            <span class="text-sm text-white/70"
              >{{ episode.runtime || "30" }}m</span
            >
          </div>
          <p class="text-sm text-white/80 mt-1 line-clamp-2">
            {{ episode.overview || "No description available." }}
          </p>
          <p class="text-xs text-white/80 mt-1 line-clamp-2">
            Air date: {{ episode.air_date }}
          </p>
        </div>
      </div>
    </div>
    <div v-else-if="isLoadingEpisodes" class="py-10 flex justify-center">
      <div class="animate-pulse">Loading episodes...</div>
    </div>
    <div v-else class="py-10 text-center text-white/70">
      No episodes available for this season
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  showId: Number,
  seasons: Array,
});

const selectedSeason = ref(null);
const episodes = ref([]);
const isLoadingEpisodes = ref(false);
const isSeasonDropdownOpen = ref(false);

const currentSeasonName = computed(() => {
  const season = props.seasons.find(
    (s) => s.season_number === selectedSeason.value
  );
  return season ? season.name : "Select a season";
});

async function fetchEpisodes() {
  if (selectedSeason.value === null || !props.showId) return;
  isLoadingEpisodes.value = true;
  episodes.value = [];
  try {
    const url = `https://imdb.6683549.xyz/titles/${props.showId}/episodes?season=${selectedSeason.value}`;
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch episodes: ${response.status}`);
    const data = await response.json();

    let eps = [];

    for (const episode of data.episodes) {
      let air_date = 'unknown';
      if (episode.releaseDate) {
        const { year, month, day } = episode.releaseDate;
        const d = new Date(year, month - 1, day);
        air_date = isNaN(d) ? null : d.toDateString();
      }
      eps.push({
        air_date: air_date,
        episode_number: episode.episodeNumber,
        id: episode.id,
        name: episode.title || `Episode ${episode.episodeNumber}`,
        overview: episode.plot || null,
        production_code: null,
        season_number: parseInt(episode.season),
        show_id: props.showId,
        still_path: episode.primaryImage?.url ?? null,
        vote_average: episode.rating?.aggregateRating ?? 0,
        vote_count: episode.rating?.voteCount ?? 0,
      });
    }

    if (eps.length > 0) episodes.value = eps;
  } catch (error) {
    console.error("Error fetching episodes:", error);
  } finally {
    isLoadingEpisodes.value = false;
  }
}

function toggleSeasonDropdown() {
  isSeasonDropdownOpen.value = !isSeasonDropdownOpen.value;
}
function selectSeason(seasonNumber) {
  selectedSeason.value = seasonNumber;
  isSeasonDropdownOpen.value = false;
}

const handleClickOutside = (e) => {
  const dropdown = document.querySelector(".season-dropdown");
  if (dropdown && !dropdown.contains(e.target)) {
    isSeasonDropdownOpen.value = false;
  }
};

const playEpisode = (episode, event) => {
  let base_url = 'https://vidsrc.6683549.xyz/embed';

  let video_url = base_url + '/tv/' + props.showId + '/'+episode.season_number+'-'+episode.episode_number+'?autonext=1';

  if (event.ctrlKey || event.metaKey) {
    window.open(video_url);
  } else {
    createLightbox(video_url);
  }
}

function createLightbox(iframeSrc) {
  // Create lightbox container
  const lightbox = document.createElement('div');
  Object.assign(lightbox.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '9999',
  });

  // Create iframe
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    width: '90%',
    height: '90%',
    border: 'none',
    borderRadius: '8px',
  });
  iframe.allowFullscreen = true;
  iframe.src = iframeSrc;

  // Append iframe to lightbox
  lightbox.appendChild(iframe);

  // Close lightbox when clicking outside iframe
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      lightbox.remove();
    }
  });

  // Close lightbox when ESC is pressed
  document.addEventListener('keyup', function (event) {
    if (event.key === "Escape") {
      lightbox.remove();
    }
  });

  // Add lightbox to the body
  document.body.appendChild(lightbox);
}

onMounted(() => {
  if (props.seasons && props.seasons.length > 0) {
    selectedSeason.value = props.seasons[0].season_number;
  }
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

watch(selectedSeason, fetchEpisodes, { immediate: true });
</script>

<style scoped>
.netflix-dropdown-menu {
  background-color: #1a1a1a;
}
</style>
