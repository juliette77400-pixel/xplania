# Assistant Logement — 5e outil de préparation

Objectif : aider l'étudiant à chercher, comparer et sécuriser son logement, puis préparer son installation. Pas d'annonces, pas de réservation, pas de paiement, pas d'IA (donc aucun essai consommé).

## 1. Ce qui est réutilisé
- Questionnaire en cartes illustrées (format Tinder) : même composant de carte-choix, mêmes animations.
- Séjour enregistré (destination, ville, type de mobilité, dates/durée, budget) : lu tel quel, rien n'est redemandé.
- En-tête et cartes des guides existants, bloc « Infos manquantes », fenêtre « Modifier mon séjour ».
- Tableau de bord : même carte que Budget/Visa/Valise/Culture, même calcul de progression.
- Interrupteur des modules (le Logement pourra être masqué en un clic comme les autres).
- Connexion, protection des données par compte, menus et recherche rapide.

## 2. Nouveautés
**Questionnaire** : une 7e carte après « Hébergement » : « Où en es-tu dans ta recherche de logement ? » avec 4 cartes illustrées (je commence / j'ai trouvé quelques logements / logement confirmé / je ne sais pas par où commencer). 4 nouvelles illustrations générées dans le style actuel. Pour les séjours déjà créés, la question est posée une seule fois, en haut de la page Logement.

**Page « Ton logement à l'étranger »** (`/guide-logement`) :
- En-tête : destination, ville, dates, statut, progression, bouton « Modifier ma situation ».
- Ordre des blocs adapté au statut (ex. « je commence » → ressources, comparateur, vigilance, coûts, étapes ; « confirmé » → avant l'arrivée, documents, frais d'installation, emménagement).
- Module 1 « Où chercher ton logement ? » : 4 catégories (résidences universitaires, plateformes étudiantes, colocations, ressources institutionnelles). Liste écrite à la main, uniquement des sites réels dont j'aurai vérifié le lien, avec la mention « vérifié le … » et « aucun partenariat ». Si rien de vérifié pour le pays : message clair + renvoi vers le service international / logement de l'établissement d'accueil.
- Module 2 « Compare tes options » : bouton « + Ajouter un logement » (nom et loyer obligatoires, le reste facultatif), modification, suppression, favori, tableau comparatif (coût mensuel, coût de départ calculé = caution + frais + 1er mois, lieu, meublé, dates, avantages/inconvénients). Aucune note de fiabilité automatique. Sur mobile : cartes empilées au lieu du tableau.
- Module 3 « Évite les mauvaises surprises » : checklist de 9 vérifications + « Les signaux d'alerte » + rappel que la liste réduit les risques sans garantir l'annonce. Jamais de « logement vérifié/sécurisé ».
- Module 4 « Tout est prêt pour ton arrivée ? » : étapes Avant la signature / Avant le départ / À l'arrivée, filtrées selon le statut, avec renvoi prudent vers les sources officielles.
- États vides, chargement, erreur et « enregistré ».

**Lien avec le Budget** : sur le logement favori, bouton « Ajouter les dépenses au budget ». Une fenêtre de confirmation montre ce qui sera ajouté ou remplacé, séparé en mensuel (loyer + charges), ponctuel (frais d'agence, installation) et caution (récupérable). Pas de doublon : refaire l'opération remplace les mêmes lignes, après confirmation. Si le logement change, on propose la mise à jour. Si le budget n'est pas encore créé, on invite à le créer d'abord.

**Tableau de bord** : 5e carte « Logement — Organise ta recherche et prépare ton installation », icône maison, statut, progression, bouton d'accès. La progression globale compte désormais 5 outils.

## 3. Données
- Statut de recherche : enregistré dans le séjour (comme les autres réponses du questionnaire).
- Nouvelle table « logements repérés » liée à l'utilisateur et au séjour (plusieurs par séjour).
- Nouvelle table « cases cochées du logement » par séjour (checklists).
- Chaque personne ne voit et ne modifie que ses propres lignes. Aucun document, contrat ni pièce d'identité stocké.

## 4. Réalisable tout de suite
Tout ce qui est décrit ci-dessus (Must Have + Should Have), avec tests automatiques : statut selon le questionnaire, calcul du coût de départ, étapes selon le statut, pas de doublon dans le budget, progression du tableau de bord. Test navigateur : ajouter / modifier / supprimer / comparer / cocher / changer de statut, sur ordinateur et téléphone, et vérification qu'un autre compte ne voit pas les logements.

## 5. Hors de cette version (données externes nécessaires)
Annonces en temps réel, partenaires, carte des quartiers, temps de trajet, alertes d'annonces, partenariats universitaires. La liste de ressources reste limitée à ce que je peux vérifier aujourd'hui (pays les plus fréquents en Erasmus) ; le reste devra être complété par toi ou par les écoles.

## 6. Points à valider
- Page Offres : ajouter « Logement » dans la carte Gratuit, sans toucher aux prix ni aux packs (proposé).
- Page d'accueil : laissée telle quelle (tu avais demandé de retirer « logement » des promesses) — à toi de dire si on ajoute une 5e carte.
- Règle « 4 outils visibles » de la bêta passera à 5 outils.

## Détails techniques
- Drapeau `ENABLE_HOUSING_ASSISTANT` + route `/guide-logement` via `gate()`, liens filtrés par `isPathEnabled()`.
- `PREP_STEPS` += `housingStatus` ; `trips.form_data.housingStatus` (`starting | shortlist | confirmed | lost`) ; test « 6 questions » mis à jour en 7.
- Tables `housing_options` et `housing_checklist` (user_id, trip_id, RLS own-only, GRANT authenticated) ; règles pures dans `src/lib/housing.ts`.
- `PrepModule` += `housing`, résumé écrit via `saveModuleProgress`.
- Budget : écriture dans l'état local du Budget (même clé destination/date), lignes identifiées `housing:<id>:rent|fees|deposit`.
- Ressources : `src/data/housing-resources.ts` (URL, type, pays, date de vérification), chaque lien contrôlé avant ajout.
- Événement `guide_action` réutilisé (pas de nouveau nom d'événement).
