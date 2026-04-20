---
name: Mood Explorer
description: /mood feature — émotion-based recommendations with AI, swipeable feed, favorites
type: feature
---
# Mood Explorer (/mood)

Phase 1 : sélection mood immersive + moteur IA + feed swipeable + favoris + historique.

## Tables
- `mood_selections` : historique mood + contexte (lat/lng, weather, time_of_day, energy_level, free_input)
- `mood_places` : lieux recommandés (name, why_fits émotionnel, tags[], distance, duration, hidden_gem, score, image_url Unsplash)
- `mood_favorites` : favoris user_id+place_id unique, lien optionnel trip_id

## Edge function
`mood-recommend` : Lovable AI Gateway (gemini-2.5-flash) avec tool calling structuré → 6 lieux. Inputs : mood, free_input, energy_level, lat/lng, weather (auto via fonction `weather`), time_of_day, history (5 derniers). Persiste selection + places. Gère 429/402.

## UI
- `MoodSelector` : 7 bulles moods (chill/explore/romantic/food/party/nature/focus) + slider énergie + textarea + "Surprise me"
- `MoodFeed` : swipeable type TikTok (framer-motion drag vertical), boutons up/down
- `MoodPlaceCard` : image hero, why_fits en italique gros, tags, distance/durée, tips, bouton "Y aller" (Google Maps)
- `MoodHero` : header avec mood actif + météo + heure + position
- `MoodFavorites` + historique cliquable (relance reco)

## Phase 2 à venir
Carte Leaflet, gamification (badges mood + lien explore_progress), ambiance sonore, dimension sociale.
