# API REST

Base URL : `http://localhost:3000` (dev) ou `https://salle.example.fr/api` (prod via proxy).

## Types de lieux

| Valeur | Signification UI |
|--------|------------------|
| `favori` | Recommandé |
| `blacklist` | À éviter |

## Auth

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/auth/register` | Non |
| POST | `/auth/login` | Non |
| POST | `/auth/logout` | Non (204) |

## Lieux

| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/lieux` | Non |
| GET | `/lieux/map` | Non |
| GET | `/lieux/auteurs` | Non |
| GET | `/lieux/:id` | Non |
| POST | `/lieux` | JWT |
| PUT | `/lieux/:id` | JWT |
| DELETE | `/lieux/:id` | JWT |
| POST | `/lieux/:id/geocode` | JWT |
| PUT | `/lieux/:id/rating` | JWT |

Chaque fiche inclut `rating: { average, count, baseline: 5, user_stars?, below_base, above_base }`. Sans vote : `average` = **5** (neutre).

`PUT /lieux/:id/rating` — `{ stars: 0..10 }` : une note par utilisateur (`<5` négatif, `5` neutre, `>5` positif).

### GET /lieux — liste paginée

Query params :

| Param | Description |
|-------|-------------|
| `type` | `blacklist` \| `favori` |
| `ville` | Filtre ville (LIKE) |
| `search` | Nom ou adresse (LIKE) |
| `code_postal` | Préfixe code postal |
| `auteur_id` | ID utilisateur auteur |
| `has_coords` | `true` — uniquement géocodés |
| `page` | Page (défaut 1) |
| `limit` | Taille page 1–100 (défaut 20) |
| `sort` | `updated_at`, `created_at`, `nom`, `ville`, `date_dernier_evenement` |
| `order` | `asc` \| `desc` (défaut `desc`) |

Réponse `meta` :

```json
{
  "page": 2,
  "limit": 20,
  "total": 45,
  "totalPages": 3,
  "hasPrev": true,
  "hasNext": true,
  "sort": "nom",
  "order": "asc",
  "counts": { "blacklist": 20, "favori": 25 }
}
```

### GET /lieux/auteurs — auteurs ayant des fiches

Mêmes filtres que la liste (`type`, `ville`, `search`…) **sans** `auteur_id`. Retourne les pseudos avec le nombre de fiches correspondantes :

```json
{ "data": [{ "id": 2, "pseudo": "Frédéric Fançon", "count": 3 }] }
```

### GET /lieux/map — carte (tous les points filtrés)

Mêmes filtres que la liste (`type`, `ville`, `search`, etc.) + `sort` / `order`. **Sans** pagination.

Retourne uniquement les lieux avec coordonnées. Plafond 500 (`meta.capped` si dépassement).

```json
{
  "data": [{ "id": 1, "nom": "...", "type": "favori", "ville": "Lyon", "latitude": 45.75, "longitude": 4.85 }],
  "meta": { "total": 120, "returned": 120, "capped": false, "max": 500 }
}
```

### POST /lieux — obligatoire

`nom`, `adresse`

### Champs optionnels (POST / PUT)

`type`, `nom_gerant`, `telephone`, `fumee_interdite`, `confetti_interdit`, `db_limite` (entier ≥ 0), `acces_difficile`, `proprio_relou`, `commentaire`, `heure_fermeture`, `sono_imposee`, `date_dernier_evenement` (ISO date)

Booléens : `true`, `false` ou `null` (inconnu).

`auteur_id` : renseigné automatiquement à la création.

## Administration (JWT + rôle `admin`)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/admin/stats` | Tableau de bord |
| GET | `/admin/users` | Liste utilisateurs |
| POST | `/admin/users` | Créer un compte |
| PATCH | `/admin/users/:id` | Modifier pseudo, email, rôle |
| PATCH | `/admin/users/:id/password` | Réinitialiser MDP |
| DELETE | `/admin/users/:id` | Supprimer (si 0 fiche) |
| GET | `/admin/lieux` | Liste (filtres + `sans_coords`, `geocode_error`) |
| PATCH | `/admin/lieux/bulk` | `{ ids, patch: { type?, auteur_id? } }` max 50 |
| DELETE | `/admin/lieux/bulk` | `{ ids }` max 50 |
| POST | `/admin/geocode/bulk` | `{ ids? }` ou lot sans coords (50 max) |

`GET /auth/me` — profil courant (inclut `role`).

`GET /auth/me` — profil enrichi : `lieux_count`, `lieux_counts`, `created_at`.

`PATCH /auth/profile` — JWT : `{ pseudo }` uniquement (email non modifiable). Retourne profil + nouveau `token`.

`PATCH /auth/password` — JWT requis : `{ currentPassword, newPassword }` (min 8 caractères).

Compte admin initial : email `ADMIN_EMAIL` (défaut `gatien.duboc@gmail.com`), promu par migration.

## Photos

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/lieux/:id/photos` | JWT (multipart `photos`) |
| DELETE | `/lieux/:id/photos/:photoId` | JWT |

## Exemples curl

```bash
curl -s "http://localhost:3000/lieux?type=favori&sort=nom&order=asc&page=1&limit=10"
curl -s "http://localhost:3000/lieux/map?type=favori&ville=Lyon"
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@salles.local","password":"password123"}'
```
