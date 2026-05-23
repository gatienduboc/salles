/**
 * Lien vers la fiche établissement Google Maps.
 * @see https://developers.google.com/maps/documentation/urls/get-started#search-parameters
 */
export function googleMapsPlaceUrl(placeId, label = null, storedUrl = null) {
  if (storedUrl && typeof storedUrl === 'string') return storedUrl;
  if (!placeId || typeof placeId !== 'string') return null;

  const q = typeof label === 'string' && label.trim() ? label.trim() : null;
  if (q) {
    const params = new URLSearchParams({ api: '1', query: q, query_place_id: placeId });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }

  return `https://www.google.com/maps/place/?q=${encodeURIComponent(`place_id:${placeId}`)}`;
}
