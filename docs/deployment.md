# Déploiement (production)

## Dev vs prod

| | Développement | Production |
|---|---------------|------------|
| Fichier Compose | `docker-compose.dev.yml` | `docker-compose.yml` |
| Commande | `make dev-up` | `make prod-up` |
| Code | Volumes → hot reload | Copié dans l’image au **build** |
| Frontend | Vite `:5173` | Nginx + fichiers statiques |
| Backend | `npm run dev` (`--watch`) | `node src/index.js` |
| Exposition | Ports locaux 5173, 3000 | Traefik + HTTPS |
| API côté navigateur | `http://localhost:3000` ou proxy `/api` | `https://${DOMAIN}/api` |

## Passage dev → prod (checklist)

1. **Arrêter le dev** pour libérer les ports :
   ```bash
   make dev-down
   ```

2. **Vérifier `.env`** (secrets, domaines) :
   - `DOMAIN`, `API_DOMAIN`
   - `JWT_SECRET`, mots de passe MySQL
   - `NOMINATIM_USER_AGENT` avec une URL de contact valide

3. **Construire et lancer la prod** :
   ```bash
   make prod-up
   ```
   Équivalent : `docker compose up -d --build`

4. **Migrations** (exécutées au démarrage du conteneur backend) ; seeds optionnels :
   ```bash
   docker compose exec backend npx knex seed:run
   ```

5. **Contrôles** :
   - https://${DOMAIN} — interface
   - https://${DOMAIN}/api/health — API via proxy Nginx
   - `docker compose ps` — tous les services `Up`

6. **Après chaque changement de code en prod** :
   ```bash
   docker compose up -d --build backend frontend
   ```
   (ou `make prod-up` pour tout reconstruire)

## Prérequis

- Réseau Docker externe `traefik_web_bk`
- DNS `DOMAIN` et éventuellement `API_DOMAIN` pointant vers le serveur
- Certificats gérés par Traefik (`lets-encrypt`)

## Sauvegardes

- `./data/mariadb` — base MariaDB
- `./data/uploads` — photos des lieux

## Retour en dev

```bash
make prod-down
make dev-up
```

Les données MariaDB sont **partagées** entre dev et prod si vous utilisez le même volume `./data/mariadb`.
