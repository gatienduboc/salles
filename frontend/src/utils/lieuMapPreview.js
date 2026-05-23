import { getLieuType } from '../constants/lieuTypes.js';
import { buildMapNavigationHtml } from './navigationLinks.js';

const RATING_BASELINE = 5;

export function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMapRatingLine(rating) {
  const avg = rating?.average ?? RATING_BASELINE;
  const count = rating?.count ?? 0;
  if (count === 0) return `${avg.toFixed(1)}/10 (base ${RATING_BASELINE})`;
  return `${avg.toFixed(1)}/10 · ${count} avis`;
}

export function buildMapPreviewHtml(l) {
  const { color, label } = getLieuType(l.type);
  const nom = escHtml(l.nom);
  const ville = escHtml(l.ville || '');
  const adresse = escHtml(l.adresse || '');
  const comment = l.commentaire ? escHtml(l.commentaire) : '';
  const ratingLine = escHtml(formatMapRatingLine(l.rating));
  const photoUrl = l.photo_url ? escHtml(l.photo_url) : '';
  const media = photoUrl
    ? `<a class="map-preview-media" href="/lieux/${l.id}"><img class="map-preview-img" src="${photoUrl}" alt="" loading="lazy" /></a>`
    : `<div class="map-preview-media map-preview-placeholder" aria-hidden="true">📍</div>`;

  return `<div class="map-preview">
    ${media}
    <div class="map-preview-body">
      <div class="map-preview-head">
        <a class="map-preview-title" href="/lieux/${l.id}">${nom}</a>
        <span class="map-preview-type" style="color:${color}">${label}</span>
      </div>
      ${ville ? `<p class="map-preview-loc">${ville}</p>` : ''}
      ${adresse ? `<p class="map-preview-addr">${adresse}</p>` : ''}
      <p class="map-preview-rating">${ratingLine}</p>
      ${comment ? `<p class="map-preview-comment">${comment}</p>` : ''}
      ${buildMapNavigationHtml(l)}
      <a class="map-preview-link" href="/lieux/${l.id}">Voir la fiche →</a>
    </div>
  </div>`;
}
