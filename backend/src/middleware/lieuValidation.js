import { body, validationResult } from 'express-validator';

const nullableBool = (field) =>
  body(field)
    .optional({ nullable: true })
    .custom((v) => v === null || typeof v === 'boolean')
    .withMessage(`${field} doit être booléen ou null`);

const optionalFields = [
  body('type').optional().isIn(['blacklist', 'favori']),
  body('nom_gerant').optional({ nullable: true }).isString().trim(),
  body('telephone').optional({ nullable: true }).isString().trim(),
  nullableBool('fumee_interdite'),
  nullableBool('confetti_interdit'),
  nullableBool('acces_difficile'),
  nullableBool('proprio_relou'),
  nullableBool('sono_imposee'),
  body('db_limite')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('db_limite doit être un entier positif'),
  body('commentaire').optional({ nullable: true }).isString(),
  body('heure_fermeture').optional({ nullable: true }).isString().trim(),
  body('date_dernier_evenement')
    .optional({ nullable: true })
    .isISO8601()
    .toDate()
    .withMessage('date_dernier_evenement invalide'),
];

export const lieuCreateRules = [
  body('nom').trim().notEmpty().withMessage('nom est obligatoire'),
  body('adresse').trim().notEmpty().withMessage('adresse est obligatoire'),
  ...optionalFields,
];

export const lieuUpdateRules = [
  body('nom').optional().trim().notEmpty(),
  body('adresse').optional().trim().notEmpty(),
  ...optionalFields,
];

export function validateLieu(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}
