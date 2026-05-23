import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { db } from '../db/knex.js';
import { config } from '../config/index.js';
import { signToken } from '../utils/jwt.js';
import { authenticateJWT } from '../middleware/auth.js';
import { PROVIDER_ACTIVITIES } from '../constants/providerActivities.js';
import { geocodeProviderCity } from '../services/geocoding.js';
import {
  pickProfileBody,
  validateSiret,
  formatMe,
  formatSessionUser,
  needsCityGeocode,
} from '../services/userProfile.js';

const router = Router();

const registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('pseudo').trim().isLength({ min: 2, max: 100 }),
  body('activity').isIn(PROVIDER_ACTIVITIES),
  body('city').trim().isLength({ min: 2, max: 100 }),
  body('postal_code').optional({ values: 'falsy' }).trim().isLength({ max: 10 }),
  body('company_name').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
];

const profileRules = [
  body('pseudo').optional().trim().isLength({ min: 2, max: 100 }),
  body('activity').optional().isIn(PROVIDER_ACTIVITIES),
  body('city').optional().trim().isLength({ min: 2, max: 100 }),
  body('postal_code').optional({ values: 'null' }).trim().isLength({ max: 10 }),
  body('company_name').optional({ values: 'null' }).trim().isLength({ max: 150 }),
  body('siret').optional({ values: 'null' }).trim(),
  body('phone').optional({ values: 'null' }).trim().isLength({ max: 20 }),
  body('website_url').optional({ values: 'null' }).trim().isLength({ max: 255 }),
  body('bio').optional({ values: 'null' }).trim().isLength({ max: 500 }),
  body('intervention_radius_km').optional({ values: 'null' }).isInt({ min: 0, max: 500 }),
  body('has_rc_pro').optional({ nullable: true }).isBoolean(),
];

router.post('/auth/register', registerRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, pseudo, activity, city, postal_code, company_name } = req.body;
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const geo = await geocodeProviderCity(city, postal_code, req.geocodeOptions);
    if (geo.error) {
      return res.status(400).json({ error: geo.error });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const role = email === config.adminEmail ? 'admin' : 'user';
    const [id] = await db('users').insert({
      email,
      password_hash,
      pseudo,
      role,
      activity,
      city: geo.city,
      postal_code: geo.postal_code,
      city_latitude: geo.city_latitude,
      city_longitude: geo.city_longitude,
      city_geocoded_at: geo.city_geocoded_at,
      company_name: company_name || null,
      profile_updated_at: db.fn.now(),
    });

    const user = await db('users').where({ id }).first();
    const token = signToken(user);
    res.status(201).json({
      token,
      user: formatSessionUser(user),
    });
  } catch (err) {
    next(err);
  }
});

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 8 }).withMessage('Nouveau mot de passe : 8 caractères minimum'),
];

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await db('users').where({ email: normalizedEmail }).first();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: formatSessionUser(user),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/logout', (req, res) => {
  res.status(204).send();
});

router.patch('/auth/password', authenticateJWT, changePasswordRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: user.id }).update({ password_hash });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

async function buildMeResponse(userId) {
  const user = await db('users').where({ id: userId }).first();
  if (!user) return null;

  const counts = { blacklist: 0, favori: 0, total: 0 };
  const rows = await db('lieux')
    .where({ auteur_id: userId })
    .select('type')
    .count({ count: '*' })
    .groupBy('type');
  for (const r of rows) {
    counts[r.type] = Number(r.count);
    counts.total += Number(r.count);
  }

  return formatMe(user, counts);
}

router.get('/auth/me', authenticateJWT, async (req, res, next) => {
  try {
    const me = await buildMeResponse(req.user.id);
    if (!me) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(me);
  } catch (err) {
    next(err);
  }
});

router.patch('/auth/profile', authenticateJWT, profileRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patch = pickProfileBody(req.body);
    if (!Object.keys(patch).length) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    if (patch.siret !== undefined) {
      const siretErr = validateSiret(patch.siret);
      if (siretErr) return res.status(400).json({ error: siretErr });
    }

    if (patch.website_url) {
      try {
        const u = new URL(patch.website_url);
        if (!['http:', 'https:'].includes(u.protocol)) {
          return res.status(400).json({ error: 'URL du site : http ou https uniquement' });
        }
      } catch {
        return res.status(400).json({ error: 'URL du site invalide' });
      }
    }

    const existing = await db('users').where({ id: req.user.id }).first();
    if (needsCityGeocode(patch, existing)) {
      const geo = await geocodeProviderCity(
        patch.city ?? existing.city,
        patch.postal_code ?? existing.postal_code,
        req.geocodeOptions
      );
      if (geo.error) return res.status(400).json({ error: geo.error });
      Object.assign(patch, {
        city: geo.city,
        postal_code: geo.postal_code,
        city_latitude: geo.city_latitude,
        city_longitude: geo.city_longitude,
        city_geocoded_at: geo.city_geocoded_at,
      });
    }

    patch.profile_updated_at = db.fn.now();
    const updated = await db('users').where({ id: req.user.id }).update(patch);
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const me = await buildMeResponse(req.user.id);
    const token = signToken(await db('users').where({ id: req.user.id }).first());
    res.json({ ...me, token });
  } catch (err) {
    next(err);
  }
});

export default router;
