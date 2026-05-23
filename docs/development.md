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
docker compose -f docker-compose.dev.yml exec backend npx knex migrate:latest
docker compose -f docker-compose.dev.yml exec backend npx knex seed:run
```

Si le profil renvoie une erreur du type `Unknown column 'city_latitude'`, la migration `010_user_city_geocode` n’a pas été appliquée : relancer `knex migrate:latest` ci-dessus.

Compte démo : `demo@salles.local` / `password123`

### Administration

- Email admin (`.env` `ADMIN_EMAIL`, défaut `gatien.duboc@gmail.com`) : promu via migration `004_promote_admin`
- Mot de passe admin par défaut : `ADMIN_DEFAULT_PASSWORD` (défaut `password123`) — réinitialiser avec `make seed-admin-password` ou `npm run seed:admin-password` dans `backend/`
- **Mon compte** (connecté) : `/compte` — profil (pseudo), mot de passe, lien vers mes fiches
- Interface : `/admin` (tableau de bord, utilisateurs, salles avec actions en masse)
- Édition **unitaire** d’une fiche : tout utilisateur connecté (inchangé)
- Éditions **en masse** : admin uniquement (`PATCH/DELETE /admin/lieux/bulk`, `POST /admin/geocode/bulk`)

### Jeu de données Alsace / Est (notes terrain)

```bash
# Sans effacer la BDD (ajoute ~26 fiches si absentes)
make seed-est
# ou en Docker :
docker compose -f docker-compose.dev.yml exec backend npm run seed:est

# Géocoder les adresses (Nominatim, ~30 s pour 26 lieux)
make geocode-est
```

Un seul lieu est en **favori** (Bollwiller, retour juin 2024) ; le reste est en **à éviter**. Corriger noms/adresses dans `backend/seeds/003_lieux_est.js` si besoin. Les imports réels (DJ, etc.) se font via l’interface ou l’API — pas de seed dédié.

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
