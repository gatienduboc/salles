import { config } from '../config/index.js';
import { db } from '../db/knex.js';

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
  'lieux.created_at',
  'lieux.updated_at',
  'users.pseudo as auteur_pseudo',
];

export function pickLieuBody(body) {
  const data = {};
  for (const key of LIEU_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

export function formatAuteur(row) {
  if (!row?.auteur_id) return null;
  return { id: row.auteur_id, pseudo: row.auteur_pseudo || null };
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

export function formatLieuMapMarker(row) {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    ville: row.ville,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
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

export async function listLieux(knexDb, query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const { sort, order, column } = parseSort(query);

  let q = knexDb('lieux')
    .leftJoin('users', 'lieux.auteur_id', 'users.id')
    .select(LIEU_COLUMNS);
  q = applyFilters(q, query);

  const countQuery = q.clone().clearSelect().count({ total: '*' }).first();
  const rows = await q.orderBy(column, order).limit(limit).offset(offset);
  const { total } = await countQuery;
  const counts = await getCounts(query);
  const totalNum = Number(total);

  return {
    data: rows.map((r) => formatLieu(r, [])),
    meta: buildListMeta({ page, limit, total: totalNum, sort, order, counts }),
  };
}

export async function listLieuxAuteurs(knexDb, query) {
  const { auteur_id: _omit, page: _p, limit: _l, sort: _s, order: _o, ...filterQuery } =
    query;

  let q = knexDb('lieux')
    .join('users', 'lieux.auteur_id', 'users.id')
    .select('users.id', 'users.pseudo')
    .count({ count: '*' });
  q = applyFilters(q, filterQuery);

  const rows = await q.groupBy('users.id', 'users.pseudo').orderBy('users.pseudo', 'asc');

  return {
    data: rows.map((r) => ({
      id: r.id,
      pseudo: r.pseudo,
      count: Number(r.count),
    })),
  };
}

export async function listLieuxForMap(knexDb, query) {
  const { column, order, sort } = parseSort(query);

  let q = knexDb('lieux')
    .select(
      'lieux.id',
      'lieux.nom',
      'lieux.type',
      'lieux.ville',
      'lieux.latitude',
      'lieux.longitude'
    )
    .whereNotNull('lieux.latitude')
    .whereNotNull('lieux.longitude');
  q = applyFilters(q, query);

  const countQuery = q.clone().count({ total: '*' }).first();
  const rows = await q.orderBy(column, order).limit(MAP_MAX);
  const { total } = await countQuery;
  const totalNum = Number(total);

  return {
    data: rows.map(formatLieuMapMarker),
    meta: {
      total: totalNum,
      returned: rows.length,
      capped: totalNum > MAP_MAX,
      max: MAP_MAX,
      sort,
      order,
    },
  };
}
