import { config } from '../config/index.js';

function isDatabaseError(err) {
  if (!err) return false;
  if (err.code?.startsWith?.('ER_')) return true;
  if (err.sqlState || err.sqlMessage) return true;
  if (typeof err.sql === 'string') return true;
  const msg = String(err.message || '');
  return /\b(select|insert|update|delete|unknown column)\b/i.test(msg);
}

/** Message sûr pour le client (jamais de SQL brut). */
function clientMessage(err) {
  if (err.status && err.status >= 400 && err.status < 500 && err.message) {
    return err.message;
  }
  if (isDatabaseError(err)) {
    return 'Enregistrement impossible (erreur technique). Réessayez ou contactez un administrateur.';
  }
  if (config.nodeEnv !== 'production' && err.message) {
    return err.message;
  }
  return 'Erreur serveur';
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 5 Mo)' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Champ fichier invalide' });
  }

  console.error(err);

  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { error: clientMessage(err) };

  if (config.nodeEnv !== 'production' && err.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}
