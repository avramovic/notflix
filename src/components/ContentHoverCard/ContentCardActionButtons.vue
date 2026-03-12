<template>
  <div class="flex items-center gap-2 mb-3">
    <button
      @click="$emit('play')"
      class="bg-white text-black rounded-full p-3 hover:bg-white/90 transition-colors cursor-pointer"
      aria-label="Play"
    >
      <svg
        fill="#000000"
        version="1.1"
        class="w-6 h-6 pl-1"
        viewBox="0 0 512 512"
      >
        <path
          d="M500.203,236.907L30.869,2.24c-6.613-3.285-14.443-2.944-20.736,0.939C3.84,7.083,0,13.931,0,21.333v469.333 c0,7.403,3.84,14.251,10.133,18.155c3.413,2.112,7.296,3.179,11.2,3.179c3.264,0,6.528-0.747,9.536-2.24l469.333-234.667 C507.435,271.467,512,264.085,512,256S507.435,240.533,500.203,236.907z"
        ></path>
      </svg>
    </button>

    <button
      @click="$emit('toggleMyList')"
      :class="[
        'border border-2 rounded-full p-2 transition-colors cursor-pointer',
        isInMyList
          ? 'bg-red-600/20 border-red-500 text-red-500 hover:bg-red-600/30'
          : 'bg-white/8 border-gray-400 text-white hover:border-white',
      ]"
      :aria-label="isInMyList ? 'Remove from favorites' : 'Add to favorites'"
      :title="isInMyList ? 'Remove from favorites' : 'Add to favorites'"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-8 w-8"
        :fill="isInMyList ? 'currentColor' : 'none'"
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

    <div class="ml-auto">
      <button
        @click="$emit('expand')"
        class="border border-2 bg-white/8 border-gray-400 text-white hover:border-white rounded-full p-2 transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8"
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
    </div>
  </div>
</template>

<script setup>
defineProps({
  isInMyList: Boolean,
  isThumbsUp: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["play", "toggleMyList", "thumbsUp", "expand"]);
</script>
