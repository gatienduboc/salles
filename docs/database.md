# Base de données

Migrations Knex dans `backend/migrations/`.

## Tables

### users

`id`, `email`, `password_hash`, `pseudo`, `role` (`user`|`admin`), `created_at`

### lieux

Champs métier + géocodage :

- `latitude`, `longitude`, `ville`, `code_postal`
- `geocoded_at`, `geocode_error`
- `type` : `blacklist` | `favori`

### photos

`lieu_id` → `lieux.id` (CASCADE), `filename`

### lieu_ratings

`lieu_id`, `user_id` (unique par couple), `stars` (0–10, **5 = neutre**), `value` (dérivé : -1 / 0 / 1). Un vote par utilisateur et par salle (upsert).

## Commandes

```bash
cd backend
npm run migrate
npm run seed
```

Base de test : `MYSQL_DATABASE_TEST=salles_test`
