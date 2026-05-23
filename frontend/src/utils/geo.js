/** Distance en km entre deux points WGS84. */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function filterLieuxByRadius(lieux, center, radiusKm) {
  const r = Number(radiusKm);
  if (!center || !Number.isFinite(r) || r <= 0) return lieux;
  const lat0 = Number(center.latitude);
  const lon0 = Number(center.longitude);
  if (!Number.isFinite(lat0) || !Number.isFinite(lon0)) return lieux;

  return lieux.filter((l) => {
    const lat = Number(l.latitude);
    const lon = Number(l.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    return haversineKm(lat0, lon0, lat, lon) <= r + 0.5;
  });
}
