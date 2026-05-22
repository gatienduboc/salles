# Géocodage (Nominatim)

## Déclenchement

- Création ou modification d’un lieu si l’`adresse` change
- `POST /lieux/:id/geocode` pour forcer un retry

## Politique OSM

- User-Agent obligatoire (`NOMINATIM_USER_AGENT`)
- ~1 requête/seconde (file côté serveur)
- Cache : pas de nouvel appel si adresse inchangée et `geocoded_at` présent

## Champs remplis

`latitude`, `longitude`, `ville`, `code_postal`, `geocoded_at` ou `geocode_error`

## Dépannage

- Vérifier l’adresse (format postal complet, France)
- Consulter `geocode_error` sur la fiche
- Relancer via PUT avec adresse corrigée ou `POST /lieux/:id/geocode`
