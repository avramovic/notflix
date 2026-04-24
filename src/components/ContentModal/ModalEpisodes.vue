<template>
  <div v-if="seasons && seasons.length > 0" class="mt-10">
    <div class="flex justify-between items-center mb-4 cursor-pointer">
      <h2 class="text-2xl font-semibold text-white">Episodes</h2>
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
        <div class="relative w-40 h-24 flex-shrink-0">
          <img
            :src="`${episode.still_path}`"
            :class="['w-full h-full object-cover rounded', { grayscale: episodeAvailability[episode.id] === false }]"
          />
          <NotAvailableStamp v-if="episodeAvailability[episode.id] === false" size="sm" />
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-white">{{ episode.name }}</h3>
          <p class="text-sm text-gray-300 line-clamp-2">
            {{ episode.overview }}
          </p>
          <p class="text-xs text-gray-500 line-clamp-2 mt-2">
            Air date: {{ episode.air_date }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { fetchTVShowSeasonDetails } from "@/api/tmdb";
import { checkEpisodesAvailability } from "@/api/availability";
import NotAvailableStamp from "@/components/common/NotAvailableStamp.vue";

const props = defineProps({
  tvId: { type: [String, Number], required: true },
  seasons: { type: Array, default: () => [] },
});

const playEpisode = (episode, event) => {
  let base_url = 'https://vidsrc.6683549.xyz/embed';

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
const episodeAvailability = ref({});

const firstRealSeason = props.seasons?.find((s) => s.season_number > 0);
const selectedSeason = ref(firstRealSeason?.season_number || 1);
const episodes = ref([]);

let seasonToken = 0;

const fetchEpisodes = async (seasonNumber) => {
  if (!props.tvId || !seasonNumber) return;
  const myToken = ++seasonToken;
  episodeAvailability.value = {};
  isLoadingEpisodes.value = true;
  try {
    const seasonDetails = await fetchTVShowSeasonDetails(
      props.tvId,
      seasonNumber
    );
    if (myToken !== seasonToken) return;
    episodes.value = seasonDetails.episodes || [];
    checkEpisodesAvailability(props.tvId, episodes.value).then(map => {
      if (myToken === seasonToken) episodeAvailability.value = map;
    });
  } catch (error) {
    console.error(`Error fetching episodes for season ${seasonNumber}:`, error);
    if (myToken === seasonToken) episodes.value = [];
  } finally {
    if (myToken === seasonToken) isLoadingEpisodes.value = false;
  }
};
watch(selectedSeason, (newSeason) => {
  fetchEpisodes(newSeason);
});

onMounted(() => {
  fetchEpisodes(selectedSeason.value);
});




</script>
