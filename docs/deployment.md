# Déploiement

## Docker Compose + Traefik

1. Réseau externe `traefik_web_bk` doit exister.
2. Configurer `.env` : `DOMAIN`, `API_DOMAIN`, secrets MySQL et `JWT_SECRET`.
3. `docker compose up -d --build`
4. Seeds : `docker compose exec backend npx knex seed:run`

## Sauvegardes

- `./data/mariadb` — données MariaDB
- `./data/uploads` — photos

## Nominatim

Définir un User-Agent valide avec contact réel dans `NOMINATIM_USER_AGENT`.

## TODO

- CI (GitHub Actions) avec service MariaDB
- Swagger UI en dev (`/docs`)
