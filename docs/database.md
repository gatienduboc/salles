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

## Commandes

```bash
cd backend
npm run migrate
npm run seed
```

Base de test : `MYSQL_DATABASE_TEST=salles_test`
