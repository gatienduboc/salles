import { config } from '../config/index.js';

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

export function pickLieuBody(body) {
  const data = {};
  for (const key of LIEU_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

export function formatLieu(row, photos = []) {
  if (!row) return null;
  return {
    ...row,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    photos: photos.map((p) => ({
      id: p.id,
      url: `${config.apiPublicUrl}/uploads/${p.filename}`,
      filename: p.filename,
      created_at: p.created_at,
    })),
  };
}

export async function listLieux(db, query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  let q = db('lieux').select('lieux.*');

  if (query.type) {
    q = q.where('type', query.type);
  }
  if (query.ville) {
    q = q.where('ville', 'like', `%${query.ville}%`);
  }
  if (query.search) {
    const term = `%${query.search}%`;
    q = q.where((builder) => {
      builder.where('nom', 'like', term).orWhere('adresse', 'like', term);
    });
  }

  const countQuery = q.clone().clearSelect().count({ total: '*' }).first();
  const rows = await q.orderBy('updated_at', 'desc').limit(limit).offset(offset);
  const { total } = await countQuery;

  return {
    data: rows.map((r) => formatLieu(r, [])),
    meta: { page, limit, total: Number(total) },
  };
}
