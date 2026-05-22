import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import { geocodeLieuIfNeeded } from './geocoding.js';
import { listLieux } from './lieux.js';

const BULK_MAX = 50;
const BULK_PATCH_KEYS = ['type', 'auteur_id'];

export function parseIds(ids) {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map((id) => parseInt(id, 10)).filter((id) => id > 0))].slice(0, BULK_MAX);
}

export async function getAdminStats(knexDb) {
  const [usersTotal] = await knexDb('users').count({ total: '*' });
  const [admins] = await knexDb('users').where({ role: 'admin' }).count({ total: '*' });
  const [lieuxTotal] = await knexDb('lieux').count({ total: '*' });
  const [favori] = await knexDb('lieux').where({ type: 'favori' }).count({ total: '*' });
  const [blacklist] = await knexDb('lieux').where({ type: 'blacklist' }).count({ total: '*' });
  const [sansCoords] = await knexDb('lieux')
    .where((b) => b.whereNull('latitude').orWhereNull('longitude'))
    .count({ total: '*' });
  const [geocodeError] = await knexDb('lieux').whereNotNull('geocode_error').count({ total: '*' });
  const [photosTotal] = await knexDb('photos').count({ total: '*' });

  const parAuteur = await knexDb('lieux')
    .join('users', 'lieux.auteur_id', 'users.id')
    .select('users.id', 'users.pseudo')
    .count({ count: '*' })
    .groupBy('users.id', 'users.pseudo')
    .orderBy('count', 'desc')
    .limit(10);

  const recents = await knexDb('lieux')
    .leftJoin('users', 'lieux.auteur_id', 'users.id')
    .select('lieux.id', 'lieux.nom', 'lieux.type', 'lieux.updated_at', 'users.pseudo as auteur_pseudo')
    .orderBy('lieux.updated_at', 'desc')
    .limit(5);

  return {
    users: { total: Number(usersTotal.total), admins: Number(admins.total) },
    lieux: {
      total: Number(lieuxTotal.total),
      favori: Number(favori.total),
      blacklist: Number(blacklist.total),
      sans_coords: Number(sansCoords.total),
      geocode_error: Number(geocodeError.total),
    },
    photos: { total: Number(photosTotal.total) },
    lieux_par_auteur: parAuteur.map((r) => ({
      id: r.id,
      pseudo: r.pseudo,
      count: Number(r.count),
    })),
    lieux_recents: recents.map((r) => ({
      id: r.id,
      nom: r.nom,
      type: r.type,
      auteur: r.auteur_pseudo,
      updated_at: r.updated_at,
    })),
  };
}

export async function listAdminUsers(knexDb, query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  let q = knexDb('users').select('users.*');
  if (query.search) {
    const term = `%${query.search}%`;
    q = q.where((b) => {
      b.where('users.email', 'like', term).orWhere('users.pseudo', 'like', term);
    });
  }

  const countRow = await q.clone().clearSelect().count({ total: '*' }).first();
  const rows = await q.orderBy('users.created_at', 'desc').limit(limit).offset(offset);

  const ids = rows.map((r) => r.id);
  let counts = [];
  if (ids.length) {
    counts = await knexDb('lieux')
      .whereIn('auteur_id', ids)
      .select('auteur_id')
      .count({ count: '*' })
      .groupBy('auteur_id');
  }
  const countMap = Object.fromEntries(counts.map((c) => [c.auteur_id, Number(c.count)]));

  return {
    data: rows.map((u) => ({
      id: u.id,
      email: u.email,
      pseudo: u.pseudo,
      role: u.role,
      created_at: u.created_at,
      lieux_count: countMap[u.id] || 0,
    })),
    meta: {
      page,
      limit,
      total: Number(countRow.total),
      totalPages: Math.max(1, Math.ceil(Number(countRow.total) / limit) || 1),
    },
  };
}

export async function createAdminUser(knexDb, { email, password, pseudo }) {
  const normalized = email.toLowerCase();
  const existing = await knexDb('users').where({ email: normalized }).first();
  if (existing) {
    const err = new Error('Email déjà utilisé');
    err.status = 409;
    throw err;
  }
  const role = normalized === config.adminEmail ? 'admin' : 'user';
  const password_hash = await bcrypt.hash(password, 10);
  const [id] = await knexDb('users').insert({
    email: normalized,
    password_hash,
    pseudo,
    role,
  });
  return knexDb('users').where({ id }).first();
}

export async function updateAdminUser(knexDb, id, data, actingUser) {
  const user = await knexDb('users').where({ id }).first();
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }

  const patch = {};
  if (data.pseudo !== undefined) patch.pseudo = data.pseudo;
  if (data.email !== undefined) {
    const email = data.email.toLowerCase();
    const dup = await knexDb('users').where({ email }).whereNot({ id }).first();
    if (dup) {
      const err = new Error('Email déjà utilisé');
      err.status = 409;
      throw err;
    }
    patch.email = email;
  }
  if (data.role !== undefined) {
    if (user.email === config.adminEmail && data.role !== 'admin') {
      const err = new Error('Impossible de retirer le rôle admin au compte principal');
      err.status = 400;
      throw err;
    }
    patch.role = data.role;
  }

  if (Object.keys(patch).length) {
    await knexDb('users').where({ id }).update(patch);
  }
  return knexDb('users').where({ id }).first();
}

export async function resetAdminUserPassword(knexDb, id, password) {
  const user = await knexDb('users').where({ id }).first();
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }
  const password_hash = await bcrypt.hash(password, 10);
  await knexDb('users').where({ id }).update({ password_hash });
}

export async function deleteAdminUser(knexDb, id) {
  const user = await knexDb('users').where({ id }).first();
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }
  if (user.email === config.adminEmail) {
    const err = new Error('Impossible de supprimer le compte administrateur principal');
    err.status = 400;
    throw err;
  }
  const [{ count }] = await knexDb('lieux').where({ auteur_id: id }).count({ count: '*' });
  if (Number(count) > 0) {
    const err = new Error(`Cet utilisateur a encore ${count} fiche(s) — réattribuez-les avant suppression`);
    err.status = 409;
    throw err;
  }
  await knexDb('users').where({ id }).del();
}

export async function listAdminLieux(knexDb, query) {
  return listLieux(knexDb, query);
}

export function pickBulkPatch(patch) {
  const data = {};
  for (const key of BULK_PATCH_KEYS) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }
  return data;
}

export async function bulkPatchLieux(knexDb, ids, patch) {
  const data = pickBulkPatch(patch);
  if (!Object.keys(data).length) {
    const err = new Error('Aucun champ autorisé dans patch (type, auteur_id)');
    err.status = 400;
    throw err;
  }
  if (data.auteur_id !== undefined) {
    const auteurId = parseInt(data.auteur_id, 10);
    if (auteurId <= 0) {
      const err = new Error('auteur_id invalide');
      err.status = 400;
      throw err;
    }
    const auteur = await knexDb('users').where({ id: auteurId }).first();
    if (!auteur) {
      const err = new Error('Auteur introuvable');
      err.status = 400;
      throw err;
    }
    data.auteur_id = auteurId;
  }
  if (data.type && !['blacklist', 'favori'].includes(data.type)) {
    const err = new Error('type invalide');
    err.status = 400;
    throw err;
  }

  const updated = await knexDb('lieux').whereIn('id', ids).update({
    ...data,
    updated_at: knexDb.fn.now(),
  });
  return { updated, ids };
}

async function deleteLieuxFiles(knexDb, lieuIds) {
  const photos = await knexDb('photos').whereIn('lieu_id', lieuIds);
  await knexDb('photos').whereIn('lieu_id', lieuIds).del();
  await knexDb('lieux').whereIn('id', lieuIds).del();
  for (const photo of photos) {
    try {
      await fs.unlink(path.join(config.uploadDir, photo.filename));
    } catch {
      /* ignore */
    }
  }
}

export async function bulkDeleteLieux(knexDb, ids) {
  const existing = await knexDb('lieux').whereIn('id', ids).select('id');
  const existingIds = existing.map((r) => r.id);
  if (existingIds.length) await deleteLieuxFiles(knexDb, existingIds);
  return { deleted: existingIds.length, ids: existingIds };
}

export async function bulkGeocodeLieux(knexDb, ids, options = {}) {
  let rows;
  if (ids.length) {
    rows = await knexDb('lieux').whereIn('id', ids).select('id', 'adresse');
  } else {
    rows = await knexDb('lieux')
      .where((b) => b.whereNull('latitude').orWhereNull('longitude'))
      .select('id', 'adresse')
      .limit(BULK_MAX);
  }

  const results = { ok: 0, failed: 0, ids: [] };
  for (const row of rows) {
    await geocodeLieuIfNeeded(knexDb, row.id, row.adresse, null, options);
    const updated = await knexDb('lieux').where({ id: row.id }).first();
    if (updated.geocode_error) results.failed += 1;
    else results.ok += 1;
    results.ids.push(row.id);
  }
  return results;
}

export async function formatAdminUserRow(knexDb, user) {
  const [{ count }] = await knexDb('lieux').where({ auteur_id: user.id }).count({ count: '*' });
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    role: user.role,
    created_at: user.created_at,
    lieux_count: Number(count),
  };
}
