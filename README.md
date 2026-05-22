# Salles

Répertoire collaboratif de **lieux de réception** (avis, infos pratiques, carte). Évolution prévue : listes thématiques (à éviter / recommandés, etc.).

## Stack

- **Backend** : Node.js, Express, Knex, MariaDB, JWT
- **Frontend** : Vue 3, Vite, Pinia, Leaflet (OpenStreetMap)
- **Géocodage** : Nominatim
- **Déploiement** : Docker Compose + Traefik

## Démarrage rapide

```bash
cp .env.example .env   # puis adapter les secrets
docker compose up -d db
cd backend && npm install && npm run migrate && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

- Interface : http://localhost:5173
- API : http://localhost:3000

Compte démo (seed) : `demo@salles.local` / `password123`

## Documentation

Voir le dossier [docs/](docs/).

## Tests

```bash
cd backend && npm test
cd frontend && npm test
```
