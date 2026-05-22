import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractVille, geocodeAddress } from '../../src/services/geocoding.js';

describe('extractVille', () => {
  it('priorise city puis town', () => {
    expect(extractVille({ city: 'Paris' })).toBe('Paris');
    expect(extractVille({ town: 'Lyon' })).toBe('Lyon');
    expect(extractVille({ village: 'Petit-Coin' })).toBe('Petit-Coin');
    expect(extractVille({})).toBeNull();
  });
});

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne coords et ville sur succès', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: '45.7640',
          lon: '4.8357',
          address: { city: 'Lyon', postcode: '69001' },
        },
      ],
    });

    const p = geocodeAddress('Lyon France', { fetchFn });
    await vi.runAllTimersAsync();
    const result = await p;

    expect(result.latitude).toBeCloseTo(45.764);
    expect(result.ville).toBe('Lyon');
    expect(result.code_postal).toBe('69001');
  });

  it('retourne erreur si réponse vide', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const p = geocodeAddress('nulle part', { fetchFn });
    await vi.runAllTimersAsync();
    const result = await p;

    expect(result.error).toMatch(/Aucun résultat/);
  });
});
