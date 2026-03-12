<template>
  <div class="flex flex-col gap-3 mb-6">
    <button
      class="w-full bg-white text-black py-3 rounded-md flex items-center justify-center font-semibold cursor-pointer"
      @click="playContent(content, $event)"
    >
      <svg
        fill="#000000"
        version="1.1"
        class="w-4 h-4 mr-3"
        viewBox="0 0 512 512"
      >
        <path
          d="M500.203,236.907L30.869,2.24c-6.613-3.285-14.443-2.944-20.736,0.939C3.84,7.083,0,13.931,0,21.333v469.333 c0,7.403,3.84,14.251,10.133,18.155c3.413,2.112,7.296,3.179,11.2,3.179c3.264,0,6.528-0.747,9.536-2.24l469.333-234.667 C507.435,271.467,512,264.085,512,256S507.435,240.533,500.203,236.907z"
        ></path>
      </svg>
      Play
    </button>
    <button
      :class="[
        'w-full py-3 rounded-md flex items-center justify-center font-semibold cursor-pointer transition-colors',
        isFavorite
          ? 'bg-red-600/20 text-red-500 border border-red-500'
          : 'bg-netflix-gray-150 text-white border border-transparent',
      ]"
      @click="toggleFavorite"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-5 w-5 mr-2"
        :fill="isFavorite ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M12 20.5s-7-4.35-7-10.13C5 7.41 7.24 5.5 9.86 5.5c1.45 0 2.83.67 3.64 1.73.81-1.06 2.19-1.73 3.64-1.73C19.76 5.5 22 7.41 22 10.37 22 16.15 15 20.5 15 20.5h-3z"
        />
      </svg>
      {{ isFavorite ? "Favorited" : "Favorite" }}
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useUserStore } from "@/stores/user";

const props = defineProps({
  content: { type: Object, required: true },
});

const userStore = useUserStore();
const getMediaType = (item) =>
  item.media_type || (item.first_air_date ? "tv" : "movie");

const isFavorite = computed(() =>
  userStore.isItemInMyList(props.content, getMediaType(props.content))
);

function toggleFavorite() {
  userStore.toggleListItem(props.content, getMediaType(props.content));
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

</script>