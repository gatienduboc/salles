# Base de données

Migrations Knex dans `backend/migrations/`.

## Tables

### users

`id`, `email`, `password_hash`, `pseudo`, `role` (`user`|`admin`), `created_at`

Profil prestataire :

- `activity` (enum : dj, traiteur, wedding_planner, photographe, fleuriste, animation, sonorisation, lieu, autre)
- `city`, `postal_code`, `city_latitude`, `city_longitude`, `city_geocoded_at` — ville d’exercice **géocodée** ; `city` / `postal_code` publics sur les fiches lieu
- `company_name`, `siret`, `phone`, `website_url`, `bio`, `intervention_radius_km`, `has_rc_pro` — privés (espace compte)
- `profile_updated_at`

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
