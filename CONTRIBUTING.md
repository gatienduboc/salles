# Contribution

## Workflow

1. Créer une branche depuis `main`.
2. Implémenter avec tests associés.
3. Mettre à jour `docs/api.md` et `docs/openapi.yaml` pour tout nouvel endpoint.
4. Mettre à jour `docs/database.md` si le schéma change (migration Knex obligatoire).

## Tests

```bash
cd backend && npm test
cd frontend && npm test
```

## Conventions

- Messages de commit en français ou anglais, au choix, mais explicites.
- Pas de secrets dans le dépôt (`.env` est ignoré).
