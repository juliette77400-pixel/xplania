---
name: Discover
description: /discover — recommandations locales temps réel (OSM + IA) avec carte, sections, recherche NL, listes, alertes proximité
type: feature
---

# Discover (`/discover`)

## Concept
Hub unifié de découverte locale temps réel. Catégoriel et objectif (vs Mood Explorer émotionnel).

## Architecture
- **DB publique** : `places` (catalogue partagé OSM+IA+community, RLS lecture publique), `place_reviews` (notes 1-5 + comment), `place_lists` + `place_list_items` (RLS user-only via `owns_place_list`), `discover_notifications`
- **Edge functions** :
  - `discover-osm` : Overpass API (gratuit, no-key) → upsert dedup `osm_id`
  - `discover-enrich` : Lovable AI gemini-2.5-flash + tool calling → why_fits, tags, tips, hidden_gem
  - `discover-search` : NL → filtres IA → query Postgres bbox

## Page
- Tabs : **Pour toi** (6 carousels For You/Around/Hidden/Food/Experiences/Chill, sectionnage selon timeOfDay) | **Carte** (Leaflet markercluster) | **Recherche** (SmartSearch IA) | **Mes listes**
- DiscoverHero (heure + météo + position + bouton alertes)
- PlaceDetailDrawer (image, why_fits, tips insider, sauvegarde dans liste, deep-link Google Maps)

## Hooks
- `useDiscover` : géoloc + météo (réutilise `weather`) + seed OSM + enrich + sectionnage memoized
- `usePlaceLists` : CRUD listes + items, liste "Mes favoris" auto-créée
- `useNearbyAlerts` : Notification API si hidden_gem < 250m, cooldown 10min, persiste dans `discover_notifications`

## Cohérence
- Pattern carte aligné sur MoodMap (markercluster, dark cartocdn)
- DS dark/cyan/glassmorphism, Plus Jakarta Sans
- Distinct de Mood (objectif catégoriel) et Suivi (tracking voyage actif)
