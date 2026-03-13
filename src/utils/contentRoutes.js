export const CONTENT_ROUTE_NAMES = {
  movie: "MovieDetails",
  tv: "TVDetails",
};

export function getContentPath(contentType, id) {
  const normalizedType = normalizeContentType(contentType);
  const pathSegment = normalizedType === "tv" ? "tv" : "movies";
  return `/${pathSegment}/${String(id)}`;
}

export function normalizeContentType(contentType) {
  return contentType === "tv" ? "tv" : "movie";
}

export function inferContentType(content) {
  if (!content) return "movie";

  return normalizeContentType(
    content.contentType ||
      content.media_type ||
      (content.first_air_date ? "tv" : "movie")
  );
}

export function getContentRouteLocation(contentType, id) {
  return {
    path: getContentPath(contentType, id),
  };
}

export function getContentRouteFromItem(content) {
  if (!content?.id) return null;

  return getContentRouteLocation(inferContentType(content), content.id);
}

export async function navigateToContentRoute(router, content, options = {}) {
  const routeLocation = getContentRouteFromItem(content);

  if (!routeLocation) return null;

  const method = options.replace ? "replace" : "push";

  if (router?.[method]) {
    try {
      await router[method](routeLocation);
    } catch (error) {
      // Fallback below keeps the address bar in sync even if router navigation is ignored.
      console.warn("Router navigation fallback triggered:", error);
    }
  }

  if (typeof window !== "undefined" && window.location.pathname !== routeLocation.path) {
    window.history[options.replace ? "replaceState" : "pushState"](
      {},
      "",
      routeLocation.path
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return routeLocation;
}

export function isContentDetailsRoute(route) {
  return Boolean(getRouteContentPayload(route));
}

export function getRouteContentPayload(route) {
  const path = route?.path || route?.fullPath || "";
  const match = path.match(/^\/(movie|movies|tv)\/([^/?#]+)$/);

  if (!match) return null;

  const segment = match[1];
  const contentType = segment === "tv" ? "tv" : "movie";
  return {
    contentType,
    id: String(match[2]),
  };
}

export function getPathContentPayload(pathname) {
  const match = pathname?.match(/^\/(movie|movies|tv)\/([^/?#]+)$/);

  if (!match) return null;

  const segment = match[1];
  const contentType = segment === "tv" ? "tv" : "movie";
  return {
    contentType,
    id: String(match[2]),
  };
}
