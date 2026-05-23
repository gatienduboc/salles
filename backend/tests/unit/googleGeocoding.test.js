import { describe, it, expect, vi } from 'vitest';
import { geocodeLieuWithGoogle } from '../../src/services/googleGeocoding.js';

describe('geocodeLieuWithGoogle', () => {
  it('retourne coords via Places + Details', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [
            {
              place_id: 'ChIJtest123',
              name: 'CCA Châtenois',
              formatted_address: '4 Rue Saint-Georges, 67730 Châtenois, France',
              geometry: { location: { lat: 48.2521, lng: 7.4012 } },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'OK',
          result: {
            place_id: 'ChIJtest123',
            name: 'CCA Châtenois',
            url: 'https://maps.google.com/?cid=999',
            formatted_address: '4 Rue Saint-Georges, 67730 Châtenois, France',
            geometry: { location: { lat: 48.2521, lng: 7.4012 } },
            address_components: [{ types: ['postal_code'], long_name: '67730' }],
          },
        }),
      });

    const r = await geocodeLieuWithGoogle(
      'CCA Châtenois',
      '4 Rue Saint-Georges, 67730 Châtenois, France',
      { apiKey: 'test-key', fetchFn }
    );

    expect(r.latitude).toBeCloseTo(48.2521);
    expect(r.code_postal).toBe('67730');
    expect(r.provider).toBe('google');
    expect(r.google_place_id).toBe('ChIJtest123');
    expect(r.google_maps_url).toBe('https://maps.google.com/?cid=999');
  });

  it('sans clé API', async () => {
    const r = await geocodeLieuWithGoogle('Test', 'Lyon', { apiKey: '' });
    expect(r.error).toMatch(/GOOGLE_MAPS_API_KEY/);
  });
});
