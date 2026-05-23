import { describe, it, expect } from 'vitest';
import {
  validateSiret,
  luhnValid,
  normalizeSiretOrSiren,
  profileCompletionPercent,
  formatPublicAuthor,
} from '../../src/services/userProfile.js';

describe('luhnValid', () => {
  it('valide le SIRET utilisateur (14 chiffres)', () => {
    expect(luhnValid('10319214200018')).toBe(true);
    expect(validateSiret('103 192 142 00018')).toBeNull();
  });

  it('valide le SIREN seul (9 chiffres)', () => {
    expect(luhnValid('103192142')).toBe(true);
    expect(validateSiret('103192142')).toBeNull();
  });

  it('rejette longueur incorrecte', () => {
    expect(validateSiret('12345')).toMatch(/9 chiffres/);
  });
});

describe('normalizeSiretOrSiren', () => {
  it('supprime les espaces', () => {
    expect(normalizeSiretOrSiren('103 192 142 00018')).toBe('10319214200018');
  });
});

describe('profileCompletionPercent', () => {
  it('compte les champs renseignés', () => {
    const pct = profileCompletionPercent({
      pseudo: 'DJ Pro',
      activity: 'dj',
      city: 'Paris',
      city_geocoded_at: new Date(),
      postal_code: '75001',
      company_name: null,
      siret: null,
      phone: null,
      website_url: null,
      bio: null,
      intervention_radius_km: null,
      has_rc_pro: null,
    });
    expect(pct).toBeGreaterThan(20);
    expect(pct).toBeLessThan(100);
  });
});

describe('formatPublicAuthor', () => {
  it('expose secteur et ville', () => {
    const a = formatPublicAuthor({
      auteur_id: 1,
      auteur_pseudo: 'Fred',
      auteur_activity: 'dj',
      auteur_city: 'Lyon',
    });
    expect(a.activity_label).toBe('DJ');
    expect(a.city).toBe('Lyon');
  });
});
