# Salles

Répertoire collaboratif de **lieux de réception** — fiches **recommandées** ou **à éviter**, avec carte et filtres.

## Développement (Docker, sans rebuild)

```bash
cp .env.example .env
make dev-up
docker compose -f docker-compose.dev.yml exec backend npx knex seed:run
```

- **https://salle.gatien-duboc.fr** — interface (modifs instantanées, Traefik)
- API : **https://salle.gatien-duboc.fr/api**

Compte démo : `demo@salles.local` / `password123`

Voir [docs/development.md](docs/development.md).

## Production

```bash
make dev-down          # arrêter le dev si actif
make prod-up           # build + Traefik + HTTPS
```

Voir [docs/deployment.md](docs/deployment.md) pour le passage dev → prod.

## Tests

```bash
make test
```

## Documentation

[docs/](docs/)
