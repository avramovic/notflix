<template>
  <div class="relative w-full aspect-video bg-black">
    <img
      v-if="!trailerKey || trailerEnded"
      :src="`${details.backdrop_path}`"
      alt="Backdrop"
      class="w-full h-full object-cover"
    />

    <div
      v-if="trailerKey && !trailerEnded"
      class="absolute inset-0 overflow-hidden pointer-events-none"
    >
      <div ref="playerEl" class="relative w-full h-full"></div>
    </div>

    <div
      class="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
      style="
        background: linear-gradient(
          to top,
          rgba(20, 20, 20, 1) 0%,
          rgba(20, 20, 20, 0) 100%
        );
      "
    ></div>

    <div class="absolute bottom-0 left-0 right-0 p-8">
      <img
        v-if="logoPath"
        :src="`${logoPath}`"
        alt="Title Logo"
        class="lg:max-h-20 w-auto mb-6"
      />
      <h1 v-else class="text-5xl font-bold mb-4">
        {{ details.title || details.name }}
      </h1>
      <div class="flex items-center gap-3">
        <button
          class="bg-white text-black hover:bg-white/90 lg:px-7 lg:py-1.5 xl:px-7 2xl:px-9 xl:py-1.5 2xl:py-2 3xl:py-3 rounded flex items-center font-semibold cursor-pointer"
          @click="playContent(details, $event)"
        >
          <svg fill="#000000" class="w-6 h-6 mr-2" viewBox="0 0 512 512">
            <path
              d="M500.203,236.907L30.869,2.24c-6.613-3.285-14.443-2.944-20.736,0.939C3.84,7.083,0,13.931,0,21.333v469.333 c0,7.403,3.84,14.251,10.133,18.155c3.413,2.112,7.296,3.179,11.2,3.179c3.264,0,6.528-0.747,9.536-2.24l469.333-234.667 C507.435,271.467,512,264.085,512,256S507.435,240.533,500.203,236.907z"
            ></path>
          </svg>
          <span class="text-xl font-semibold">Play</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  watch,
  onBeforeUnmount,
  onMounted,
  computed,
  nextTick,
} from "vue";
import { useUserStore } from "@/stores/user";

const props = defineProps({
  details: Object,
  trailerKey: String,
  logoPath: String,
  isInMyList: Boolean,
});

const emit = defineEmits(["toggleMyList"]);
const userStore = useUserStore();

const playerEl = ref(null);
let player = null;
let videoTimeIntervalId = null;
const isMuted = ref(true);
const trailerEnded = ref(false);

const isRatingPopupOpen = ref(false);

const getCurrentRating = computed(() => {
  return userStore.ratings[props.details.id] || null;
});

function selectRating(rating) {
  const newRating = getCurrentRating.value === rating ? null : rating;
  userStore.setRating(props.details.id, newRating);
  isRatingPopupOpen.value = false;
}

function playContent(title, event) {
  let imdb_id = title.id;
  let media_type = title.media_type;
  let base_url = 'https://vidsrc.6683549.xyz/embed';

  let video_url = base_url + '/movie/' + imdb_id;
  if (media_type === 'tv') {
    video_url = base_url + '/tv/' + imdb_id + '?autonext=1';
  }

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

function handleMouseLeave() {
  setTimeout(() => {
    isRatingPopupOpen.value = false;
  }, 100);
}

const loadYouTubeAPI = () =>
  new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });

const createPlayer = async () => {
  if (!props.trailerKey || !playerEl.value) return;
  await loadYouTubeAPI();
  player = new window.YT.Player(playerEl.value, {
    videoId: props.trailerKey,
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      mute: 1,
      playsinline: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
};

const onPlayerReady = (event) => {
  player = event.target;
  player.mute();
  isMuted.value = true;
  player.playVideo();
  monitorVideoTime();
};

const onPlayerStateChange = (event) => {
  if (event.data === window.YT.PlayerState.ENDED) {
    trailerEnded.value = true;
    if (videoTimeIntervalId) clearInterval(videoTimeIntervalId);
  }
};

const onPlayerError = () => {
  trailerEnded.value = true;
};

const monitorVideoTime = () => {
  if (videoTimeIntervalId) clearInterval(videoTimeIntervalId);
  videoTimeIntervalId = setInterval(() => {
    if (
      !player ||
      typeof player.getDuration !== "function" ||
      !player.getCurrentTime
    ) {
      clearInterval(videoTimeIntervalId);
      return;
    }
    const duration = player.getDuration();
    if (duration > 0 && duration - player.getCurrentTime() < 1.5) {
      trailerEnded.value = true;
      player.stopVideo();
      clearInterval(videoTimeIntervalId);
    }
  }, 1000);
};

const toggleMute = () => {
  if (!player) return;
  isMuted.value ? player.unMute() : player.mute();
  isMuted.value = !isMuted.value;
};

const replayTrailer = () => {
  trailerEnded.value = false;
  nextTick(() => {
    if (player) player.destroy();
    createPlayer();
  });
};

watch(
  () => props.trailerKey,
  (newKey) => {
    if (newKey) {
      replayTrailer();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (player) player.destroy();
  if (videoTimeIntervalId) clearInterval(videoTimeIntervalId);
});
</script>

<style scoped>
.rating-popup-enter-active,
.rating-popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.rating-popup-enter-from,
.rating-popup-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}
.origin-center {
  transform-origin: center;
}
</style>
