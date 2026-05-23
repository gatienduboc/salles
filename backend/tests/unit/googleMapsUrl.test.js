import { describe, it, expect } from 'vitest';
import { googleMapsPlaceUrl } from '../../src/utils/googleMapsUrl.js';

describe('googleMapsPlaceUrl', () => {
  it('utilise l’URL stockée (fiche établissement Google)', () => {
    const stored = 'https://maps.google.com/?cid=123';
    expect(googleMapsPlaceUrl('ChIJabc', 'Nom', stored)).toBe(stored);
  });

  it('construit query + query_place_id (doc Google Maps URLs)', () => {
    const url = googleMapsPlaceUrl('ChIJabc', 'Salle des fêtes');
    expect(url).toContain('query=Salle');
    expect(url).toContain('query_place_id=ChIJabc');
    expect(url).toContain('api=1');
  });

  it('retourne null sans place_id', () => {
    expect(googleMapsPlaceUrl(null)).toBeNull();
  });
});
