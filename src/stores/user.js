import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { fetchMovieDetails, fetchTVShowDetails } from "@/api/tmdb";

export const useUserStore = defineStore("user", () => {
  const STORAGE_KEYS = {
    profiles: "notflix:profiles",
    activeProfileId: "notflix:activeProfileId",
    legacyActiveProfileId: "netflix_clone_active_profile_id",
    myLists: "notflix:myLists",
    ratings: "netflix-ratings",
  };

  // State
  const user = ref(null);
  const isGuest = ref(true);
  const isLoading = ref(true);
  const error = ref(null);
  const currentProfile = ref(null);
  const profiles = ref([]);
  const profilesLoaded = ref(false);
  const myLists = ref({});
  const ratings = ref(
    JSON.parse(localStorage.getItem(STORAGE_KEYS.ratings)) || {}
  );

  const isLoggedIn = computed(() => !!user.value);

  const currentMyList = computed(() => {
    if (!currentProfile.value) return [];
    return myLists.value[currentProfile.value.id] || [];
  });

  function isSameListItem(listItem, item, contentType) {
    return (
      String(listItem?.id) === String(item?.id) &&
      inferContentType(listItem, listItem?.media_type) ===
        inferContentType(item, contentType)
    );
  }

  function getMatchingListItems(item, contentType) {
    if (!currentMyList.value || !item) return [];

    return currentMyList.value.filter((listItem) =>
      isSameListItem(listItem, item, contentType)
    );
  }

  const isItemInMyList = (item, contentType) => {
    return getMatchingListItems(item, contentType).length > 0;
  };

  const defaultGuestProfiles = [
    {
      id: "guest",
      name: "Guest",
      avatar: "/avatars/classic/Classic3.png",
      settings: { autoplay: true, maturityLevel: "all" },
    },
    {
      id: "me",
      name: "Me",
      avatar: "/avatars/classic/Classic1.png",
      settings: { autoplay: true, maturityLevel: "all" },
    },
  ];

  const availableAvatars = [
    "/avatars/classic/Classic1.png",
    "/avatars/classic/Classic2.png",
    "/avatars/classic/Classic3.png",
    "/avatars/classic/Classic4.png",
  ];

  function readStorage(key, fallback) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (err) {
      console.error(`Failed to read localStorage key "${key}":`, err);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function persistProfiles() {
    writeStorage(STORAGE_KEYS.profiles, profiles.value);
  }

  function persistMyLists() {
    writeStorage(STORAGE_KEYS.myLists, myLists.value);
  }

  function buildListItemId(item, contentType) {
    return `${contentType}:${item.id}`;
  }

  function normalizeContentTypeValue(value) {
    if (typeof value !== "string") {
      return null;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue === "tv" || normalizedValue.startsWith("tv")) {
      return "tv";
    }

    if (normalizedValue === "movie" || normalizedValue.includes("movie")) {
      return "movie";
    }

    return null;
  }

  function inferContentType(item, fallbackContentType = "movie") {
    const normalizedFallback = normalizeContentTypeValue(fallbackContentType);
    if (normalizedFallback) {
      return normalizedFallback;
    }

    const candidateType =
      item?.media_type ||
      item?.contentType ||
      (item?.first_air_date ? "tv" : null) ||
      (item?.name && !item?.title ? "tv" : null) ||
      fallbackContentType;

    return normalizeContentTypeValue(candidateType) || "movie";
  }

  function createProfileId() {
    return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function sanitizeAvatarUrl(avatarUrl) {
    if (!avatarUrl || avatarUrl.includes("pravatar.cc")) {
      const randomIndex = Math.floor(Math.random() * availableAvatars.length);
      return availableAvatars[randomIndex];
    }
    return avatarUrl;
  }

  function normalizeProfile(profile, fallbackId = createProfileId()) {
    return {
      id: profile?.id || fallbackId,
      name: profile?.name || "Profile",
      avatar: sanitizeAvatarUrl(profile?.avatar),
      settings: {
        autoplay: true,
        maturityLevel: "all",
        ...(profile?.settings || {}),
      },
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: profile?.updatedAt || null,
    };
  }

  function getPersistedProfiles() {
    const storedProfiles = readStorage(STORAGE_KEYS.profiles, []);
    if (!Array.isArray(storedProfiles) || storedProfiles.length === 0) {
      return defaultGuestProfiles.map((profile) => normalizeProfile(profile, profile.id));
    }

    return storedProfiles.map((profile) =>
      normalizeProfile(profile, profile.id || createProfileId())
    );
  }

  function getStoredActiveProfileId() {
    return (
      localStorage.getItem(STORAGE_KEYS.activeProfileId) ||
      localStorage.getItem(STORAGE_KEYS.legacyActiveProfileId)
    );
  }

  function persistActiveProfileId(profileId) {
    localStorage.setItem(STORAGE_KEYS.activeProfileId, profileId);
    localStorage.setItem(STORAGE_KEYS.legacyActiveProfileId, profileId);
  }

  function clearActiveProfileId() {
    localStorage.removeItem(STORAGE_KEYS.activeProfileId);
    localStorage.removeItem(STORAGE_KEYS.legacyActiveProfileId);
  }

  function normalizeListItem(item, contentType) {
    const normalizedContentType = inferContentType(item, contentType);
    return {
      docId: buildListItemId(item, normalizedContentType),
      id: item.id,
      title: item.title || null,
      name: item.name || null,
      poster_path: item.poster_path || null,
      backdrop_path: item.backdrop_path || null,
      media_type: normalizedContentType,
      overview: item.overview || null,
      vote_average: item.vote_average || 0,
      release_date: item.release_date || item.first_air_date || null,
      first_air_date: item.first_air_date || null,
      genre_ids: item.genre_ids || [],
      addedAt: new Date().toISOString(),
    };
  }

  async function enrichListItem(item, contentType) {
    const normalizedItem = normalizeListItem(item, contentType);

    if (normalizedItem.overview) {
      return normalizedItem;
    }

    try {
      const fetchDetails =
        normalizedItem.media_type === "tv" ? fetchTVShowDetails : fetchMovieDetails;
      const details = await fetchDetails(normalizedItem.id);

      return {
        ...normalizedItem,
        overview: details?.overview || normalizedItem.overview,
      };
    } catch (error) {
      console.error(
        `Failed to enrich favorite item ${normalizedItem.media_type}:${normalizedItem.id}:`,
        error
      );
      return normalizedItem;
    }
  }

  function normalizeStoredLists(lists) {
    if (!lists || typeof lists !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(lists).map(([profileId, items]) => {
        const normalizedItemsMap = new Map();

        if (Array.isArray(items)) {
          items
            .filter((item) => item?.id)
            .forEach((item) => {
              const normalizedItem = normalizeListItem(
                item,
                item.media_type || item.contentType
              );
              normalizedItemsMap.set(normalizedItem.docId, {
                ...normalizedItem,
                addedAt: item.addedAt || normalizedItem.addedAt,
              });
            });
        }

        return [profileId, [...normalizedItemsMap.values()]];
      })
    );
  }

  async function toggleListItem(item, contentType) {
    if (!user.value || !currentProfile.value) {
      throw new Error("No user or profile selected.");
    }

    const normalizedContentType = inferContentType(item, contentType);
    const matchingItems = getMatchingListItems(item, normalizedContentType);
    const alreadyInList = matchingItems.length > 0;

    if (alreadyInList) {
      await removeMatchingListItems(item, normalizedContentType);
      console.log("Removed from My List:", item.title || item.name);
    } else {
      const itemToAdd = await enrichListItem(item, normalizedContentType);
      await addToMyList(itemToAdd);
      console.log("Added to My List:", item.title || item.name);
    }
  }

  function clearError() {
    error.value = null;
  }

  async function init() {
    isLoading.value = true;
    isGuest.value = true;
    user.value = {
      uid: "guest",
      email: "nobody@notflix.xyz",
      displayName: "Guest",
      photoURL: "",
    };

    await loadProfiles();
    isLoading.value = false;
  }

  async function loadProfiles() {
    profilesLoaded.value = false;
    if (!user.value) {
      profiles.value = [];
      currentProfile.value = null;
      clearActiveProfileId();
      profilesLoaded.value = true;
      return;
    }

    try {
      profiles.value = getPersistedProfiles();
      persistProfiles();

      const activeProfileId = getStoredActiveProfileId();
      let profileToSet = null;

      if (profiles.value.length > 0) {
        if (activeProfileId) {
          profileToSet = profiles.value.find((p) => p.id === activeProfileId);
        }
        if (!profileToSet) {
          profileToSet = profiles.value[0];
        }
      }

      if (profileToSet) {
        await setActiveProfile(profileToSet);
      } else {
        currentProfile.value = null;
        clearActiveProfileId();
        console.warn(
          "No profiles found or no active profile could be determined. currentProfile set to null."
        );
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
      profiles.value = [];
      currentProfile.value = null;
      clearActiveProfileId();
    } finally {
      profilesLoaded.value = true;
    }
  }

  async function signInAsGuest() {
    clearError();
    const authUser = {
      uid: "guest",
      email: "nobody@notflix.xyz",
      displayName: "Guest",
      photoURL: "",
    };
    user.value = authUser;
    isGuest.value = true;
    await loadProfiles();
    return authUser;
  }

  async function logout() {
    currentProfile.value = null;
    clearActiveProfileId();
  }

  async function addProfile(profile) {
    if (!user.value) return;
    const newProfile = normalizeProfile(profile);
    profiles.value.push(newProfile);
    myLists.value[newProfile.id] = myLists.value[newProfile.id] || [];
    persistProfiles();
    persistMyLists();

    if (!currentProfile.value) {
      await setActiveProfile(newProfile);
    }

    return newProfile.id;
  }

  async function updateProfileData(profileId, updatedData) {
    if (!user.value) return;
    const index = profiles.value.findIndex((p) => p.id === profileId);
    if (index === -1) {
      throw new Error(`Profile with id "${profileId}" not found.`);
    }

    profiles.value[index] = normalizeProfile({
      ...profiles.value[index],
      ...updatedData,
      id: profileId,
      updatedAt: new Date().toISOString(),
    }, profileId);

    if (currentProfile.value?.id === profileId) {
      currentProfile.value = profiles.value[index];
    }

    persistProfiles();
  }

  async function deleteProfile(profileId) {
    if (!user.value) return;
    profiles.value = profiles.value.filter((p) => p.id !== profileId);
    delete myLists.value[profileId];
    persistProfiles();
    persistMyLists();

    if (currentProfile.value?.id === profileId) {
      const fallbackProfile = profiles.value[0] || null;
      if (fallbackProfile) {
        await setActiveProfile(fallbackProfile);
      } else {
        currentProfile.value = null;
        clearActiveProfileId();
      }
    }
  }

  async function setActiveProfile(profile) {
    if (!profile || !profile.id) {
      console.error(
        "Attempted to set an invalid or undefined profile. Profile data:",
        profile
      );
      currentProfile.value = null;
      clearActiveProfileId();
      return false;
    }
    try {
      currentProfile.value = profile;
      persistActiveProfileId(profile.id);
      await loadProfileData(profile.id);
      return true;
    } catch (error) {
      console.error("Error setting active profile:", error);
      currentProfile.value = null;
      clearActiveProfileId();
      return false;
    }
  }

  async function loadProfileData(profileId) {
    if (!user.value) return;

    const storedLists = readStorage(STORAGE_KEYS.myLists, {});
    myLists.value = normalizeStoredLists(storedLists);
    myLists.value[profileId] = Array.isArray(myLists.value[profileId])
      ? myLists.value[profileId]
      : [];
    persistMyLists();
  }

  async function addToMyList(item) {
    if (!user.value || !currentProfile.value) return;

    const profileId = currentProfile.value.id;
    const normalizedItem = {
      ...(await enrichListItem(item, item.media_type || item.contentType)),
      addedAt: item.addedAt || new Date().toISOString(),
    };

    if (!myLists.value[profileId]) {
      myLists.value[profileId] = [];
    }

    myLists.value[profileId] = [
      ...myLists.value[profileId].filter(
        (listItem) => !isSameListItem(listItem, normalizedItem, normalizedItem.media_type)
      ),
      normalizedItem,
    ];

    persistMyLists();
    return normalizedItem.docId;
  }

  async function removeMatchingListItems(item, contentType) {
    if (!user.value || !currentProfile.value) return;

    const profileId = currentProfile.value.id;
    if (!myLists.value[profileId]) {
      return;
    }

    myLists.value[profileId] = myLists.value[profileId].filter(
      (listItem) => !isSameListItem(listItem, item, contentType)
    );
    persistMyLists();
  }

  async function removeFromMyList(listItemId) {
    if (!user.value || !currentProfile.value) return;
    if (typeof listItemId !== "string" || listItemId.trim() === "") {
      const errMsg = "Invalid list item ID provided for removal.";
      console.error(errMsg, listItemId);
      throw new Error(errMsg);
    }

    const profileId = currentProfile.value.id;
    if (myLists.value[profileId]) {
      myLists.value[profileId] = myLists.value[profileId].filter(
        (item) => item.docId !== listItemId
      );
      persistMyLists();
    }
  }

  function setRating(contentId, rating) {
    if (rating === null) {
      delete ratings.value[contentId];
    } else {
      ratings.value[contentId] = rating;
    }
    localStorage.setItem(STORAGE_KEYS.ratings, JSON.stringify(ratings.value));
  }

  async function signUp() {
    return signInAsGuest();
  }

  async function signIn() {
    return signInAsGuest();
  }

  return {
    user,
    isGuest,
    isLoading,
    error,
    profiles,
    currentProfile,
    defaultGuestProfiles,

    isLoggedIn,
    currentMyList,

    isItemInMyList,

    init,
    signUp,
    signIn,
    signInAsGuest,
    logout,
    clearError,
    loadProfiles,
    addProfile,
    updateProfileData,
    deleteProfile,
    setActiveProfile,
    addToMyList,
    removeMatchingListItems,
    removeFromMyList,

    toggleListItem,
    availableAvatars,

    ratings,
    setRating,
    profilesLoaded, // Expose the new flag
  };
});
