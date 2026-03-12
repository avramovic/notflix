<template>
  <div
    class="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
    @click.stop="close"
  >
    <div
      v-if="!isLoading && details"
      ref="modalScrollContainer"
      class="content-modal w-full max-h-full overflow-y-auto"
    >
      <div
        class="relative w-full lg:max-w-4xl xl:max-w-4xl 2xl:max-w-4xl 3xl:max-w-7xl mx-auto my-8 bg-netflix-bg-gray rounded-lg shadow-lg overflow-hidden"
        @click.stop
      >
        <button
          @click="close"
          class="absolute right-4 top-4 z-[9999] bg-netflix-bg-gray/80 backdrop-blur-sm rounded-full p-2 hover:bg-white/20 transition-colors"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 text-white">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              fill="currentColor"
            />
          </svg>
        </button>

        <ModalVideoPlayer
          :details="details"
          :trailer-key="trailerKey"
          :logo-path="logoPath"
          :is-in-my-list="isInMyList"
          @toggle-my-list="toggleMyListInModal"
        />

        <div class="p-8 text-white">
          <ModalDetails
            :details="details"
            :cast="cast"
            :content-rating="contentRating"
          />

          <ModalEpisodes
            v-if="currentContentType === 'tv'"
            :tv-id="currentContentId"
            :seasons="details.seasons"
          />

          <ModalSimilarContent
            :similar-content="similarContent"
            :logos="similarLogos"
            :main-content-rating="contentRating"
            @content-click="handleSimilarContentClick"
          />
        </div>
      </div>
    </div>

    <div v-else>
      <div
        class="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useContentModalData } from "@/composables/useContentModalData";
import { navigateToContentRoute } from "@/utils/contentRoutes";

import ModalVideoPlayer from "./ModalVideoPlayer.vue";
import ModalDetails from "./ModalDetails.vue";
import ModalEpisodes from "./ModalEpisodes.vue";
import ModalSimilarContent from "./ModalSimilarContent.vue";

const props = defineProps({
  id: { type: [String, Number], required: true },
  contentType: { type: String, required: true },
});

const emit = defineEmits(["close"]);
const router = useRouter();
const userStore = useUserStore();
const modalScrollContainer = ref(null);
const modalState = reactive({
  id: props.id,
  contentType: props.contentType,
});

watch(
  () => [props.id, props.contentType],
  ([newId, newContentType]) => {
    modalState.id = newId;
    modalState.contentType = newContentType;
  }
);

const {
  isLoading,
  details,
  cast,
  trailerKey,
  logoPath,
  similarContent,
  contentRating,
  similarLogos,
} = useContentModalData(modalState);

const currentContentId = computed(() => modalState.id);
const currentContentType = computed(() => modalState.contentType);

const isInMyList = computed(() =>
  details.value
    ? userStore.isItemInMyList(details.value, currentContentType.value)
    : false
);

const toggleMyListInModal = () => {
  if (details.value) {
    userStore.toggleListItem(details.value, currentContentType.value);
  }
};

const getMediaType = (item) =>
  item.media_type || (item.first_air_date ? "tv" : "movie");

async function handleSimilarContentClick(item) {
  if (!item?.id) return;

  modalState.id = item.id;
  modalState.contentType = getMediaType(item);

  await navigateToContentRoute(router, item, { replace: true });

  await nextTick();
  modalScrollContainer.value?.scrollTo({ top: 0, behavior: "smooth" });
}

const close = () => emit("close");
</script>

<style scoped>
.content-modal::-webkit-scrollbar {
  display: none;
}
.content-modal {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
