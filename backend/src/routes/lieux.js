import { Router } from 'express';
import { db } from '../db/knex.js';
import { authenticateJWT } from '../middleware/auth.js';
import {
  lieuCreateRules,
  lieuUpdateRules,
  validateLieu,
} from '../middleware/lieuValidation.js';
import { geocodeLieuIfNeeded } from '../services/geocoding.js';
import {
  pickLieuBody,
  formatLieu,
  listLieux,
  listLieuxForMap,
  listLieuxAuteurs,
  fetchLieuById,
} from '../services/lieux.js';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';

const router = Router();

async function getLieuWithPhotos(id) {
  const row = await fetchLieuById(id);
  if (!row) return null;
  const photos = await db('photos').where({ lieu_id: id });
  return formatLieu(row, photos);
}

router.get('/lieux', async (req, res, next) => {
  try {
    const result = await listLieux(db, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/lieux/map', async (req, res, next) => {
  try {
    const result = await listLieuxForMap(db, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/lieux/auteurs', async (req, res, next) => {
  try {
    const result = await listLieuxAuteurs(db, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/lieux/:id', async (req, res, next) => {
  try {
    const lieu = await getLieuWithPhotos(req.params.id);
    if (!lieu) return res.status(404).json({ error: 'Lieu introuvable' });
    res.json(lieu);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/lieux',
  authenticateJWT,
  lieuCreateRules,
  validateLieu,
  async (req, res, next) => {
    try {
      const data = pickLieuBody(req.body);
      data.auteur_id = req.user.id;
      if (!data.type) data.type = 'blacklist';

      const [id] = await db('lieux').insert(data);
      await geocodeLieuIfNeeded(db, id, data.adresse, null, req.geocodeOptions);

      const lieu = await getLieuWithPhotos(id);
      res.status(201).json(lieu);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/lieux/:id',
  authenticateJWT,
  lieuUpdateRules,
  validateLieu,
  async (req, res, next) => {
    try {
      const existing = await db('lieux').where({ id: req.params.id }).first();
      if (!existing) return res.status(404).json({ error: 'Lieu introuvable' });

      const data = pickLieuBody(req.body);
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      }

      await db('lieux')
        .where({ id: req.params.id })
        .update({ ...data, updated_at: db.fn.now() });

      const adresse = data.adresse ?? existing.adresse;
      await geocodeLieuIfNeeded(
        db,
        req.params.id,
        adresse,
        existing.adresse,
        req.geocodeOptions
      );

      const lieu = await getLieuWithPhotos(req.params.id);
      res.json(lieu);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/lieux/:id', authenticateJWT, async (req, res, next) => {
  try {
    const existing = await db('lieux').where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ error: 'Lieu introuvable' });

    const photos = await db('photos').where({ lieu_id: req.params.id });
    await db('lieux').where({ id: req.params.id }).del();

    for (const photo of photos) {
      try {
        await fs.unlink(path.join(config.uploadDir, photo.filename));
      } catch {
        /* fichier déjà absent */
      }
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/lieux/:id/geocode', authenticateJWT, async (req, res, next) => {
  try {
    const existing = await db('lieux').where({ id: req.params.id }).first();
    if (!existing) return res.status(404).json({ error: 'Lieu introuvable' });

    await geocodeLieuIfNeeded(db, req.params.id, existing.adresse, null, req.geocodeOptions);
    const lieu = await getLieuWithPhotos(req.params.id);
    res.json(lieu);
  } catch (err) {
    next(err);
  }
});

export default router;
