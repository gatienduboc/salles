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
| GET | `/lieux/:id` | Non |
| POST | `/lieux` | JWT |
| PUT | `/lieux/:id` | JWT |
| DELETE | `/lieux/:id` | JWT |
| POST | `/lieux/:id/geocode` | JWT |

### GET /lieux — query params

- `type` : `blacklist` | `favori` (filtre exclusif)
- `ville`, `search`, `page`, `limit` (max 100)
- `sort` : `updated_at` (défaut) | `nom`

Réponse :

```json
{
  "data": [{
    "id": 1,
    "nom": "...",
    "adresse": "...",
    "type": "favori",
    "auteur": { "id": 1, "pseudo": "Demo" },
    "fumee_interdite": null,
    "db_limite": 95,
    "photos": []
  }],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "counts": { "blacklist": 2, "favori": 3 }
  }
}
```

`counts` : totaux par type (hors filtre `type`, mais avec `ville` / `search`).

### POST /lieux — obligatoire

`nom`, `adresse`

### Champs optionnels (POST / PUT)

`type`, `nom_gerant`, `telephone`, `fumee_interdite`, `confetti_interdit`, `db_limite` (entier ≥ 0), `acces_difficile`, `proprio_relou`, `commentaire`, `heure_fermeture`, `sono_imposee`, `date_dernier_evenement` (ISO date)

Booléens : `true`, `false` ou `null` (inconnu).

`auteur_id` : renseigné automatiquement à la création.

## Photos

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/lieux/:id/photos` | JWT (multipart `photos`) |
| DELETE | `/lieux/:id/photos/:photoId` | JWT |

## Exemples curl

```bash
curl -s "http://localhost:3000/lieux?type=favori"
curl -s "http://localhost:3000/lieux?type=blacklist"
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@salles.local","password":"password123"}'
```
