/** Lieu avec latitude/longitude WGS84. */
export function getLieuCoords(lieu) {
  const lat = Number(lieu?.latitude);
  const lon = Number(lieu?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

function placeLabel(lieu) {
  return [lieu?.nom, lieu?.adresse].filter(Boolean).join(', ');
}

export function googleMapsPlaceHref(lieu) {
  if (lieu?.google_maps_url) return lieu.google_maps_url;
  const placeId = lieu?.google_place_id;
  if (!placeId) return null;
  const label = placeLabel(lieu);
  const params = new URLSearchParams({ api: '1', query: label, query_place_id: placeId });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Liens d’ouverture dans apps de cartographie / navigation (sans API payante). */
export function buildNavigationLinks(lieu) {
  const coords = getLieuCoords(lieu);
  const googleHref = googleMapsPlaceHref(lieu);
  if (!coords && !googleHref) return null;

  const { lat, lon } = coords || {};
  const ll = coords ? `${lat},${lon}` : '';
  const label = placeLabel(lieu);
  const q = encodeURIComponent(label || ll);

  const links = [];

  if (googleHref) {
    links.push({
      id: 'google',
      label: lieu.google_place_id ? 'Fiche Google' : 'Google Maps',
      href: googleHref,
    });
  } else if (coords) {
    links.push({
      id: 'google',
      label: 'Google Maps',
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ll)}`,
    });
  }

  if (!coords) return links.length ? links : null;

  links.push(
    {
      id: 'waze',
      label: 'Waze',
      href: `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`,
    },
    {
      id: 'apple',
      label: 'Plans',
      href: `https://maps.apple.com/?ll=${lat},${lon}&q=${q}`,
    },
    {
      id: 'geo',
      label: 'Naviguer',
      href: `geo:${lat},${lon}?q=${q}`,
    },
    {
      id: 'osm',
      label: 'OpenStreetMap',
      href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
    }
  );

  return links;
}

/** HTML pour popup carte Leaflet. */
export function buildMapNavigationHtml(lieu) {
  const links = buildNavigationLinks(lieu);
  if (!links) return '';

  const items = links
    .map(
      (l) =>
        `<a class="map-preview-nav-link" href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a>`
    )
    .join('');

  return `<p class="map-preview-nav">${items}</p>`;
}
