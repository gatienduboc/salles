import { describe, it, expect } from 'vitest';
import { parseRadiusKm, resolveMapCenter } from '../../src/utils/geo.js';

describe('geo radius', () => {
  it('parseRadiusKm borne 1–500', () => {
    expect(parseRadiusKm({ radius_km: '80' })).toBe(80);
    expect(parseRadiusKm({ radius_km: '0' })).toBeNull();
    expect(parseRadiusKm({ radius_km: '9999' })).toBe(500);
  });

  it('resolveMapCenter depuis le profil', () => {
    const c = resolveMapCenter({ radius_km: '50' }, {
      city: 'Lyon',
      city_latitude: 45.75,
      city_longitude: 4.85,
    });
    expect(c.lat).toBeCloseTo(45.75);
    expect(c.radiusKm).toBe(50);
    expect(c.cityLabel).toBe('Lyon');
  });

  it('erreur sans centre', () => {
    const c = resolveMapCenter({ radius_km: '30' }, null);
    expect(c.error).toBeTruthy();
  });

  it('resolveMapCenter depuis center_lat/lon (requête carte)', () => {
    const c = resolveMapCenter(
      { radius_km: '80', center_lat: '50.67', center_lon: '3.10' },
      { city: 'Marcq-en-Barœul' }
    );
    expect(c.lat).toBeCloseTo(50.67);
    expect(c.lon).toBeCloseTo(3.1);
    expect(c.radiusKm).toBe(80);
    expect(c.cityLabel).toBe('Marcq-en-Barœul');
  });
});
