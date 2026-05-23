# Géocodage

## Lieux (nom + adresse)

Chaque lieu est géocodé avec **`nom` + `adresse`** (ex. `CCA Châtenois, 4 Rue Saint-Georges, 67730 Châtenois`) pour éviter les homonymes (Châtenois 67 vs 88).

**Provider :**

1. **Google Maps** si `GOOGLE_MAPS_API_KEY` est défini (Places Text Search, puis Geocoding API)
2. Sinon **Nominatim** sur la même requête combinée

Re-géocoder toute la base :

```bash
cd backend
npm run geocode:all:force
```

## Saisie (formulaire)

- `GET /address/suggest?q=...` : suggestions OpenStreetMap (autocomplétion adresse uniquement).

## Déclenchement

- Création ou modification d’un lieu si l’`adresse` change
- `POST /lieux/:id/geocode` pour forcer un retry
- Admin : bulk géocode

## Variables d’environnement

| Variable | Rôle |
|----------|------|
| `GOOGLE_MAPS_API_KEY` | Géocodage lieux via Google (recommandé) |
| `NOMINATIM_USER_AGENT` | Fallback OSM + suggestions adresse |

## Champs remplis

`latitude`, `longitude`, `ville`, `code_postal`, `geocoded_at` ou `geocode_error`

Avec Google : `google_place_id` (lien fiche établissement, exposé en API comme `google_maps_url`).

## Dépannage

- Adresse complète avec code postal (éviter « Châtenois, Vosges » seul)
- Consulter `geocode_error` sur la fiche
- `npm run geocode:all:force` après correction d’adresses en base
