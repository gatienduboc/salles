import { config } from '../config/index.js';

let lastRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractVille(address) {
  if (!address || typeof address !== 'object') return null;
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    null
  );
}

export async function geocodeAddress(adresse, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const now = Date.now();
  const wait = config.nominatim.minIntervalMs - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const url = new URL('/search', config.nominatim.baseUrl);
  url.searchParams.set('q', adresse);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'fr');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.nominatim.timeoutMs);

  try {
    const res = await fetchFn(url.toString(), {
      headers: { 'User-Agent': config.nominatim.userAgent },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { error: `Nominatim HTTP ${res.status}` };
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { error: 'Aucun résultat pour cette adresse' };
    }
    const hit = data[0];
    return {
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
      ville: extractVille(hit.address),
      code_postal: hit.address?.postcode || null,
      geocoded_at: new Date(),
      geocode_error: null,
    };
  } catch (err) {
    const message =
      err.name === 'AbortError' ? 'Géocodage expiré (timeout)' : err.message;
    return { error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodeLieuIfNeeded(db, lieuId, adresse, previousAdresse, options = {}) {
  const existing = await db('lieux').where({ id: lieuId }).first();
  if (!existing) return;

  if (previousAdresse && previousAdresse === adresse && existing.geocoded_at) {
    return;
  }

  const result = await geocodeAddress(adresse, options);
  const patch = result.error
    ? { geocode_error: result.error, geocoded_at: null }
    : {
        latitude: result.latitude,
        longitude: result.longitude,
        ville: result.ville,
        code_postal: result.code_postal,
        geocoded_at: result.geocoded_at,
        geocode_error: null,
      };

  await db('lieux').where({ id: lieuId }).update({ ...patch, updated_at: db.fn.now() });
}
