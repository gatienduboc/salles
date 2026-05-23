import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db/knex.js';
import { authenticateJWT, requireAdmin } from '../middleware/auth.js';
import {
  getAdminStats,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
  listAdminLieux,
  bulkPatchLieux,
  bulkDeleteLieux,
  bulkGeocodeLieux,
  parseIds,
  formatAdminUserRow,
} from '../services/admin.js';

const router = Router();

router.use(authenticateJWT, requireAdmin);

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

router.get('/admin/stats', async (req, res, next) => {
  try {
    res.json(await getAdminStats(db));
  } catch (err) {
    next(err);
  }
});

router.get('/admin/users', async (req, res, next) => {
  try {
    res.json(await listAdminUsers(db, req.query));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/admin/users',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('pseudo').trim().isLength({ min: 2, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const user = await createAdminUser(db, req.body, req.geocodeOptions);
      res.status(201).json(await formatAdminUserRow(db, user));
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
);

router.patch(
  '/admin/users/:id',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('pseudo').optional().trim().isLength({ min: 2, max: 100 }),
    body('role').optional().isIn(['user', 'admin']),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const user = await updateAdminUser(db, req.params.id, req.body, req.user);
      res.json(await formatAdminUserRow(db, user));
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
);

router.patch(
  '/admin/users/:id/password',
  body('password').isLength({ min: 8 }),
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      await resetAdminUserPassword(db, req.params.id, req.body.password);
      res.status(204).send();
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  }
);

router.delete('/admin/users/:id', async (req, res, next) => {
  try {
    await deleteAdminUser(db, req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.get('/admin/lieux', async (req, res, next) => {
  try {
    res.json(await listAdminLieux(db, req.query));
  } catch (err) {
    next(err);
  }
});

router.patch('/admin/lieux/bulk', async (req, res, next) => {
  try {
    const ids = parseIds(req.body.ids);
    if (!ids.length) return res.status(400).json({ error: 'ids requis (max 50)' });
    const result = await bulkPatchLieux(db, ids, req.body.patch || {});
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.delete('/admin/lieux/bulk', async (req, res, next) => {
  try {
    const ids = parseIds(req.body.ids);
    if (!ids.length) return res.status(400).json({ error: 'ids requis (max 50)' });
    res.json(await bulkDeleteLieux(db, ids));
  } catch (err) {
    next(err);
  }
});

router.post('/admin/geocode/bulk', async (req, res, next) => {
  try {
    const ids = req.body.ids ? parseIds(req.body.ids) : [];
    const result = await bulkGeocodeLieux(db, ids, req.geocodeOptions);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
