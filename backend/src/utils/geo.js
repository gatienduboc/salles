/** Distance Haversine en km (formule stable, compatible MariaDB). */
const HAVERSINE_SQL = `(
  6371 * 2 * ASIN(SQRT(
    POWER(SIN((RADIANS(lieux.latitude) - RADIANS(?)) / 2), 2) +
    COS(RADIANS(?)) * COS(RADIANS(lieux.latitude)) *
    POWER(SIN((RADIANS(lieux.longitude) - RADIANS(?)) / 2), 2)
  ))
)`;

export function applyRadiusFilter(knexQuery, lat, lon, radiusKm) {
  const r = Number(radiusKm);
  const latN = Number(lat);
  const lonN = Number(lon);
  if (!Number.isFinite(latN) || !Number.isFinite(lonN) || !Number.isFinite(r) || r <= 0) {
    return knexQuery;
  }

  const latDelta = r / 111.0;
  const lonDelta = r / (111.0 * Math.cos((latN * Math.PI) / 180));

  return knexQuery
    .whereBetween('lieux.latitude', [latN - latDelta, latN + latDelta])
    .whereBetween('lieux.longitude', [lonN - lonDelta, lonN + lonDelta])
    .whereRaw(`${HAVERSINE_SQL} <= ?`, [latN, latN, lonN, r]);
}

export function parseRadiusKm(query) {
  const r = parseFloat(query.radius_km);
  if (!Number.isFinite(r) || r <= 0) return null;
  return Math.min(500, Math.max(1, r));
}

export function resolveMapCenter(query, profileUser) {
  const radiusKm = parseRadiusKm(query);
  if (radiusKm == null) return null;

  let lat;
  let lon;
  let cityLabel = null;

  if (query.center_lat != null && query.center_lon != null) {
    lat = parseFloat(query.center_lat);
    lon = parseFloat(query.center_lon);
    cityLabel = profileUser?.city || null;
  } else if (profileUser) {
    lat = Number(profileUser.city_latitude);
    lon = Number(profileUser.city_longitude);
    cityLabel = profileUser.city || null;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      error:
        'Filtre rayon : précisez votre ville d’exercice dans Mon espace pro (géocodée).',
    };
  }

  return { lat, lon, radiusKm, cityLabel };
}
