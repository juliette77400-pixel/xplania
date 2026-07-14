
## 1. État des lieux — Tinder actuel

**Fichiers concernés**
- `src/pages/TravelerProfileOnboarding.tsx` — écran principal du swipe (20 cartes)
- `src/components/tinder/TinderCard.tsx` — composant carte (drag + animations framer-motion)
- `src/pages/TravelerProfileResult.tsx` — écran de révélation du badge après le swipe
- Table `tinder_cards` (contenu des cartes) + `user_swipes` (historique par user) + `traveler_profiles` (badge + scores 12D + recommended_features + reward_points)
- Edge function `tinder-seed-images` (génère les visuels manquants)

**Où il apparaît dans le parcours aujourd'hui**
- Route : `/profil-voyageur` (protégée par `ProtectedRoute skipOnboarding`)
- `ProtectedRoute` **force** tout utilisateur connecté qui n'a pas encore de `traveler_profiles.completed_at` à être redirigé vers `/profil-voyageur` → le Tinder est donc **obligatoire, après l'inscription/connexion**, avant l'accès au reste de l'app.
- Reprise automatique déjà en place : les swipes déjà faits sont rechargés depuis `user_swipes`, les scores sont recalculés et un toast "resumed" s'affiche.
- Pas de lien avec la création d'un voyage.

**Connexion à `traveler_profiles`**
- Oui, pleinement connecté. À la fin des 20 cartes, `finalize()` fait un `upsert` dans `traveler_profiles` avec : les 12 scores dimensionnels, le `badge`, `recommended_features`, `reward_points`, `reward_unlocks`, `completed_at`. Puis redirection vers `/profil-voyageur/resultat`.
- Ce n'est **plus une maquette isolée** — la data flow est complète.

**Ce qui manque pour la nouvelle cible**
- Pas d'étape "Promesse", "Besoin", "Mini qualification" avant le Tinder.
- L'auth (`ProtectedRoute`) intercepte AVANT même la promesse → un visiteur non connecté ne voit rien de l'entonnoir.
- Pas de tracking `onboarding_step` pour reprendre à l'étape exacte.
- Pas d'écran "Essai limité" entre les 2 fonctionnalités recommandées et le dashboard.

---

## 2. Nouveau parcours cible

```text
[public]                                      [auth requise]
Promesse → Besoin → MiniQualif → Tinder → [SIGN-UP] → Profil → 2 Features → Essai → Dashboard
  /welcome  /besoin   /qualif    /profil-voyageur
                                 /profil-voyageur/resultat
                                 /profil-voyageur/features
                                 /profil-voyageur/essai
                                 /app
```

**Moment de création du compte** : entre le Tinder et la révélation du profil.
Raison : l'utilisateur a déjà investi ~2 min de swipe → il est engagé, la friction du signup est acceptable, et on a besoin d'un `user_id` pour persister les scores calculés côté serveur dans `traveler_profiles`. Avant le signup, les réponses (besoin, qualif, swipes) sont stockées en `localStorage` sous la clé `xplania:onboarding` puis rejouées après création du compte.

---

## 3. Détail des étapes

| # | Route | Contenu | Auth ? |
|---|---|---|---|
| 1 | `/welcome` | Une phrase promesse + CTA "Commencer". Redirection automatique vers l'étape courante si onboarding en cours. | non |
| 2 | `/onboarding/besoin` | Liste de 5-6 besoins (cartes cliquables) : "Je ne sais pas où partir", "Je prépare un voyage", "Peur du budget", "Envie d'insolite", "Voyager autrement", "Juste curieux". Multi-sélection possible. | non |
| 3 | `/onboarding/qualif` | 3 questions rapides : budget approximatif (slider 3 crans), durée type (weekend / 1 sem / 2+ sem), avec qui (seul / couple / famille / amis). Sert à moduler le ton et l'ordre des cartes Tinder. | non |
| 4 | `/onboarding/tinder` | **Le Tinder existant, déplacé ici**. Fonctionne en mode anonyme (état local) tant que non connecté ; les swipes sont mis en tampon dans localStorage. À la 20e carte → redirection vers `/onboarding/signup`. | non |
| 5 | `/onboarding/signup` | Auth (email + Google). Après succès : rejoue les données locales → écrit `user_swipes` + `traveler_profiles` via `finalize()`, puis va au profil. | transition |
| 6 | `/profil-voyageur/resultat` | Écran de révélation (existant, à conserver tel quel). CTA "Voir mes fonctionnalités". | oui |
| 7 | `/profil-voyageur/features` | Affiche **uniquement les 2 premières** de `recommended_features` (au lieu des 8), avec description et CTA "Essayer celle-ci". | oui |
| 8 | `/profil-voyageur/essai` | Aperçu **limité** de la feature choisie (ex : 3 suggestions destinations au lieu de 20, ou 1 hidden gem au lieu de la liste). Bandeau "Débloquer tout" → CTA dashboard. | oui |
| 9 | `/app` | Dashboard complet (existant). | oui |

---

## 4. Persistance / reprise

**Nouvelle colonne** `traveler_profiles.onboarding_step TEXT` (nullable) — valeurs : `welcome | besoin | qualif | tinder | signup | resultat | features | essai | done`. Écrite à chaque transition.

**Nouvelles colonnes** `traveler_profiles.need_tags TEXT[]`, `qualif JSONB` — stockent besoin/qualif après signup.

**Avant signup** : les mêmes données vivent dans `localStorage['xplania:onboarding']` (JSON : `{step, needs, qualif, swipes:[{cardId, direction}]}`). Écriture à chaque action.

**Reprise** :
- Visiteur non connecté → `/welcome` lit `localStorage.step` et redirige vers l'étape en cours (bouton "Continuer" au lieu de "Commencer").
- Utilisateur connecté → `ProtectedRoute` lit `traveler_profiles.onboarding_step` et redirige vers l'étape correspondante tant que ≠ `done`. Les routes app (`/app`, `/mood`, etc.) restent verrouillées jusqu'au `done`.

**Navigation** : chaque étape a un bouton "← Retour" vers la précédente ; le "Suivant" est désactivé tant que l'étape courante n'est pas remplie ; impossible de sauter en avant via URL (garde côté route).

---

## 5. Détails techniques (dev)

**Migration Supabase** (nouvelle) :
- `ALTER TABLE traveler_profiles ADD COLUMN onboarding_step text`, `need_tags text[]`, `qualif jsonb`.
- Backfill : `UPDATE ... SET onboarding_step='done' WHERE completed_at IS NOT NULL`.

**Nouveaux fichiers front** :
- `src/lib/onboarding-state.ts` — helpers `getLocalOnboarding()`, `setLocalOnboarding()`, `clearLocalOnboarding()`, `nextStep()`, `stepToRoute()`.
- `src/hooks/useOnboardingFlow.ts` — hook central : fusionne état local + `traveler_profiles`, expose `currentStep`, `goNext()`, `goBack()`, `syncAfterSignup()`.
- `src/pages/onboarding/Welcome.tsx` (route `/welcome`)
- `src/pages/onboarding/Besoin.tsx` (route `/onboarding/besoin`)
- `src/pages/onboarding/Qualif.tsx` (route `/onboarding/qualif`)
- `src/pages/onboarding/Signup.tsx` (route `/onboarding/signup`) — réutilise le composant auth existant, avec logique post-login qui appelle `syncAfterSignup()`.
- `src/pages/onboarding/Features.tsx` (route `/profil-voyageur/features`)
- `src/pages/onboarding/Essai.tsx` (route `/profil-voyageur/essai`)

**Fichiers modifiés** :
- `src/pages/TravelerProfileOnboarding.tsx` — accepter le mode "anonyme" : si `!user`, lire/écrire dans localStorage au lieu de Supabase ; à la fin, rediriger vers `/onboarding/signup` (au lieu de `finalize()`).
- `src/App.tsx` — ajouter les 6 nouvelles routes ; `/welcome` en index public ; `/onboarding/*` en public.
- `src/components/auth/ProtectedRoute.tsx` — remplacer le redirect statique `/profil-voyageur` par un redirect basé sur `traveler_profiles.onboarding_step` (via helper `stepToRoute`).
- `src/pages/TravelerProfileResult.tsx` — CTA final envoie vers `/profil-voyageur/features` (au lieu de `/app`).
- `src/i18n/locales/{fr,en}.json` — clés pour les 6 nouveaux écrans.

**Non touché** : logique de scoring, `traveler-badge.ts`, `TinderCard.tsx`, tables `tinder_cards` / `user_swipes`, RAG, guides.

---

## 6. Livraison

Estimation : 1 migration + ~8 nouveaux fichiers + 4 fichiers modifiés. Aucune donnée utilisateur perdue (le backfill met les profils existants directement en `done` → ils atterrissent sur `/app`).

Confirme le plan et j'implémente dans la foulée.
