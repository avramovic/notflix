<template>
  <router-view :route="backgroundViewRoute" v-slot="{ Component }">
    <component :is="Component" />
  </router-view>

  <ContentModal
    v-if="activeModalContent"
    :id="activeModalContent.id"
    :content-type="activeModalContent.contentType"
    @close="closeContentModal"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ContentModal from "@/components/ContentModal/ContentModal.vue";
import { useMovieStore } from "@/stores/movieStore";
import {
  getPathContentPayload,
  getRouteContentPayload,
  isContentDetailsRoute,
} from "@/utils/contentRoutes";

const route = useRoute();
const router = useRouter();
const movieStore = useMovieStore();
const backgroundRoutePath = ref(null);
const browserPathname = ref(window.location.pathname);

movieStore.fetchGenres();

const syncBrowserPathname = () => {
  browserPathname.value = window.location.pathname;
};

watch(
  () => route.fullPath,
  () => {
    syncBrowserPathname();

    if (!isContentDetailsRoute(route)) {
      backgroundRoutePath.value = route.fullPath;
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener("popstate", syncBrowserPathname);
});

const activeModalContent = computed(
  () => getRouteContentPayload(route) || getPathContentPayload(browserPathname.value)
);

const backgroundViewRoute = computed(() => {
  if (!activeModalContent.value) {
    return route;
  }

  return router.resolve(backgroundRoutePath.value || { name: "Home" });
});

watch(
  activeModalContent,
  (content) => {
    document.body.style.overflow = content ? "hidden" : "";
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("popstate", syncBrowserPathname);
  document.body.style.overflow = "";
});

async function closeContentModal() {
  if (!activeModalContent.value) return;

  if (backgroundRoutePath.value) {
    await router.back();
    return;
  }

  await router.replace({ name: "Home" });
}
</script>
