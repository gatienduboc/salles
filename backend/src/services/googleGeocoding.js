import { config } from '../config/index.js';
import { googleMapsPlaceUrl } from '../utils/googleMapsUrl.js';

function parseAddressComponents(components = []) {
  let ville = null;
  let code_postal = null;
  for (const c of components) {
    if (c.types.includes('postal_code')) code_postal = c.long_name;
    if (c.types.includes('locality')) ville = c.long_name;
    else if (!ville && c.types.includes('postal_town')) ville = c.long_name;
  }
  return { ville, code_postal };
}

/** Score un résultat Places par rapport au nom de la fiche. */
export function scorePlaceForLieu(place, nom) {
  const name = (place.name || '').toLowerCase();
  const nomNorm = String(nom || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const nameNorm = name.normalize('NFD').replace(/\p{M}/gu, '');

  let score = 0;
  const words = nomNorm.split(/[\s—–-]+/).filter((w) => w.length > 2);
  for (const w of words) {
    if (nameNorm.includes(w)) score += 5;
  }
  if (nameNorm.includes('salle')) score += 4;
  if (nameNorm.includes('fête') || nameNorm.includes('fete')) score += 3;
  if (nomNorm.includes('foyer') && nameNorm.includes('foyer')) score += 3;
  if (nameNorm.includes('château') && nameNorm.includes('chateau')) score += 3;
  if (nomNorm.includes('salle') && !nameNorm.includes('salle') && !nameNorm.includes('fête')) {
    score -= 3;
  }
  return score;
}

export function pickBestPlace(results, nom) {
  if (!results?.length) return null;
  let best = results[0];
  let bestScore = scorePlaceForLieu(best, nom);
  for (const place of results.slice(1)) {
    const s = scorePlaceForLieu(place, nom);
    if (s > bestScore) {
      bestScore = s;
      best = place;
    }
  }
  return best;
}

function isEstablishmentGeocodeHit(hit) {
  const types = hit.types || [];
  return types.some((t) =>
    ['establishment', 'point_of_interest', 'premise', 'food', 'lodging'].includes(t)
  );
}

function buildResult(location, components, formattedAddress, placeId, mapsUrl, placeName) {
  const lat = Number(location.lat);
  const lon = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { error: 'Coordonnées Google invalides' };
  }
  const parsed = parseAddressComponents(components);
  let { ville, code_postal } = parsed;
  if (!code_postal && formattedAddress) {
    const m = formattedAddress.match(/\b(\d{5})\b/);
    if (m) code_postal = m[1];
  }
  const label = placeName || formattedAddress;
  return {
    latitude: lat,
    longitude: lon,
    ville,
    code_postal,
    google_place_id: placeId || null,
    google_maps_url:
      mapsUrl || googleMapsPlaceUrl(placeId, label) || null,
    geocoded_at: new Date(),
    geocode_error: null,
    provider: 'google',
  };
}

async function googleFetch(url, options = {}) {
  const fetchFn = options.fetchFn || globalThis.fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.googleMaps.timeoutMs);
  try {
    const res = await fetchFn(url.toString(), { signal: controller.signal });
    const data = await res.json();
    if (!res.ok) {
      return { error: `Google HTTP ${res.status}`, data: null };
    }
    return { data };
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Google Maps expiré (timeout)' : err.message;
    return { error: message, data: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPlaceDetails(placeId, apiKey, fetchOpts) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set(
    'fields',
    'name,url,place_id,formatted_address,geometry,address_components,business_status'
  );
  url.searchParams.set('key', apiKey);
  url.searchParams.set('language', 'fr');

  const res = await googleFetch(url, fetchOpts);
  if (res.error) return { error: res.error };
  if (res.data.status !== 'OK' || !res.data.result) {
    return { error: res.data.error_message || res.data.status || 'Place Details indisponible' };
  }
  return { result: res.data.result };
}

async function resultFromPlace(place, nom, adresse, apiKey, fetchOpts) {
  const details = await fetchPlaceDetails(place.place_id, apiKey, fetchOpts);
  if (!details.error && details.result) {
    const r = details.result;
    const loc = r.geometry?.location || place.geometry?.location;
    return buildResult(
      loc,
      r.address_components || [],
      r.formatted_address || place.formatted_address,
      r.place_id || place.place_id,
      r.url || null,
      r.name || place.name || nom
    );
  }

  return buildResult(
    place.geometry.location,
    [],
    place.formatted_address || place.name,
    place.place_id,
    null,
    place.name || nom
  );
}

/** Recherche lieu par nom + adresse (Places Text Search puis Geocoding). */
export async function geocodeLieuWithGoogle(nom, adresse, options = {}) {
  const apiKey = options.apiKey ?? config.googleMaps.apiKey;
  if (!apiKey) {
    return { error: 'GOOGLE_MAPS_API_KEY non configuré' };
  }

  const query = [nom, adresse].filter(Boolean).join(', ').trim();
  if (query.length < 3) {
    return { error: 'Nom ou adresse trop court' };
  }

  const fetchOpts = { fetchFn: options.fetchFn };

  const textUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  textUrl.searchParams.set('query', query);
  textUrl.searchParams.set('key', apiKey);
  textUrl.searchParams.set('language', 'fr');
  textUrl.searchParams.set('region', 'fr');

  const textRes = await googleFetch(textUrl, fetchOpts);
  if (textRes.error) return { error: textRes.error };

  const textData = textRes.data;
  if (textData.status === 'OK' && textData.results?.length) {
    const place = pickBestPlace(textData.results, nom);
    return resultFromPlace(place, nom, adresse, apiKey, fetchOpts);
  }

  const geoUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  geoUrl.searchParams.set('address', query);
  geoUrl.searchParams.set('key', apiKey);
  geoUrl.searchParams.set('language', 'fr');
  geoUrl.searchParams.set('region', 'fr');

  const geoRes = await googleFetch(geoUrl, fetchOpts);
  if (geoRes.error) return { error: geoRes.error };

  const geoData = geoRes.data;
  if (geoData.status === 'OK' && geoData.results?.length) {
    const hit = geoData.results[0];
    if (isEstablishmentGeocodeHit(hit) && hit.place_id) {
      return resultFromPlace(
        {
          place_id: hit.place_id,
          geometry: { location: hit.geometry.location },
          formatted_address: hit.formatted_address,
          name: nom,
        },
        nom,
        adresse,
        apiKey,
        fetchOpts
      );
    }
    return buildResult(
      hit.geometry.location,
      hit.address_components,
      hit.formatted_address,
      hit.place_id,
      null,
      nom
    );
  }

  return {
    error: geoData.error_message || geoData.status || 'Aucun résultat Google Maps',
  };
}
