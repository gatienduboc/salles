# Développement

## Stack Docker dev (recommandé)

Tout tourne en Docker avec **code monté en volume** : pas de `docker compose build` à chaque modification.

```bash
cp .env.example .env   # une fois
make dev-up
# ou : docker compose -f docker-compose.dev.yml up -d
```

| URL | Service |
|-----|---------|
| **https://${DOMAIN}** (ex. salle.gatien-duboc.fr) | Frontend via Traefik (Vite HMR) |
| **https://${DOMAIN}/api** | API (proxy Vite → backend) |
| localhost:3307 | MariaDB (accès direct optionnel) |

Les ports 5173 / 3000 ne sont plus exposés sur l’hôte : tout passe par Traefik et le vrai domaine.

Logs en direct : `make dev-logs`

Arrêt : `make dev-down`

### Première fois / après pull

```bash
make dev-up
docker compose -f docker-compose.dev.yml exec backend npx knex seed:run
```

Compte démo : `demo@salles.local` / `password123`

### Volumes

| Volume | Rôle |
|--------|------|
| `./backend` → `/app` | Sources API, rechargement auto |
| `./frontend` → `/app` | Sources Vue, HMR |
| `backend_node_modules` | `node_modules` isolés (évite conflits hôte/Linux) |
| `frontend_node_modules` | idem |
| `./data/mariadb` | Données BDD persistantes |
| `./data/uploads` | Photos |

Modifier un fichier `.vue` ou `.js` → sauvegarde → le navigateur ou l’API se mettent à jour sans rebuild.

### Alternative : npm sur la machine hôte

Si vous préférez ne pas dockeriser Node :

```bash
make db
cd backend && npm run dev
cd frontend && npm run dev
```

Même `.env` avec `DB_HOST=127.0.0.1` et `DB_PORT=3307`.

## Tests

```bash
make test
```

## Passer en production

Quand le dev vous convient, voir [deployment.md](deployment.md) :

1. `make dev-down` (arrêter la stack dev)
2. `make prod-up` (images buildées + Traefik)
3. Seeds si besoin : `docker compose exec backend npx knex seed:run`

**Important** : ne pas lancer `docker compose up` et `docker-compose.dev.yml` en même temps sur les mêmes ports (3000, 5173).
