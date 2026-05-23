import { config } from '../config/index.js';
import { db } from '../db/knex.js';
import { formatPublicAuthor, getActivityLabel } from './userProfile.js';
import { applyRadiusFilter, resolveMapCenter } from '../utils/geo.js';
import { googleMapsPlaceUrl } from '../utils/googleMapsUrl.js';

const MAP_MAX = 500;

const LIEU_FIELDS = [
  'nom',
  'adresse',
  'nom_gerant',
  'telephone',
  'fumee_interdite',
  'confetti_interdit',
  'db_limite',
  'acces_difficile',
  'proprio_relou',
  'commentaire',
  'heure_fermeture',
  'sono_imposee',
  'date_dernier_evenement',
  'type',
];

const SORT_COLUMNS = {
  nom: 'lieux.nom',
  ville: 'lieux.ville',
  created_at: 'lieux.created_at',
  updated_at: 'lieux.updated_at',
  date_dernier_evenement: 'lieux.date_dernier_evenement',
};

const LIEU_COLUMNS = [
  'lieux.id',
  'lieux.nom',
  'lieux.adresse',
  'lieux.nom_gerant',
  'lieux.telephone',
  'lieux.fumee_interdite',
  'lieux.confetti_interdit',
  'lieux.db_limite',
  'lieux.acces_difficile',
  'lieux.proprio_relou',
  'lieux.commentaire',
  'lieux.heure_fermeture',
  'lieux.sono_imposee',
  'lieux.auteur_id',
  'lieux.date_dernier_evenement',
  'lieux.type',
  'lieux.latitude',
  'lieux.longitude',
  'lieux.ville',
  'lieux.code_postal',
  'lieux.geocoded_at',
  'lieux.geocode_error',
  'lieux.google_place_id',
  'lieux.google_maps_url',
  'lieux.created_at',
  'lieux.updated_at',
  'users.pseudo as auteur_pseudo',
  'users.activity as auteur_activity',
  'users.city as auteur_city',
];

export function pickLieuBody(body) {
  const data = {};
  for (const key of LIEU_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

export function formatAuteur(row) {
  return formatPublicAuthor(row);
}

export function formatLieu(row, photos = []) {
  if (!row) return null;
  return {
    id: row.id,
    nom: row.nom,
    adresse: row.adresse,
    nom_gerant: row.nom_gerant,
    telephone: row.telephone,
    fumee_interdite: row.fumee_interdite,
    confetti_interdit: row.confetti_interdit,
    db_limite: row.db_limite,
    acces_difficile: row.acces_difficile,
    proprio_relou: row.proprio_relou,
    commentaire: row.commentaire,
    heure_fermeture: row.heure_fermeture,
    sono_imposee: row.sono_imposee,
    auteur_id: row.auteur_id,
    auteur: formatAuteur(row),
    date_dernier_evenement: row.date_dernier_evenement,
    type: row.type,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    ville: row.ville,
    code_postal: row.code_postal,
    geocoded_at: row.geocoded_at,
    geocode_error: row.geocode_error,
    google_place_id: row.google_place_id || null,
    google_maps_url:
      row.google_maps_url || googleMapsPlaceUrl(row.google_place_id, row.nom),
    created_at: row.created_at,
    updated_at: row.updated_at,
    photos: photos.map((p) => ({
      id: p.id,
      url: `${config.sitePublicUrl}/uploads/${p.filename}`,
      filename: p.filename,
      created_at: p.created_at,
    })),
  };
}

function truncateText(text, maxLen) {
  if (!text) return null;
  const s = String(text).trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1)}…`;
}

export function formatLieuMapMarker(row, photo = null) {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    ville: row.ville,
    adresse: row.adresse,
    commentaire: truncateText(row.commentaire, 160),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    google_place_id: row.google_place_id || null,
    photo_url: photo
      ? `${config.sitePublicUrl}/uploads/${photo.filename}`
      : null,
  };
}

function applyFilters(q, query, { includeType = true } = {}) {
  if (includeType && query.type) {
    q = q.where('lieux.type', query.type);
  }
  if (query.ville) {
    q = q.where('lieux.ville', 'like', `%${query.ville}%`);
  }
  if (query.code_postal) {
    q = q.where('lieux.code_postal', 'like', `${query.code_postal}%`);
  }
  if (query.search) {
    const term = `%${query.search}%`;
    q = q.where((builder) => {
      builder.where('lieux.nom', 'like', term).orWhere('lieux.adresse', 'like', term);
    });
  }
  if (query.auteur_id) {
    const auteurId = parseInt(query.auteur_id, 10);
    if (auteurId > 0) {
      q = q.where('lieux.auteur_id', auteurId);
    }
  }
  if (query.has_coords === 'true' || query.has_coords === '1') {
    q = q.whereNotNull('lieux.latitude').whereNotNull('lieux.longitude');
  }
  const geoProblemFilter =
    query.sans_coords === 'true' ||
    query.sans_coords === '1' ||
    query.geocode_error === 'true' ||
    query.geocode_error === '1';
  if (geoProblemFilter) {
    q = q.where((b) => {
      b.whereNull('lieux.latitude')
        .orWhereNull('lieux.longitude')
        .orWhereNotNull('lieux.geocode_error');
    });
  }
  return q;
}

export function parseSort(query) {
  const sort = SORT_COLUMNS[query.sort] ? query.sort : 'updated_at';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  return { sort, order, column: SORT_COLUMNS[sort] };
}

function buildListMeta({ page, limit, total, sort, order, counts }) {
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    limit,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    sort,
    order,
    counts,
  };
}

export async function fetchLieuById(id) {
  return db('lieux')
    .leftJoin('users', 'lieux.auteur_id', 'users.id')
    .select(LIEU_COLUMNS)
    .where('lieux.id', id)
    .first();
}

export async function getCounts(query) {
  let q = db('lieux');
  q = applyFilters(q, query, { includeType: false });
  const rows = await q.select('type').count({ count: '*' }).groupBy('type');
  const counts = { blacklist: 0, favori: 0 };
  for (const r of rows) {
    counts[r.type] = Number(r.count);
  }
  return counts;
}

export async function listLieux(knexDb, query, profileUser = null) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const { sort, order, column } = parseSort(query);

  const radius = resolveMapCenter(query, profileUser);
  if (radius?.error) {
    const err = new Error(radius.error);
    err.status = 400;
    throw err;
  }

  let q = knexDb('lieux')
    .leftJoin('users', 'lieux.auteur_id', 'users.id')
    .select(LIEU_COLUMNS);
  q = applyFilters(q, query);
  if (radius) {
    q = applyRadiusFilter(q, radius.lat, radius.lon, radius.radiusKm);
  }

  const countQuery = q.clone().clearSelect().count({ total: '*' }).first();
  const rows = await q.orderBy(column, order).limit(limit).offset(offset);
  const { total } = await countQuery;
  const counts = await getCounts(query);
  const totalNum = Number(total);

  const meta = buildListMeta({ page, limit, total: totalNum, sort, order, counts });
  if (radius) {
    meta.radius_km = radius.radiusKm;
    meta.radius_center = {
      latitude: radius.lat,
      longitude: radius.lon,
      city: radius.cityLabel,
    };
  }

  return {
    data: rows.map((r) => formatLieu(r, [])),
    meta,
  };
}

export async function listLieuxAuteurs(knexDb, query) {
  const { auteur_id: _omit, page: _p, limit: _l, sort: _s, order: _o, ...filterQuery } = query;

  let q = knexDb('lieux')
    .join('users', 'lieux.auteur_id', 'users.id')
    .select('users.id', 'users.pseudo', 'users.activity', 'users.city')
    .count({ count: '*' });
  q = applyFilters(q, filterQuery);

  const rows = await q
    .groupBy('users.id', 'users.pseudo', 'users.activity', 'users.city')
    .orderBy('users.pseudo', 'asc');

  return {
    data: rows.map((r) => ({
      id: r.id,
      pseudo: r.pseudo,
      activity: r.activity,
      activity_label: getActivityLabel(r.activity),
      city: r.city,
      count: Number(r.count),
    })),
  };
}

export async function listLieuxForMap(knexDb, query, profileUser = null) {
  const { column, order, sort } = parseSort(query);
  const radius = resolveMapCenter(query, profileUser);
  if (radius?.error) {
    const err = new Error(radius.error);
    err.status = 400;
    throw err;
  }

  let q = knexDb('lieux')
    .select(
      'lieux.id',
      'lieux.nom',
      'lieux.type',
      'lieux.ville',
      'lieux.adresse',
      'lieux.commentaire',
      'lieux.latitude',
      'lieux.longitude'
    )
    .whereNotNull('lieux.latitude')
    .whereNotNull('lieux.longitude');
  q = applyFilters(q, query);
  if (radius) {
    q = applyRadiusFilter(q, radius.lat, radius.lon, radius.radiusKm);
  }

  const countQuery = q.clone().count({ total: '*' }).first();
  const rows = await q.orderBy(column, order).limit(MAP_MAX);
  const { total } = await countQuery;
  const totalNum = Number(total);

  const ids = rows.map((r) => r.id);
  const photoByLieu = {};
  if (ids.length) {
    const photoRows = await knexDb('photos')
      .whereIn('lieu_id', ids)
      .orderBy('created_at', 'asc')
      .select('lieu_id', 'filename');
    for (const p of photoRows) {
      if (!photoByLieu[p.lieu_id]) photoByLieu[p.lieu_id] = p;
    }
  }

  const meta = {
    total: totalNum,
    returned: rows.length,
    capped: totalNum > MAP_MAX,
    max: MAP_MAX,
    sort,
    order,
  };
  if (radius) {
    meta.radius_km = radius.radiusKm;
    meta.radius_center = {
      latitude: radius.lat,
      longitude: radius.lon,
      city: radius.cityLabel,
    };
  }

  return {
    data: rows.map((r) => formatLieuMapMarker(r, photoByLieu[r.id])),
    meta,
  };
}
