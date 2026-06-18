# Plan — Refonte Guide Visa Xplania

Ceci est un gros chantier (chatbot Pip, disclaimer, stepper, convertisseur, sécurité enrichie, i18n FR/EN complet). Voici le plan d'attaque en une passe cohérente.

## 1. Audit rapide
- Lire `src/pages/GuideVisa.tsx` et ses composants visa existants
- Lire `src/components/budget/BudgetOnboardingChat.tsx` pour réutiliser Pip
- Lire `supabase/functions/visa-info/index.ts` (déjà connu)
- Vérifier les clés i18n existantes (`guideVisa.*`) dans `fr.json` / `en.json`

## 2. Edge function — chatbot Pip visa
- Créer `supabase/functions/visa-qa/index.ts` (calqué sur `budget-qa`)
- Même persona Pip (chaleureux, tutoiement, prénom naturel)
- Contexte : destination, nationalité, type de voyage, durée
- Toujours ajouter en fin de réponse le disclaimer ambassade
- Locale FR/EN

## 3. Composants à créer (`src/components/visa/`)
- `VisaDisclaimer.tsx` — bandeau amber sticky avec lien diplomatie.gouv.fr
- `VisaProcessStepper.tsx` — 6 étapes accordion
- `CurrencyConverter.tsx` (réutiliser le composant `shared/CurrencyConverter` existant — déjà en place avec Frankfurter API)
- `SafetySection.tsx` — niveaux 1-4 codés couleur, sous-section solo conditionnelle, encadré urgences
- `VisaOnboardingChat.tsx` — chatbot Pip flottant avec flow guidé (4 étapes boutons) + mode question libre

## 4. Modifier `GuideVisa.tsx`
- Intégrer disclaimer en haut (sticky mobile)
- Ajouter section "Step by step" (stepper)
- Ajouter section convertisseur
- Enrichir section sécurité (niveaux couleur + solo si applicable)
- Ajouter mention inline disclaimer sous chaque bloc visa généré
- Monter `<VisaOnboardingChat />` flottant

## 5. i18n (`fr.json` + `en.json`)
Ajouter sous `guideVisa.*` :
- `disclaimer.{title,body,cta}`
- `chatbot.{welcome,welcomeCta,...,placeholder,header.*,greetings[]}`
- `chatbot.steps.{destination,nationality,tripType,duration}` avec options
- `stepper.{title,reassurance,steps[]}`
- `currency.{title,updated,disclaimer,unavailable}` (réutiliser clés existantes `currency.*` si présentes)
- `safety.{title,levels.{1..4},solo.{title,tips[]},emergency,consulate}`
- `inlineDisclaimer`
- `chatbotDisclaimer`

## 6. Contraintes
- Pas casser l'existant (`VisaGenerationAnim`, résultats Gemini)
- Réutiliser composants UI (Card, Button, Accordion, Badge)
- Palette violet/turquoise existante
- Lien externe ambassade `target="_blank" rel="noopener noreferrer"`
- ARIA labels partout
- API change : composant existant `CurrencyConverter` utilise Frankfurter — OK
- Chatbot Pip = même style flottant qu'`BudgetOnboardingChat`

## Détails techniques

**Edge function visa-qa** : copy de budget-qa, system prompt adapté visa/sécurité/admin, toujours rappeler "vérifie sur diplomatie.gouv.fr".

**Niveaux sécurité** : déduits depuis la réponse de `visa-info` (champ `security.level`: safe→1, moderate→2, caution→3, danger→4) + libellés neutres "selon les autorités françaises".

**Chatbot flow** : state machine simple `welcome → destination → nationality → tripType → duration → summary` + bascule mode libre via `useChat`-like simple wrapper qui appelle `visa-qa`.

**Solo detection** : si `tripType === 'solo'` ou réponse contient "seul", afficher `SafetySolo`.

## Livrables
- 1 edge function : `visa-qa`
- 5 nouveaux composants dans `src/components/visa/`
- 1 page modifiée : `GuideVisa.tsx`
- 2 fichiers i18n enrichis
- Pas de migration DB nécessaire
