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
      class="hidden w-full bg-netflix-gray-150 text-white py-3 rounded-md flex items-center justify-center font-semibold"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clip-rule="evenodd"
        />
      </svg>
      Add to List
    </button>
  </div>
</template>

<script setup>

const props = defineProps({
  content: { type: Object, required: true },
});

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