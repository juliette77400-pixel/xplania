# Xplania — préparation du regroupement A8

## Décision proposée

**Préparer et tester le regroupement dans une copie dont la base isolée est vérifiée, avant toute acceptation dans la version principale.** Conserver l’ordre technique : Capacité 500, puis Performance outils bêta. Aucun lancement d’A2–A5, B1 ou B3 ; seules les corrections de compatibilité du regroupement sont concernées.

Ta validation de ce plan autorisera la préparation isolée, pas l’acceptation dans la version principale, la publication, une IA réelle ou un test de charge. Ces actions nécessiteront des accords distincts.

## 1. Ce qui est vérifié et ce qui reste à prouver

### Vérifié en lecture seule le 17 novembre

- Cette discussion est celle de la version principale.
- Les deux copies existent, sont prêtes mais en retard sur la version principale. **Chacune possède actuellement sa propre base de test**, selon l’inventaire Lovable.
- Le dernier fichier de changement de base de la version principale est `0038`. Son empreinte et sa date correspondent au dernier changement enregistré dans la base réelle. Le numéro interne de cette ligne est 39 : **ce n’est pas un fichier `0039` supplémentaire**.
- La base principale autorise aujourd’hui six types de résultats : `visa`, `budget_insights`, `valise_tip`, `valise_outfits`, `budget_state`, `valise_cultural`. Le septième attendu est `valise_missing`.
- La documentation et les outils Lovable confirment qu’une nouvelle copie part de la dernière version enregistrée du principal, pas des changements d’une autre copie.

### Important : correction de la stratégie précédente

**Accepter Capacité 500 dans le principal n’est pas une étape de test sans effet sur le site.** L’acceptation applique les changements de structure à la base réelle et déploie les fonctions modifiées, même sans publication des écrans. Les anciens écrans publiés utilisent alors ces nouvelles fonctions et cette nouvelle structure.

Revenir à une version précédente du code ne rétablit pas la base. Le retour aux anciennes fonctions peut lui aussi modifier le comportement des générations déjà engagées. Il faut donc préparer une compatibilité avec les anciens écrans, pas promettre un retour arrière automatique.

### Informations rapportées, non vérifiées depuis cette discussion

- Capacité 500 : A2–A5 terminés, 323 tests automatiques et 13 tests de base.
- Performance : A6 et B2 terminés, 328 tests automatiques et vérifications navigateur.
- Suite `0039`–`0045` et collision `0039` : à confirmer dans les fichiers **et** les historiques appliqués des deux bases.
- Je ne peux pas lire directement les fichiers des copies depuis cette discussion. Les résultats annoncés ne prouvent pas encore le bon fonctionnement de leur combinaison.

## 2. Ordre des opérations et actions dans chaque copie

### Étape 1 — figer les inventaires, sans accepter ni mettre à jour les copies

Dans **Capacité 500**, fournir :
- liste exhaustive des fichiers modifiés et des fonctions serveur concernées ;
- SQL exact, journal, instantanés et empreintes des migrations `0039`–`0045` ;
- historique réellement appliqué, y compris sa date la plus récente ;
- fonctionnement des sauvegardes, réservations, interruptions et tâches automatiques ;
- rapports des 323 tests et 13 vérifications de base, avec les échecs, exclusions et limites.

Dans **Performance**, fournir :
- mêmes inventaires de fichiers et de changements de base, notamment `valise_missing` ;
- correction exacte de la lecture Budget et des événements du questionnaire ;
- rapports des 328 tests et parcours navigateur ;
- preuve de l’absence d’appel IA à l’ouverture de Valise et des autres outils.

Les exports de source doivent exclure secrets, comptes, données étudiantes, dépendances et métadonnées de dépôt. Préserver les deux copies originales pour comparaison. Ne pas recopier leurs données de test dans la base réelle.

### Étape 2 — créer la copie de regroupement, puis vérifier son isolation

- Après autorisation, créer une copie de regroupement depuis le principal.
- Vérifier le résultat de création et l’inventaire Lovable : **base de test propre obligatoire**. Si Lovable indique une base partagée, arrêter avant toute écriture ou déploiement.
- Confirmer dans cette copie la structure, l’historique de départ, les fonctions et les comptes fictifs disponibles. Aucun compte réel ni secret exporté à la main.
- Contrôler les tâches planifiées et toute connexion à un service extérieur : pas d’e-mail réel, d’IA réelle ou de tâche agissant sur le principal pendant les tests.

Lovable ne documente pas de fusion directe de deux copies dans une troisième. Le chemin prévu est donc un **report contrôlé des sources exportées**, exécuté dans la discussion de la copie de regroupement. Si ces sources ou les accès nécessaires manquent, l’étape est bloquée : on n’accepte pas la première copie pour contourner ce manque.

### Étape 3 — reporter Capacité 500 en premier

- Comparer ses sources avec le principal actualisé, conserver les corrections principales déjà validées.
- Préserver exactement le préfixe d’historique du principal.
- Vérifier l’ordre et les dates des migrations de Capacité avant application dans la copie isolée ; utiliser l’outil de migration pour les appliquer.
- Vérifier chaque changement dans la base après application, pas seulement le message de réussite.
- Confirmer que les anciennes requêtes des écrans publiés restent acceptées par les nouvelles fonctions.

### Étape 4 — reporter Performance, sans écraser Capacité

- Ajouter uniquement les différences utiles : lecture Budget unifiée, événements allégés, génération Valise sur clic et `valise_missing`.
- Résoudre manuellement les fichiers communs et réunir les tests et les listes de suivi sans doublons.
- Régénérer les types depuis la base combinée ; ne pas fusionner manuellement le fichier de types généré.
- Ne pas modifier les modèles, consignes de sécurité, quotas, exemptions ESTICE/admin ni réglages financiers.

### Étape 5 — tests combinés et bilan

Exécuter les vérifications ci-dessous dans la copie isolée, produire un rapport avec preuves et coûts constatables, puis te demander un accord séparé pour l’acceptation. La publication reste une décision ultérieure.

## 3. Collision `0039` et vérifications de base

**`0046` est une cible conditionnelle, pas une renumérotation autorisée dès maintenant.**

- Ne renommer aucun changement dans les copies originales avant lecture de leur historique appliqué.
- Si la copie de regroupement contient seulement le principal puis Capacité jusqu’à `0045`, et si aucune autre entrée ne prend ce numéro, préparer `valise_missing` après cette suite, en `0046`.
- Garder le SQL de Performance exact lorsqu’il convient déjà. Toute adaptation nécessaire devient un changement explicitement examiné, pas une réécriture silencieuse.
- Une réparation d’historique de copie doit conserver les fichiers et entrées du principal octet pour octet ; les entrées ajoutées suivent leurs index, dates strictement croissantes et chaînes d’instantanés. Les dates doivent dépasser la dernière date réellement appliquée. Vérifier l’ensemble avec la procédure dédiée, puis vérifier le schéma réel.
- Une mise à jour Lovable peut reconstruire la base de test et supprimer ses comptes/données si les structures divergent. La documentation ne garantit pas les détails de reconstruction de l’historique : relire celui-ci après l’opération, ne jamais supposer qu’il a été remis à zéro.
- Aucun changement de l’historique appliqué de la base principale.

Après combinaison, vérifier :
1. les **sept types** autorisés, sans disparition des six existants ;
2. lecture des anciens résultats et sauvegarde de `valise_missing` ;
3. droits d’accès, propriétaires des séjours, accès séparés entre comptes ;
4. réservations, restitution unique, pauses communes et libération des places ;
5. fonctions, déclencheurs et tâches automatiques conformes au code combiné ;
6. absence de migration sautée par une date trop ancienne.

## 4. Conflits à résoudre

| Zone | Règle de combinaison | Preuve attendue |
|---|---|---|
| `AiTipCard.tsx`, `OutfitRecommendations.tsx` et autres fichiers communs recensés | Clic explicite de Performance + protections serveur de Capacité | Ouverture/langue : zéro appel IA ; clic simulé : une demande |
| Budget | Une lecture initiale par séjour, avec sauvegarde confirmée et protection des versions | Aucune lecture sur clé temporaire ; deux appareils sans écrasement silencieux |
| Sauvegardes client/serveur | Définir la responsabilité de chaque écriture, éviter une sauvegarde tardive concurrente | Une réussite affichée seulement après confirmation ; ancien résultat rejeté s’il est périmé |
| Types générés | Régénération depuis le schéma combiné | Correspondance avec les sept types et les fonctions |
| Suivi et tests | Réunir sans perdre les cas des deux copies | Liste des tests exécutés, ignorés et échoués |
| Réponses des fonctions | Compatibilité avec les écrans déjà publiés | Ancien format de demande testé contre les nouvelles fonctions |

## 5. Tests obligatoires après regroupement

**Aucune IA réelle, aucun test de charge.** Les réponses fournisseur sont simulées ; les tests serveur restent limités à la base isolée. Les tests locaux n’appellent pas de fournisseur payant ; les vérifications distantes peuvent néanmoins consommer du Cloud.

- Réexécuter les suites des deux copies et les tests principaux pertinents. Les nombres 323 et 328 ne s’additionnent pas : certains cas sont communs.
- Visa, Budget, Valise : enregistrer, fermer, rouvrir sur un autre appareil, changer de langue, retrouver le résultat du bon séjour.
- Coupure avant/après réservation, pendant l’appel simulé, après réponse et avant confirmation ; récupération de la même demande, jamais de rejeu automatique si son issue est inconnue.
- Doubles clics, deux onglets et deux appareils : ni génération en double, ni double débit, ni double restitution ; erreur de sauvegarde visible et reprise sans nouvelle IA.
- Les 12 entrées protégées : succès, saturation, délai maximal, 429, panne transitoire, blocage durable et contrôle indisponible ; aucune place bloquée ni attente infinie. Consultations toujours accessibles.
- Budget : une seule lecture initiale utile, y compris au démarrage en mode développement ; bon changement de séjour, montants conservés, aucune ancienne sauvegarde écrasant une plus récente.
- À l’écran, FR/EN : questionnaire visiteur, inscription/reprise dans le contexte de test, séjours, tableau de bord, cinq outils et tous les assistants accessibles ; réouverture et langue sans IA automatique.
- Comptes fictifs ordinaire, ESTICE et admin : permissions et essais concrets ; tests de lecture/écriture croisées refusées.
- Anciennes requêtes du site publié contre le serveur combiné.
- Analyser les cinq anciens échecs navigateur : n’exclure un cas que si sa route est effectivement masquée et sans lien accessible pendant la bêta. Sinon, le traiter comme une régression.
- Téléphone simulé et deux contextes navigateur ; vérification humaine sur téléphone réel restant à organiser.

Tout échec de sauvegarde, fuite, doublon ou essai injustifié bloque l’acceptation. Ces tests ne démontreront pas la capacité à 500 étudiants actifs : le test de charge progressif reste une étape séparée avec ton accord.

## 6. Retour arrière

**Avant acceptation :** le principal reste intact. Garder les deux copies originales et les inventaires ; abandonner le regroupement ou corriger dans sa base isolée. Vérifier que les tests n’ont déclenché aucune action extérieure.

**Avant une éventuelle acceptation :**
- préserver la version de code précédente et préparer les anciennes fonctions ;
- obtenir un export de l’état actuel via More → Database → Manage → Settings → Export project data, sans le supposer disponible ; l’export peut prendre du temps et est limité à un par 24 h ;
- faire vérifier par toi le dernier horodatage UTC dans More → Database → Manage → Backups : je ne peux pas lire cet inventaire ;
- vérifier que le code précédent fonctionne avec le nouveau schéma et prévoir le traitement des demandes en cours lors d’un retour aux anciennes fonctions.

**Après acceptation :** un retour de code ne restaure ni schéma ni données. Privilégier une correction additive compatible, validée séparément. Une restauration de sauvegarde est un dernier recours : elle remet schéma et données à l’ancien état, perd les écritures postérieures et rend la base indisponible quelques minutes. Prendre un export avant préserve l’état courant ; ni export ni sauvegardes quotidiennes n’incluent les fichiers stockés. Pas de restauration partielle ni à un instant arbitraire, pas de promesse de réversibilité.

## 7. Budget et critères de lancement

Estimation de travail, **pas un prix garanti ni des crédits déjà dépensés** :

| Travail A8 | Crédits estimés |
|---|---:|
| Inventaires, isolation et historique des migrations | 8–12 |
| Report des sources et résolution des conflits | 8–12 |
| Types et non-régression locale de compatibilité | 5–8 |
| **Total A8 indicatif** | **21–32** |

Cette estimation dépasse les 10 crédits initialement prévus pour A8 : valider cette réallocation dans les 200 crédits, pas une augmentation de l’enveloppe. Les parcours complets restent dans A7 ; ne pas les facturer comme un nouveau lot. Tout conflit supplémentaire impose une nouvelle estimation avant poursuite.

Dernier solde communiqué : **180 crédits**, avant les travaux maintenant annoncés dans les copies. Il n’est pas confirmé comme solde actuel. Demander le solde actualisé avant exécution ; toutes les copies partagent la même enveloppe. Arrêt obligatoire à **170 consommés au total**, soit **30 restants**, sans terminer un lot au-delà de ce seuil sans ton accord.

Audit de sécurité d’environ 10 crédits : toujours différé jusqu’à validation de son périmètre et du budget restant. Aucun réglage financier ni plafond modifié.

**Conditions pour démarrer A8 :** validation de ce plan et de sa réallocation, solde actualisé, inventaires sources disponibles, isolation confirmée. **Conditions pour accepter :** tests combinés réussis, compatibilité avec les anciens écrans, retour arrière préparé et accord distinct de Juliette. **Publication et validation à 500 :** non autorisées par ce plan.