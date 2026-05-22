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

/** Libellé court pour la liste de suggestions. */
export function formatSuggestionLabel(hit) {
  const a = hit.address || {};
  const parts = [];
  const name = hit.name || a.amenity || a.building;
  if (name) parts.push(name);
  const street = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(' ');
  if (street) parts.push(street);
  const city = extractVille(a);
  const locality = [a.postcode, city].filter(Boolean).join(' ');
  if (locality) parts.push(locality);
  if (parts.length) return parts.join(', ');
  return hit.display_name || '';
}

async function nominatimSearch(searchParams, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const now = Date.now();
  const wait = config.nominatim.minIntervalMs - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const url = new URL('/search', config.nominatim.baseUrl);
  for (const [key, value] of Object.entries(searchParams)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.nominatim.timeoutMs);

  try {
    const res = await fetchFn(url.toString(), {
      headers: { 'User-Agent': config.nominatim.userAgent },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { error: `Nominatim HTTP ${res.status}`, data: [] };
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return { error: 'Réponse Nominatim invalide', data: [] };
    }
    return { data };
  } catch (err) {
    const message =
      err.name === 'AbortError' ? 'Recherche expirée (timeout)' : err.message;
    return { error: message, data: [] };
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchAddressSuggestions(query, options = {}) {
  const q = String(query || '').trim();
  if (q.length < 3) return { suggestions: [] };

  const { data, error } = await nominatimSearch(
    {
      q,
      format: 'json',
      limit: String(options.limit ?? 6),
      addressdetails: '1',
      countrycodes: options.countrycodes || 'fr',
    },
    options
  );

  const suggestions = data.map((hit) => ({
    label: formatSuggestionLabel(hit),
    adresse: hit.display_name || formatSuggestionLabel(hit),
    ville: extractVille(hit.address),
    code_postal: hit.address?.postcode || null,
    latitude: parseFloat(hit.lat),
    longitude: parseFloat(hit.lon),
  }));

  return { suggestions, error: error || null };
}

export async function geocodeAddress(adresse, options = {}) {
  const { data, error } = await nominatimSearch(
    {
      q: adresse,
      format: 'json',
      limit: '1',
      addressdetails: '1',
      countrycodes: options.countrycodes || 'fr',
    },
    options
  );

  if (error) return { error };
  if (!data.length) {
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
