# API REST

Base URL : `https://api.example.com` (voir `API_PUBLIC_URL`).

## Auth

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/auth/register` | Non |
| POST | `/auth/login` | Non |
| POST | `/auth/logout` | Non (204) |

### Register / Login body

```json
{ "email": "dj@example.com", "password": "password123", "pseudo": "MonPseudo" }
```

Réponse : `{ "token": "...", "user": { "id", "email", "pseudo", "role" } }`

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

- `type` : `blacklist` | `favori`
- `ville` : filtre sur ville géocodée (LIKE)
- `search` : nom ou adresse
- `page`, `limit` (défaut 20, max 100)

Réponse :

```json
{
  "data": [ { "id", "nom", "adresse", "ville", "latitude", "longitude", "photos": [] } ],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

### POST /lieux — champs obligatoires

`nom`, `adresse`

## Photos

| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/lieux/:id/photos` | JWT (multipart `photos`) |
| DELETE | `/lieux/:id/photos/:photoId` | JWT |

## Santé

`GET /health` → `{ "status": "ok", "db": "ok" }`

## Exemples curl

```bash
curl -s http://localhost:3000/lieux?ville=Paris
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@salles.local","password":"password123"}'
```
