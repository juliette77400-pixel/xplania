# Refonte UX des modules Visa et Budget

## Ce que j'ai constaté (analyse de l'existant)

**Visa**
- Le badge « Vérifié à 19:22 » s'affiche dès qu'une réponse IA arrive : aucune page officielle n'est réellement consultée. C'est exactement ce que ton document interdit.
- Le niveau de sécurité est converti en un score de 1 à 4 inventé par l'IA, au lieu des catégories réellement publiées par France Diplomatie.
- La partie Vaccins affiche toujours des blocs généraux (paludisme, fièvre jaune…), même pour le Japon.
- La checklist mélange « obligatoire / recommandé / optionnel » sans dire si l'étape s'applique vraiment, et **les cases cochées se perdent** quand on quitte la page.
- Les numéros d'urgence affichés en bas sont les mêmes pour tous les pays.
- Le pays de résidence, le passeport et les pays de transit ne sont pas toujours demandés ; la nationalité « France » est mise par défaut.
- Chaque clic sur « Rafraîchir » consomme un essai IA.

**Budget**
- Le budget total affiché est la somme des catégories, pas le budget que l'étudiant a indiqué. Si le budget est inconnu, le site montre 820 € et « Paris » par défaut.
- Quand le séjour change, les montants enregistrés sont **réécrits automatiquement**, sans demander.
- L'analyse IA reste un long paragraphe, les « bons plans » citent des lieux et des prix non vérifiés.
- Pas de distinction entre dépenses déjà payées et estimées, ni entre frais de départ et dépenses mensuelles pour un séjour long.

## Ce que je propose de construire

### Visa
1. **Bloc « Ton profil »** en haut : nationalité, 2e nationalité, résidence, type de passeport, motif, dates/durée, villes ou régions, pays de transit. Les champs manquants sont signalés et l'analyse attend qu'ils soient remplis. Les réponses sont enregistrées dans le séjour (modifiables aussi depuis « Modifier mon séjour »). Plus de nationalité par défaut.
2. **Quatre cartes en haut** : Visa, Passeport, Santé, Sécurité. Chacune : titre, statut avec icône et texte (jamais la couleur seule), 1–2 phrases, bouton « Voir les détails » (accordéon), source officielle.
   - Statuts Visa : « Requis », « Non requis sous conditions », « À vérifier ».
3. **Vraie vérification officielle** : le serveur ouvre réellement la page France Diplomatie du pays et la page Institut Pasteur, en extrait la date de mise à jour et le texte, puis l'IA résume **uniquement ce texte**. Affichage : « Page officielle mise à jour le 22 octobre 2026 · consultée le 24 octobre 2026 ». Si la page est inaccessible : « Vérification en direct indisponible » + liens officiels. Le résultat est gardé en mémoire 24 h par pays et partagé entre étudiants, donc « Rafraîchir » ne coûte plus d'essai.
4. **Trois niveaux de fiabilité** sur chaque information : « Vérifié (source officielle) », « Indicatif », « À vérifier ».
5. **Sécurité** : le niveau affiché reprend mot pour mot la catégorie publiée (vigilance normale, renforcée, déconseillé sauf raison impérative, formellement déconseillé), zone par zone si la page le précise. Plus de score national inventé.
6. **Santé en 4 groupes** : obligations d'entrée, vaccins de routine à vérifier, recommandations pour ce séjour, recommandations conditionnelles (avec la condition : « si séjour long », « si zone rurale »…). Les blocs mondiaux sont supprimés. Un vaccin n'est « obligatoire » que si la source officielle le dit.
7. **Checklist personnalisée** : actions courtes avec case à cocher, détails facultatifs, priorité fiable (« Obligatoire » seulement si la règle est établie, sinon « Recommandé » ou « Si concerné »). Les cases cochées et le résultat sont **sauvegardés** par séjour, ce qui évite aussi de relancer l'IA à chaque visite.
8. **Règle fixe Europe** : un Européen qui part dans un pays de l'UE/EEE/Suisse obtient toujours « Visa non requis, carte d'identité ou passeport valide » avec source europa.eu, quoi que dise l'IA.
9. **Urgences** : numéros courts du pays, avec leur source ; ambassade/consulat du pays de nationalité, ou « à vérifier » si non confirmé.
10. Les explications longues (étapes de demande, conseils, documents généraux) passent dans des accordéons « En savoir plus ».

### Budget
1. **5 indicateurs** en haut : budget total (celui que tu as indiqué), dépenses prévues, montant restant, marge de sécurité, coût moyen par jour (ou par mois au-delà de 2 mois). Si le budget est inconnu : « Budget à renseigner » au lieu de 820 €.
2. **Séjours longs** : trois montants séparés, « Frais de départ » (vol, assurance, caution, visa), « Par mois » (logement, nourriture, transport, téléphone) et « Global ».
3. **Déjà payé / estimé** : deux couleurs et deux libellés distincts dans les indicateurs et les graphiques.
4. **Graphiques** (données réelles du budget enregistré) : répartition par catégorie, comparaison budget enregistré / simulation, jauge de marge restante.
5. **3 recommandations maximum**, calculées à partir de tes chiffres (ex. « Marge trop faible : 2 % du budget, vise 10 % soit 82 € »). Titre, 2 phrases, montant si calculable, action, bouton « Comprendre ». Aucun prix local ni montant d'économie inventé. L'analyse IA et les bons plans restent disponibles dans un accordéon marqué « Indicatif ».
6. **Simulateur** avec 6 curseurs : Hébergement, Transport, Alimentation, Activités, Assurance, Imprévus (les autres catégories restent visibles en « Autres »). Totaux et graphiques bougent en direct ; rien n'est enregistré avant « Appliquer à mon budget » + confirmation.
7. **Plus de réécriture automatique** : si le séjour change, un bandeau propose « Recalculer » ; tes montants ne bougent que si tu acceptes.
8. Calculs vérifiés : somme des catégories = total, marge correcte, jours et nuits justes (nuits = jours − 1 quand les dates sont connues).

### Ce qui ne change pas
Le design (fond sombre, dégradés, cartes), les quotas (10 essais par outil et par mois), les règles de sécurité IA, les dépenses et budgets déjà enregistrés, l'export PDF, Pip, le convertisseur de devises.

## Validation prévue
- 5 profils Visa : Français tourisme Japon, Français Erasmus Espagne, étudiant non européen résidant en France en stage au Japon, profil incomplet, sources officielles inaccessibles (simulé). Vérifier que rien ne se mélange entre pays.
- Tests automatiques des calculs Budget, de la règle Europe, des statuts et de la sauvegarde des checklists.
- Contrôle visuel téléphone et ordinateur, boutons et liens sources.
- Coût estimé : environ 6 à 10 essais IA pour les tests Visa.

## Détails techniques
- Nouvelle fonction serveur `official-sources` (remplace `visa-official-info`) : fetch HTML France Diplomatie (slug depuis l'index des pays) + Pasteur, extraction `Dernière mise à jour le`, texte nettoyé limité, résumé IA contraint au texte fourni (low reasoning, SAFETY_RULE inclus). Retour `{ status: "verified" | "unavailable", sourceUpdatedAt, fetchedAt, safety: { category, zones[] }, health: { entry[], routine[], stay[], conditional[{item, condition}] } }`. Cache table `official_info_cache` (lecture publique, écriture serveur seulement, TTL 24 h), sans consommation de quota quand le cache répond.
- `visa-info` : nouveau schéma (`visa.status`, `passport`, checklist `{item, details, priority, conditional, condition}`), entrées supplémentaires (type de passeport, transit, villes, dates, mois), garde-fou UE/EEE/CH côté serveur et client dans `src/lib/visa-rules.ts`.
- Nouveaux champs facultatifs dans `TravelFormData` : `passportType`, `transitCountries`, `visitedRegions` ; édition dans `PrepTripEditDialog` et dans le bloc profil Visa. Le questionnaire de 7 cartes n'est pas allongé.
- Sauvegarde Visa : résultat + cases cochées en stockage local par séjour et empreinte de profil ; synthèse tableau de bord via `prep-progress`.
- Budget : `src/lib/budget-math.ts` (indicateurs, nuits/jours, ponctuel/mensuel, recommandations déterministes) + tests ; nouveaux composants `BudgetKpis`, `BudgetSimulator`, `BudgetRecommendations` ; suppression des valeurs par défaut 820 €/Paris ; remplacement de la réécriture automatique par un bandeau de confirmation.
- `budget-tips` : ajout de SAFETY_RULE (manquant aujourd'hui), libellé « Indicatif ».
- Traductions FR/EN pour tous les nouveaux textes ; `AGENTS.md` mis à jour.
