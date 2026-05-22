# Architecture

```mermaid
flowchart LR
  User[Navigateur]
  Traefik[Traefik]
  FE[frontend Nginx]
  API[backend Express]
  DB[(MariaDB)]
  OSM[Nominatim]

  User --> Traefik
  Traefik --> FE
  Traefik --> API
  FE -->|proxy /api| API
  API --> DB
  API --> OSM
```

## Composants

- **frontend** : SPA Vue 3 servie par Nginx ; en production, proxy `/api` et `/uploads` vers le backend.
- **backend** : API REST stateless, JWT pour l’écriture.
- **db** : MariaDB, réseau interne uniquement (pas d’exposition Traefik).

## Auth

JWT Bearer après `POST /auth/login` ou `/auth/register`. Lecture des lieux sans token.

## Fichiers uploadés

Stockés dans `data/uploads/` (volume Docker monté sur le backend).
