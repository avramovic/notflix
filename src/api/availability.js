const BASE = 'https://vidsrc.6683549.xyz/embed';
const cache = new Map();

const urlFor = (type, id, season, episode) =>
  (type === 'tv' && season != null && episode != null)
    ? `${BASE}/tv/${id}/${season}-${episode}?exists`
    : `${BASE}/${type}/${id}?exists`;

export function checkAvailability(type, id, season, episode) {
  const url = urlFor(type, id, season, episode);
  if (cache.has(url)) return cache.get(url);
  const p = fetch(url)
    .then(r => r.ok ? r.json() : null)
    .then(j => j?.exists === true)
    .catch(() => { cache.delete(url); return true; });
  cache.set(url, p);
  return p;
}

export function checkEpisodesAvailability(tvId, episodes) {
  return Promise.all(
    episodes.map(ep =>
      checkAvailability('tv', tvId, ep.season_number, ep.episode_number)
        .then(ok => [ep.id, ok])
    )
  ).then(Object.fromEntries);
}
