---
name: Mood Explorer
description: Recommandation par état émotionnel — moods, IA, feed, carte, badges, ambiance audio, social
type: feature
---

# Mood Explorer (`/mood`)

## Concept
"Je ne cherche pas un lieu → je cherche une sensation."

## Phase 1
- 7 moods (chill, explore, romantic, food, party, nature, focus) + slider énergie + texte libre + Surprise me
- Edge function `mood-recommend` (Lovable AI Gateway, gemini-2.5-flash, tool calling) — context: météo (fonction `weather`), heure, géoloc, historique
- Tables : `mood_selections`, `mood_places`, `mood_favorites` (RLS user-only)
- Feed swipeable (framer-motion drag y), favoris, historique

## Phase 2
- **Carte Leaflet** (`MoodMap.tsx`) avec markers émojis colorés par mood + clustering (`leaflet.markercluster`) + popups + position user
- **Gamification** : table `mood_badges`, hook `useMoodBadges`, eval auto à chaque changement de contexte. Badges : Mood Curious (3 moods), Hidden Hunter (1 gem sauvé), Mood Master (7 moods), Collector (10 favoris), Social Soul (1 partage)
- **Ambiance audio** (`MoodAmbience.tsx`) : 1 piste CDN Pixabay par mood, popover play/pause/volume, reset au changement de mood
- **Social** : table `mood_reactions` (lecture publique, écriture user-only), realtime channel par place, hook `useMoodSocial` (`useMoodReactions` + `usePopularMoods`), composant `SocialReactions` (mood + emoji + comment) et `PopularMoods` (top 7 jours + derniers ressentis)

## Architecture
- Hook principal : `useMoodExplorer` retourne aussi `badgeContext`
- Page : tabs Feed | Carte | Favoris | Badges | Social + Drawer détail (card + SocialReactions)
- Types Supabase auto-régénérés
