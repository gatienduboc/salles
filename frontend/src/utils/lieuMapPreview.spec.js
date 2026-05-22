import { describe, it, expect } from 'vitest';
import { buildMapPreviewHtml, escHtml, formatMapRatingLine } from './lieuMapPreview.js';

describe('lieuMapPreview', () => {
  it('échappe le HTML', () => {
    expect(escHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('affiche note et commentaire', () => {
    const html = buildMapPreviewHtml({
      id: 3,
      nom: 'Château & Co',
      type: 'favori',
      ville: 'Lyon',
      adresse: '1 rue Test',
      commentaire: 'Très bien',
      photo_url: 'https://ex.test/uploads/a.jpg',
      rating: { average: 7.5, count: 2 },
    });
    expect(html).toContain('Château &amp; Co');
    expect(html).toContain('7.5/10');
    expect(html).toContain('Très bien');
    expect(html).toContain('map-preview-img');
    expect(html).toContain('/lieux/3');
  });

  it('sans photo ni avis', () => {
    const html = buildMapPreviewHtml({
      id: 1,
      nom: 'Salle',
      type: 'blacklist',
      rating: { average: 5, count: 0 },
    });
    expect(html).toContain('map-preview-placeholder');
    expect(formatMapRatingLine({ average: 5, count: 0 })).toContain('base 5');
  });
});
