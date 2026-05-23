import { describe, it, expect } from 'vitest';
import { pickBestPlace, scorePlaceForLieu } from '../../src/services/googleGeocoding.js';

describe('pickBestPlace', () => {
  const results = [
    { name: 'Salle Rio', place_id: 'rio' },
    { name: 'Salle des fêtes Jean-Jacques Renaud', place_id: 'fetes' },
    { name: 'Théâtre Municipal', place_id: 'theatre' },
  ];

  it('préfère la salle des fêtes pour Serémange-Erstein', () => {
    const best = pickBestPlace(results, 'Salle de Serémange-Erstein');
    expect(best.place_id).toBe('fetes');
  });

  it('scorePlaceForLieu favorise « salle »', () => {
    expect(scorePlaceForLieu(results[1], 'Salle de Serémange-Erstein')).toBeGreaterThan(
      scorePlaceForLieu(results[0], 'Salle de Serémange-Erstein')
    );
  });
});
