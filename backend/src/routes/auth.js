import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { db } from '../db/knex.js';
import { config } from '../config/index.js';
import { signToken } from '../utils/jwt.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

const registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('pseudo').trim().isLength({ min: 2, max: 100 }),
];

router.post('/auth/register', registerRules, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, pseudo } = req.body;
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const role = email === config.adminEmail ? 'admin' : 'user';
    const [id] = await db('users').insert({ email, password_hash, pseudo, role });

    const user = await db('users').where({ id }).first();
    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
  body('newPassword').isLength({ min: 8 }).withMessage('Nouveau mot de passe : 8 caractères minimum'),
];

const profileRules = [
  body('pseudo').trim().isLength({ min: 2, max: 100 }).withMessage('Pseudo : 2 à 100 caractères'),
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
      user: { id: user.id, email: user.email, pseudo: user.pseudo, role: user.role },
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

  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
    role: user.role,
    created_at: user.created_at,
    lieux_count: counts.total,
    lieux_counts: { blacklist: counts.blacklist, favori: counts.favori },
  };
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

    const { pseudo } = req.body;
    const updated = await db('users').where({ id: req.user.id }).update({ pseudo });
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const me = await buildMeResponse(req.user.id);
    const token = signToken(await db('users').where({ id: req.user.id }).first());
    res.json({ ...me, token });
  } catch (err) {
    next(err);
  }
});

export default router;
