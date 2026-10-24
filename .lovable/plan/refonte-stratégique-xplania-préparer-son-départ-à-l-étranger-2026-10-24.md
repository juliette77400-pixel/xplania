# Refonte stratégique Xplania — préparer son départ à l'étranger

Objectif : un étudiant comprend en 5 secondes à qui s'adresse Xplania, quel problème il règle et ce qu'il obtient. Identité visuelle, connexion, comptes et données existantes conservés. Rien n'est supprimé définitivement.

## Ce qui existe déjà (réutilisé)
- Tableau de bord avec les 4 outils et leur progression réelle.
- Formulaire de séjour (destination, dates, nationalité, budget, type de séjour) : il sera remplacé par le questionnaire en cartes.
- Le guide Visa reprend déjà la nationalité ; Budget, Valise et Culture reprennent déjà la destination et les dates.
- Modules hors bêta déjà masqués (menus, pied de page, recherche).

## 1. Page d'accueil
- Plus d'écran de présentation avant l'accueil : arrivée directe.
- Nouvel ordre : Hero → Le problème → La solution (4 cartes) → Comment ça marche (3 étapes) → Bénéfices → Témoignages → Bloc bêta/avis → FAQ → CTA final → pied de page (avec le lien comparaison ChatGPT).
- Textes repris mot pour mot de ton document, en français et en anglais.
- « Je prépare mon départ » : inscription puis questionnaire ; si déjà connecté avec un séjour, direct au tableau de bord.
- « Découvrir comment ça marche » : fait défiler jusqu'aux 3 étapes.
- Les anciens blocs (« Pensé pour étudiants, voyageurs et pros », frise en 4 étapes, exemple Lisbonne) sont retirés de l'accueil.

## 2. Questionnaire de préparation (format Tinder conservé)
Grandes cartes illustrées, animations, glisser à gauche pour revenir / à droite pour continuer, barre de progression, et boutons accessibles au clavier en alternative.
1. Où pars-tu à l'aventure ? — pays avec suggestions + ville facultative.
2. D'où pars-tu ? — nationalité, pays de résidence, 2e nationalité facultative (rien n'est déduit automatiquement).
3. Quel est ton projet à l'étranger ? — 3 cartes photo : Erasmus/échange, Stage, Autre mobilité étudiante.
4. Quand commence ton aventure ? — date de départ, retour facultatif, ou durée : moins de 3 mois, 3–6 mois, plus de 6 mois, je ne sais pas encore.
5. Quel budget as-tu prévu ? — montant en euros ou « Je ne sais pas encore ».
6. Où vas-tu poser tes valises ? — 4 cartes photo : résidence étudiante, colocation, famille d'accueil, je ne sais pas encore.

Écran final « Ton espace de préparation est prêt ! » avec le résumé (destination, type de séjour, dates ou durée, budget si renseigné) et le bouton « Accéder à ma préparation → ». Aucun score de personnalité, aucun pourcentage inventé.

Images : environ 11 illustrations créées une fois pour toutes (campus, stage, valise, résidence, colocation, famille d'accueil, etc.), sans coût par utilisateur.

Le questionnaire s'ouvre aussi depuis « Nouveau séjour » sur le tableau de bord. Une personne qui a déjà un séjour complet n'est jamais renvoyée dedans.

## 3. Lien avec les 4 guides
- Les réponses sont enregistrées dans le séjour et reprises automatiquement : jamais redemandées.
- Visa : nationalité, résidence, 2e nationalité, type de mobilité et durée transmis à l'IA, en gardant les règles de sécurité et le rappel « vérifie auprès des sources officielles ».
- Budget : budget prévu, hébergement et type de mobilité pré-remplis ; les montants restent présentés comme des estimations.
- Valise : destination, dates/durée et hébergement.
- Culture : pays et type de mobilité (conseils vie étudiante ou vie en entreprise).
- Donnée manquante (budget, dates) : message clair avec un bouton pour la compléter.

## 4. Tableau de bord
- En-tête : destination, type de mobilité, dates ou durée.
- Chaque outil affiche « Non commencé », « En cours » ou « Terminé », selon des actions réellement enregistrées (une simple visite ne compte pas).
- Progression globale et par outil (déjà mesurées sur des actions réelles).
- Nouveau bloc « Tes prochaines actions » : la prochaine étape concrète de chaque outil non terminé.
- « Modifier mon séjour » : toutes les réponses du questionnaire deviennent modifiables (aujourd'hui seuls titre, destination et dates le sont).

## 5. Mesures de la bêta
Nouveaux événements enregistrés (uniquement avec accord cookies, comme aujourd'hui) : questionnaire commencé, chaque étape, terminé, abandonné à l'étape X ; tableau de bord ouvert ; outil commencé ; action réalisée dans un outil. Petit tableau « Entonnoir bêta » ajouté dans les statistiques admin.

## 6. Vérifications après modification
Boutons de l'accueil, inscription, questionnaire complet sur ordinateur et mobile, enregistrement des réponses, reprise par les 4 guides, tableau de bord, modification du séjour, liens cassés, absence de modules masqués dans les menus, tests automatiques.

## Détails techniques
- Pas de changement de base : les nouvelles réponses vont dans `trips.form_data` (residence, secondNationality, stayType `erasmus|internship|other`, durationBucket, budgetUnknown, accommodationType). L'ancien type « voyage » reste lisible.
- Nouveau composant `PrepQuiz` (réutilise le style/animations de `TinderCard`, `framer-motion` drag, `prefers-reduced-motion`) ; nouvelle route protégée `/preparation` ; `CreateTripForm` remplacé (logique `buildPrepTripData` + `validateTravelBasics` réutilisée).
- `Index.tsx` : suppression du gate `JourneyIntro` ; nouvelles sections `ProblemSection`, `SolutionSection` ; `HeroSection`, `HowItWorksSection`, `BenefitsSection`, `FinalCtaSection` réécrites ; règle AGENTS.md correspondante remplacée.
- `EditTripDialog` étendu aux champs du questionnaire ; `prep-progress.ts` expose `moduleStatus()` et `nextActions()`.
- Fonction `visa-info` (+ contexte Budget/Valise/Culture) : ajout des champs dans le contexte, SAFETY_RULE conservée, raisonnement low.
- `analytics.ts` : nouveaux types d'événements ; bloc entonnoir dans `AdminStats`.
- Tests : règles du questionnaire (étapes, durée facultative, budget facultatif) et statuts des outils.
