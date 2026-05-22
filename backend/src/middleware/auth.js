import { verifyToken } from '../utils/jwt.js';
import { db } from '../db/knex.js';

export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = {
      id: payload.sub,
      email: payload.email,
      pseudo: payload.pseudo,
      role: payload.role || 'user',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    if (req.user?.role !== 'admin') {
      const row = await db('users').where({ id: req.user.id }).select('role').first();
      if (row?.role === 'admin') req.user.role = 'admin';
    }
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }
    next();
  } catch (err) {
    next(err);
  }
}
