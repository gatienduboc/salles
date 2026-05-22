import { Router } from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { db } from '../db/knex.js';
import { signToken } from '../utils/jwt.js';

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
    const [id] = await db('users').insert({ email, password_hash, pseudo });

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

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const user = await db('users').where({ email }).first();
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

export default router;
