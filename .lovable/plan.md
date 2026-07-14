# Vague 1 — Tinder Onboarding Voyageur

## Ce qu'on construit

Un parcours de swipe obligatoire après inscription qui construit un profil voyageur (12 dimensions), calcule un badge, et redirige vers 2 fonctionnalités recommandées.

## 1. Base de données (migration Supabase)

**Table `tinder_cards`** (lecture publique authentifiée)
- `id uuid PK`, `name text unique`, `image_url text`, `unsplash_query text`, `phrase_fr text`, `phrase_en text`, `score_tags jsonb`, `order_index int`, `active bool default true`, `created_at`

**Table `traveler_profiles`** (RLS: user_id = auth.uid())
- `id uuid PK`, `user_id uuid unique FK→auth.users`, les 12 colonnes de score `int default 0`, `badge text`, `badge_description text`, `recommended_features text[]`, `completed_at timestamptz`, `created_at`, `updated_at`

**Table `user_swipes`** (RLS: user_id = auth.uid())
- `id`, `user_id`, `card_id FK`, `direction text check in ('right','left','skip')`, `created_at`, unique(user_id, card_id)

GRANTs standard (authenticated + service_role), RLS + policies, trigger `updated_at`.

## 2. Seed des 20 cartes

Migration d'INSERT avec les 20 cartes de la spec (phrases FR + EN + score_tags). `image_url` initialement null.

Edge function `tinder-cards-seed-images` (admin one-shot): pour chaque carte sans image, appelle `unsplash` avec `unsplash_query` et enregistre l'URL. Déclenchable via un bouton admin ou automatiquement à la 1ʳᵉ visite si vide.

## 3. Écran de swipe `/profil-voyageur`

Nouveau composant `TinderOnboarding` avec sous-composants:
- `TinderCard` — image plein cadre, dégradé sombre bas, phrase en overlay, drag+rotation via framer-motion
- `TinderDeck` — stack de 2 cartes (courante + suivante en scale-95 dessous)
- `TinderControls` — 3 boutons ❌ ⏭️ ❤️ + raccourcis clavier ←/→/espace
- `TinderProgress` — barre "7 / 20" + message dynamique (5 paliers FR/EN via i18n)

Comportement:
- Ordre mélangé une fois au montage (seed = user_id pour reproductibilité)
- Swipe droite/gauche/skip → insert dans `user_swipes` + update optimiste des scores locaux
- Debounce des writes (batch toutes les 3 cartes) pour limiter les allers-retours
- Reprise: si `user_swipes` contient déjà des lignes, on reprend là où on en était
- À la 20ᵉ carte → `finalizeProfile()`: calcule badge, upsert `traveler_profiles` avec `completed_at`, navigue vers `/profil-voyageur/resultat`

## 4. Calcul du badge

`src/lib/traveler-badge.ts` — fonction pure `calculateBadge(scores)` identique à la spec + normalisation (clamp min 0 pour affichage, garde interne signée) + fallback "Voyageur curieux".

Table de mapping badge → 2 features recommandées:
- Explorateur culturel → Discover + Carnet
- Digital Nomad → Guide Budget + Suivi
- Voyageur détente → Guide Valise + Mood
- Aventurier → Suivi + Mood Explorer
- Voyageur nature → Mood + Discover
- Voyageur gastronomique → Discover + Carnet
- Voyageur bien-être → Mood + Guide Valise
- Voyageur social → Mood + Carnet (partage)
- Voyageur organisé → Guide Budget + Guide Visa
- Voyageur économe → Guide Budget + Guide Valise
- Voyageur curieux → Discover + Mood

Tests unitaires Vitest sur `calculateBadge` (cas top1+top2 match, fallback, égalités, tous à 0).

## 5. Écran de révélation `/profil-voyageur/resultat`

- Titre "Votre profil voyageur : {badge}"
- Radar chart des 12 scores (recharts, déjà installé)
- Description chaleureuse 2-3 phrases par badge (i18n FR/EN)
- 2 cartes "fonctionnalités recommandées" avec icône, titre, CTA
- Bouton secondaire "Refaire le test" (efface `user_swipes` + reset profil)

## 6. Redirection obligatoire après signup

- Nouveau hook `useTravelerProfile()` — React Query sur `traveler_profiles` par `user_id`
- Nouveau composant `<RequireTravelerProfile>` qui wrap les routes protégées: si `user` connecté ET `completed_at` null ET route ≠ `/profil-voyageur*` → `<Navigate to="/profil-voyageur" replace />`
- On l'insère dans `App.tsx` autour de `<ProtectedRoute>` sur Dashboard/Carnet/Suivi/etc. (pas sur `/`, `/auth`, `/legal`)
- Skip toléré uniquement si l'utilisateur est déjà en train de finir le parcours

## 7. i18n

Nouveau namespace `travelerProfile` dans `src/i18n/locales/{fr,en}.json`:
- Phrases des 20 cartes (redondant avec DB mais permet UI côté client sans requête)
- Messages de progression
- Noms + descriptions des 11 badges
- Labels du radar (12 dimensions)

## Détails techniques

- Framer-motion déjà présent, on l'utilise pour le drag (`useMotionValue`, `useTransform` pour la rotation)
- Recharts pour le radar
- Les scores en DB sont signés (int), l'affichage clampe à 0 mais le calcul du badge utilise les valeurs brutes
- Edge function d'upsert final `finalize-traveler-profile` optionnelle si on veut sécuriser le calcul serveur; sinon on fait tout côté client puisque RLS protège déjà
- Route `/profil-voyageur` et `/profil-voyageur/resultat` publiques mais requièrent auth (redirige vers `/auth` si pas de user)

## Ce qu'on ne fait PAS dans cette vague

- Pas de `user_memory` / `user_recommendations_history`
- Pas de RAG, pas de destinations/hidden_gems
- Pas de refonte Suivi
- Pas de vraies récompenses (crédits, quota) — juste badge cosmétique + 2 features recommandées

## Livraison

Une seule migration DB (tables + seed 20 cartes sans image), puis code frontend + edge function seed-images. Après validation de la migration je code le reste dans la foulée.
