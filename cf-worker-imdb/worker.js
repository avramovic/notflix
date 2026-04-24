async function toKvKey(path) {
  // Byte length matters, not char length (emoji/non-ASCII could inflate)
  if (new TextEncoder().encode(path).length <= 450) return path;
  const buf = new TextEncoder().encode(path);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "h:" + hex;
}

export default {
  async fetch(request, env) {
    const imdbApi = "https://api.imdbapi.dev";
    const CACHE_VERSION = "v4"; // promeni za novu invalidaciju cache-a

    // Dozvoljeni metodi
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const proxyPath = `${url.pathname}${url.search}`;
    const proxyUrl = `${imdbApi}${proxyPath}`;

    // KV key limit is 512 bytes UTF-8; hash long paths (e.g. /titles:batchGet?titleIds=...&titleIds=...)
    const kvKey = await toKvKey(proxyPath);

    const cache = caches.default;
    const cacheKey = new Request(CACHE_VERSION + proxyUrl, request);

    // Provera cache-a
    let response = await cache.match(cacheKey);

    if (!response) {

      const stored = await env.IMDB_KV.get(kvKey);

      if (stored) {
        response = new Response(stored, {
          status: 200,
          statusText: "OK",
          headers: new Headers,
        });
        response.headers.set(
          "Cache-Control",
          "public, max-age=14400, s-maxage=43200, stale-while-revalidate=3600"
        );
        response.headers.set(
          "Access-Control-Allow-Origin",
          "*"
        );
        return response;
      }


      // Uzimamo IP klijenta iz requesta
      const clientIP = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");

      // Kreiramo kopiju headera i dodajemo X-Forwarded-For
      const headers = new Headers(request.headers);
      if (clientIP) {
        headers.set("X-Forwarded-For", clientIP);
      }

      // Fetch sa IMDb API-ja
      const originResponse = await fetch(proxyUrl, { method: request.method, headers: headers });

      if (originResponse.status === 200) {
        // Kreiramo novi Response za keširanje i manipulaciju header-om
        response = new Response(originResponse.clone().body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: originResponse.headers,
        });
        response.headers.set(
          "Cache-Control",
          "public, max-age=14400, s-maxage=43200, stale-while-revalidate=3600"
        );



        //const ttl = url.search == '' ? 60 * 60 * 24 : 60 * 60 *;
        await env.IMDB_KV.put(kvKey, originResponse.clone().body, { expirationTtl: 3600 * 24 });

        // Stavlja se u CF edge cache
        await cache.put(cacheKey, response.clone());
      } else {
        // Status != 200 → ne keširaj
        response = new Response(originResponse.clone().body, {
          status: originResponse.status,
          statusText: originResponse.statusText,
          headers: originResponse.headers,
        });
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      }
    }

    // Vraćamo finalni response direktno, bez await response.text()
    return response;
  },
};