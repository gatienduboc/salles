import { verifyToken } from '../utils/jwt.js';

export function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email, pseudo: payload.pseudo };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
