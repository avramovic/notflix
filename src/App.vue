<template>
  <router-view :route="backgroundViewRoute" v-slot="{ Component }">
    <component :is="Component" />
  </router-view>

  <FavoritesOverlay
    v-if="isFavoritesOverlayRoute"
    @close="closeFavoritesOverlay"
  />

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
import FavoritesOverlay from "@/components/FavoritesOverlay.vue";
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
const isFavoritesOverlayPath = (path) => path === "/favorites";
const isOverlayRoutePath = (path) =>
  isFavoritesOverlayPath(path) || Boolean(getPathContentPayload(path));

movieStore.fetchGenres();

const syncBrowserPathname = () => {
  browserPathname.value = window.location.pathname;
};

watch(
  () => route.fullPath,
  () => {
    syncBrowserPathname();

    if (!isOverlayRoutePath(route.path)) {
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
const isFavoritesOverlayRoute = computed(
  () =>
    isFavoritesOverlayPath(route.path) || isFavoritesOverlayPath(browserPathname.value)
);

const backgroundViewRoute = computed(() => {
  if (!activeModalContent.value && !isFavoritesOverlayRoute.value) {
    return route;
  }

  return router.resolve(backgroundRoutePath.value || { name: "Home" });
});

watch(
  () => Boolean(activeModalContent.value || isFavoritesOverlayRoute.value),
  (isOverlayOpen) => {
    document.body.style.overflow = isOverlayOpen ? "hidden" : "";
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

async function closeFavoritesOverlay() {
  if (!isFavoritesOverlayRoute.value) return;

  if (backgroundRoutePath.value) {
    await router.back();
    return;
  }

  await router.replace({ name: "Home" });
}
</script>
