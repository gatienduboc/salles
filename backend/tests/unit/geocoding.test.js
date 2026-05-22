import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractVille,
  formatSuggestionLabel,
  geocodeAddress,
  searchAddressSuggestions,
} from '../../src/services/geocoding.js';

describe('extractVille', () => {
  it('priorise city puis town', () => {
    expect(extractVille({ city: 'Paris' })).toBe('Paris');
    expect(extractVille({ town: 'Lyon' })).toBe('Lyon');
    expect(extractVille({ village: 'Petit-Coin' })).toBe('Petit-Coin');
    expect(extractVille({})).toBeNull();
  });
});

describe('formatSuggestionLabel', () => {
  it('compose rue et ville', () => {
    const label = formatSuggestionLabel({
      name: 'Salle des fêtes',
      display_name: 'long',
      address: { road: 'Rue Test', house_number: '12', postcode: '69001', city: 'Lyon' },
    });
    expect(label).toContain('Salle des fêtes');
    expect(label).toContain('12');
    expect(label).toContain('Lyon');
  });
});

describe('searchAddressSuggestions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne vide si moins de 3 caractères', async () => {
    const r = await searchAddressSuggestions('ly');
    expect(r.suggestions).toEqual([]);
  });

  it('retourne des suggestions formatées', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: '45.75',
          lon: '4.85',
          display_name: '10 Rue Example, 69001 Lyon, France',
          name: 'Example',
          address: { road: 'Rue Example', house_number: '10', city: 'Lyon', postcode: '69001' },
        },
      ],
    });
    const p = searchAddressSuggestions('Rue Example Lyon', { fetchFn });
    await vi.runAllTimersAsync();
    const r = await p;
    expect(r.suggestions).toHaveLength(1);
    expect(r.suggestions[0].adresse).toContain('Lyon');
    expect(r.suggestions[0].ville).toBe('Lyon');
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
