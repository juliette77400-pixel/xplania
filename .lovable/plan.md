
# Plan — Optimisation UI globale + Refonte page d'accueil

Travail livré en **2 lots** séparés pour limiter les risques de régression. Bilingue FR/EN, mobile-first, design system existant respecté, aucune fonctionnalité supprimée.

---

## LOT 1 — Page Gamification + optimisations UI globales

### 1.1 Refonte de la page Gamification (`src/pages/Gamification.tsx` + `GamCatalog.tsx`)

**En haut de la page (vitrine) :**
- Bandeau de progression global : "12 / 40 badges débloqués" + barre + niveau / XP (déjà présent via XpHeader).
- Section "Débloqués récemment" (max 6, carrousel mobile).
- Section "Bientôt à portée" : badges en cours avec progression ≥ 25 % (max 4).

**Onglets de filtrage** (Tabs shadcn) :
- Débloqués · En cours · Tous (par défaut : Débloqués).

**Reste du catalogue :**
- Badges verrouillés **regroupés par catégorie**, chaque catégorie dans un `<Accordion>` replié par défaut.
- Header de catégorie : nom + compteur "3 / 8 débloqués" + barre fine.
- Style verrouillé : grisé, opacité réduite, pas de description longue, icône cadenas.
- Pagination "Voir plus" (12 par 12) si une catégorie ouverte dépasse 12 cartes.

**Aucune logique de claim / verif / XP modifiée** — uniquement la présentation.

### 1.2 Optimisations UI transverses (faible risque, ciblées)

- **Skeletons** : ajouter des skeleton loaders shadcn là où on a aujourd'hui un écran vide pendant un fetch — pages identifiées : Dashboard, Carnet, Carnets, Discover, Profil, Suivi. Pas de changement de logique, juste un fallback visuel.
- **Sections repliables** sur pages denses :
  - `Carnet` : blocs journal et timeline en `<Accordion>` repliables.
  - `GuideBudget` / `GuideValise` / `GuideVisa` : sections secondaires (tips IA, historique) repliables.
- **Mobile** : audit rapide des cartes qui débordent (Dashboard, Gamification, Profil) — ajustement padding / font-size via classes Tailwind existantes (`text-sm md:text-base`, `p-3 md:p-6`).
- **Espacements** : passage en revue des écarts `space-y-*` incohérents entre pages, normalisation sur `space-y-6 md:space-y-8`.
- **Pas de nouveaux tokens** : aucune couleur, ombre ou police nouvelle.

### 1.3 i18n
Nouvelles clés FR/EN pour : onglets badges, "Voir plus", "Bientôt à portée", "Débloqués récemment", headers de catégorie, états vides.

---

## LOT 2 — Refonte de la page d'accueil

Fichier principal : `src/pages/Index.tsx`. Réécriture des sections via composants existants dans `src/components/xplania/` (modifiés) + 2-3 nouveaux composants ciblés. **Aucune URL ni ancre supprimée** : on garde `#features`, `#how-it-works`, `#faq` si présents et on ajoute les nouvelles.

### Structure finale (ordre)

1. **Hero** (`HeroSection.tsx` refondu)
   - H1 : « Le premier compagnon IA dédié aux voyageurs modernes »
   - Sous-titre : « Centralise, anticipe et accompagne chaque étape de ton voyage. Zéro friction, 100 % personnalisé. »
   - CTA principal : « Commence ton voyage » → flux existant.
   - Visuel immersif conservé / ajusté (pas de nouvel asset lourd).

2. **Double cible** (nouveau composant `DualAudienceSection.tsx`)
   - 2 cartes côte à côte (stack mobile) : Jeunes voyageurs débutants · Digital nomads.
   - Ton apaisant vs ton efficacité, icônes existantes lucide.

3. **Avant / Pendant / Après** (nouveau `JourneyTimelineSection.tsx`)
   - 3 colonnes desktop, timeline verticale mobile.
   - Items : visa/budget/valise/itinéraire · guide interculturel/suivi temps réel/recos contextuelles · carnet/badges/retour d'expérience.

4. **Différenciation** (nouveau `DifferentiationSection.tsx`)
   - Phrase signature XL : « ChatGPT génère. Xplania accompagne. »
   - 3 puces courtes : suivi continu · personnalisation contextuelle · structure avant/pendant/après.

5. **Fonctionnalités clés** (`FeaturesSection.tsx` allégé)
   - 5 tuiles icônes : Visa · Budget · Valise · Carnet · Globe Trotter.
   - Texte raccourci, pas de paragraphes.

6. **Crédibilité** (`BetaSection.tsx` ajusté)
   - Mise en avant Pépite France + compteur testeurs bêta (si dispo via store/contenu existant, sinon placeholder masquable).

7. **CTA final** — réutilise le composant CTA existant, ton chaleureux.

### Sections retirées / déplacées
- `Testimonials`, `PhotoGallery`, `FaqSection`, `HowItWorksSection`, `DashboardSection`, `BenefitsSection` : **conservées dans le repo** mais retirées de l'accueil si redondantes avec la nouvelle structure. Aucun fichier supprimé pour éviter de casser des imports tiers. Ancres `#faq` / `#how-it-works` conservées via redirect simple vers section équivalente ou supprimées seulement si non référencées (vérification `rg` avant).

### i18n
Toutes les nouvelles strings ajoutées dans `fr.json` / `en.json` sous `home.*` (hero, dualAudience, journey, differentiation, features, credibility, ctaFinal).

---

## Contraintes respectées
- Aucune route ni fonctionnalité supprimée.
- Pas de nouveau design token, pas de nouvelle police, pas de nouvelle couleur.
- Mobile-first, bilingue, design system existant.
- Lot 1 indépendant du Lot 2 : possible de stopper après l'un ou l'autre.

---

## Question avant de démarrer

Tu veux que j'enchaîne **Lot 1 puis Lot 2 d'affilée**, ou je m'arrête après le Lot 1 pour que tu valides visuellement la Gamification avant la refonte de l'accueil ?
