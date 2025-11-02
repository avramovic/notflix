<template>
  <div v-if="seasons && seasons.length > 0" class="mt-10">
    <div class="flex justify-between items-center mb-4 cursor-pointer">
      <h2 class="text-2xl font-semibold">Episodes</h2>
      <div v-if="seasons.length > 1" class="relative">
        <select
          v-model="selectedSeason"
          class="w-full bg-netflix-gray-250 border border-netflix-gray-100 text-white py-2 px-4 rounded flex justify-between items-center font-semibold text-lg cursor-pointer"
        >
          <option
            v-for="season in seasons.sort((a, b) => Number(a.season_number) - Number(b.season_number))"
            :key="season.id"
            :value="season.season_number"
            class="cursor-pointer"
          >
            {{ season.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="isLoadingEpisodes" class="text-center p-4">
      Loading episodes...
    </div>

    <div v-else class="space-y-4 max-h-96 overflow-y-auto pr-2">
      <div
        v-for="episode in episodes"
        :key="episode.id"
        class="flex items-center gap-4 p-2 rounded hover:bg-white/10 cursor-pointer"
        @click="playEpisode(episode, $event)"
      >
        <span class="text-xl font-bold text-gray-400">{{
          episode.episode_number
        }}</span>
        <img
          :src="`${episode.still_path}`"
          class="w-40 h-24 object-cover rounded flex-shrink-0"
        />
        <div class="flex-1">
          <h3 class="font-bold">{{ episode.name }}</h3>
          <p class="text-sm text-gray-300 line-clamp-2">
            {{ episode.overview }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { fetchTVShowSeasonDetails } from "@/api/tmdb";

const props = defineProps({
  tvId: { type: Number, required: true },
  seasons: { type: Array, default: () => [] },
});

const playEpisode = (episode, event) => {
  let base_url = 'https://proxy.garageband.rocks/embed';

  let video_url = base_url + '/tv/' + props.tvId + '/'+episode.season_number+'-'+episode.episode_number+'?autonext=1';

  if (event.ctrlKey || event.metaKey) {
    window.open(video_url);
  } else {
    createLightbox(video_url);
  }
}

const createLightbox = (iframeSrc) => {
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


const isLoadingEpisodes = ref(false);

const firstRealSeason = props.seasons?.find((s) => s.season_number > 0);
const selectedSeason = ref(firstRealSeason?.season_number || 1);
const episodes = ref([]);

const fetchEpisodes = async (seasonNumber) => {
  if (!props.tvId || !seasonNumber) return;
  isLoadingEpisodes.value = true;
  try {
    const seasonDetails = await fetchTVShowSeasonDetails(
      props.tvId,
      seasonNumber
    );
    episodes.value = seasonDetails.episodes || [];
  } catch (error) {
    console.error(`Error fetching episodes for season ${seasonNumber}:`, error);
    episodes.value = [];
  } finally {
    isLoadingEpisodes.value = false;
  }
};
watch(selectedSeason, (newSeason) => {
  fetchEpisodes(newSeason);
});

onMounted(() => {
  fetchEpisodes(selectedSeason.value);
});




</script>
