import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/knex.js';
import { authenticateJWT } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { formatLieu } from '../services/lieux.js';

const router = Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(config.uploadDir, { recursive: true });
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé'));
  },
});

router.post(
  '/lieux/:id/photos',
  authenticateJWT,
  upload.array('photos', 10),
  async (req, res, next) => {
    try {
      const lieu = await db('lieux').where({ id: req.params.id }).first();
      if (!lieu) return res.status(404).json({ error: 'Lieu introuvable' });
      if (!req.files?.length) {
        return res.status(400).json({ error: 'Aucun fichier envoyé' });
      }

      const rows = [];
      for (const file of req.files) {
        const [id] = await db('photos').insert({
          lieu_id: lieu.id,
          filename: file.filename,
        });
        rows.push(
          await db('photos').where({ id }).first()
        );
      }

      const photos = rows.map((p) => ({
        id: p.id,
        url: `${config.apiPublicUrl}/uploads/${p.filename}`,
        filename: p.filename,
        created_at: p.created_at,
      }));

      res.status(201).json({ photos });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/lieux/:id/photos/:photoId',
  authenticateJWT,
  async (req, res, next) => {
    try {
      const photo = await db('photos')
        .where({ id: req.params.photoId, lieu_id: req.params.id })
        .first();
      if (!photo) return res.status(404).json({ error: 'Photo introuvable' });

      await db('photos').where({ id: photo.id }).del();
      try {
        await fs.unlink(path.join(config.uploadDir, photo.filename));
      } catch {
        /* ignore */
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
