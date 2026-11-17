# Xplania — audit et plan prioritaire pour 500 étudiants

**Audit du 17 novembre 2026. Aucune correction, fusion, publication, génération IA ou modification financière réalisée.** Ce document propose les interventions ; son approbation ne vaut pas autorisation de publier, de fusionner les copies ou de lancer un test distant/payant.

## Verdict

**La capacité de 500 étudiants actifs simultanément n’est pas encore démontrée.** La base répond sans saturation au relevé actuel, mais les reprises et sauvegardes serveur restent à valider, et aucun test représentatif à 500 n’a été exécuté.

- **500 inscrits** : un nombre de comptes, pas une mesure de charge.
- **500 connectés** : peuvent consulter des résultats ; ce n’est pas 500 actions simultanées.
- **500 actifs** : navigation, questionnaire, modifications et demandes IA mélangées ; objectif à tester.
- **500 générations simultanées** : cas beaucoup plus exigeant, avec plusieurs appels fournisseur possibles par action. Une attente régulée est nécessaire ; une réponse immédiate pour chacun n’est pas garantie.

## 1. Corrections déjà présentes et preuves

### Version principale de travail — source relue aujourd’hui

| Présent | Portée et limite |
|---|---|
| Erreurs de lecture des séjours remontées, nouvelle tentative possible | Ne confond plus une panne avec un compte sans séjour. La lecture utilise encore toutes les colonnes. |
| Budget sans reprise automatique de génération sur erreur | Un résultat sauvegardé est recherché avant génération ; absence de résultat peut encore déclencher le premier appel quand les conditions de la page sont réunies. |
| Visa, Budget, conseils/tenues/culture Valise enregistrables par séjour | Copie appareil immédiate, sauvegarde compte en arrière-plan. Un échec de sauvegarde peut seulement être journalisé : succès visible ne prouve pas succès sur un autre appareil. |
| Règles de réutilisation des résultats et détection de changement | Une consultation d’un résultat existant ne doit pas le régénérer. Certains chemins sans résultat restent à vérifier. |
| Caches Culture et résumés officiels Visa | Réutilisation partagée prévue par pays/langue ; cela ne protège pas à lui seul plusieurs premières demandes identiques simultanées. |
| Questionnaire, attente des assistants et reprise Valise corrigés dans les travaux précédents | Rapport disponible : 303 tests locaux, vérifications ciblées avec réponses simulées. Pas un test de charge. |

Le lecteur de flux renforcé est préparé mais le lecteur historique reste utilisé dans `ai-json.ts`. Les quotas reposent encore sur une restitution suivie en mémoire et le contrôle laisse passer une génération si sa vérification échoue : deux fragilités importantes en cas d’arrêt ou de panne.

**La version de travail n’est pas une preuve que chaque correction est déjà visible sur xplania.app.** La publication reste distincte.

### Copies isolées — statut confirmé, contenu détaillé non relu aujourd’hui

Les deux copies existent, sont inactives, ont chacune leur base de test isolée et sont **en retard sur la version principale**. Aucune n’est acceptée.

| Copie | Dernier résultat rapporté | Restant rapporté |
|---|---|---|
| Capacité 500 — régulation IA | 12 entrées bêta protégées ; réservations durables ; pause commune ; contrôle par appel fournisseur ; 316 tests locaux et 5 tests de données | Formats de sauvegarde Visa/Valise/nouvelles suggestions Budget, récupération après interruption, tâches automatiques, parcours à l’écran |
| Performance outils bêta | Valise sans IA à l’ouverture ; déduplication Budget pour une même clé ; 305 tests locaux | Deux lectures Budget sous des clés différentes : correction incomplète |

**Limite de cet audit :** les outils de lecture du chat principal n’ont pas fourni les fichiers/différences des copies. Ces réalisations sont donc les derniers rapports connus, pas une certification nouvelle de leur état. Aucun conflit exact ne peut être déclaré résolu sans comparaison des fichiers. Ne pas recommencer les corrections validées.

## 2. Blocages de capacité et limites Lovable

**Mesure actuelle :** mémoire 44 %, 5 connexions sur 60, 1 client de pool sur 200, disque 4 %, aucune alerte récente d’épuisement. C’est un instantané à faible activité, pas une preuve à 500. Les transactions annulées sont cumulatives ; leur nombre ne mesure pas un taux actuel d’erreurs.

**Mesure SQL historique :** deux groupes d’écritures d’événements du questionnaire totalisent environ 171 secondes sur 1 896 appels, avec un maximum à 4,38 secondes. La lecture des séjours atteint 30,78 ms en moyenne et 1,45 seconde au maximum sur 797 appels. Fenêtre de remise à zéro indisponible : ces chiffres orientent une investigation, sans prouver une saturation actuelle ni une consommation CPU.

Blocages prioritaires :
1. Sauvegarde compte non confirmée avant succès ; reprise durable non validée de bout en bout.
2. Garantie anti-doublon insuffisante lors d’une coupure ou d’un changement d’appareil.
3. Régulation globale des copies non intégrée et limite de **huit appels** non vérifiable dans la version principale inspectée.
4. Débit réel des fournisseurs, attente en file et temps des cinq outils sous charge non mesurés.
5. Double lecture Budget, chemins sans résultat, tâches programmées et premiers accès aux caches à vérifier.
6. Pas de test représentatif à 500 ; cinq anciens scénarios navigateur ciblent des modules masqués.

Lovable conditionne les démarrages de fonctions, leurs limites d’exécution, le débit fournisseur, les limites de connexion et d’inscription. Les diagnostics accessibles ne fournissent pas ici une série CPU ni toutes les limites de débit. Les deux copies ont leur base isolée ; l’aperçu principal et le site publié partagent leur base : ne rien déployer dessus pendant la validation.

### Ce que huit places IA signifieraient

Avec **8 appels réellement en cours** et une durée hypothétique de 5–10 secondes, le débit idéal est 48–96 appels/minute, avant erreurs et autres limites. Une vague de 500 actions à un appel prendrait environ 5–10,5 minutes à terminer ; 500 analyses Budget à quatre appels, environ 21–42 minutes. Ce sont des calculs de capacité théorique, pas des mesures ni des délais promis.

**Conclusion :** huit places peuvent protéger le service mais rendre les pics lents. Ne pas relever ce chiffre arbitrairement : mesurer le débit fournisseur et valider chaque augmentation. Une attente courte ne suffira pas à absorber une telle vague ; les demandes admises doivent rester récupérables, ou une demande non admise doit être refusée clairement sans appel ni essai débité.

## 3. Optimisations indispensables, par priorité

| Priorité | Intervention proposée | Vitesse/coût | Risque et validation |
|---|---|---|---|
| P0 | Comparer les copies à la version principale, identifier les fichiers communs et conserver les corrections validées | Pas d’effet utilisateur ; évite du développement répété | Ne pas fusionner sans accord ; comparaison préalable obligatoire |
| P0 | Sauvegarder et confirmer côté serveur les résultats compatibles Visa, Budget et Valise avant d’annoncer le succès ; signaler une sauvegarde manuelle encore en attente | Quelques écritures supplémentaires ; temps à mesurer | Formats historiques et montants Budget intacts, consultation sur deuxième appareil |
| P0 | Identifiant durable par action explicite, suivi « admise / en cours / sauvegardée / échouée / issue inconnue » et récupération du résultat | Évite les doubles appels ; lecture supplémentaire à la reprise | Si issue inconnue, jamais relancer automatiquement ; une coupure ne prouve pas que l’IA n’a rien coûté |
| P0 | Réservation/restauration durable des essais, une seule restitution ; bloquer les nouvelles générations si le contrôle est indisponible | Pas d’essai perdu avant appel ; consultation préservée | Tests d’arrêt avant/après appel et sauvegarde ; aucune restitution double |
| P0 | Régulation partagée par appel fournisseur, équité entre étudiants et relecture du cache après admission | Attente possible au pic ; évite saturation et cache généré plusieurs fois | Un Budget = quatre appels mais un essai ; aucun verrou conservé pendant l’appel IA |
| P0 | Pause durable commune sur crédit/politique ; refus fournisseur terminal ; reprises bornées et différées uniquement pour erreurs transitoires autorisées | Évite relances coûteuses inutiles | Conserver statut et message sûrs ; aucune reprise automatique sur refus ou issue inconnue |
| P1 | Unifier l’identité Budget après chargement du séjour ; dédupliquer lecture et sauvegarde pour cette identité | Moins de requêtes inutiles, impact réel à mesurer | Ne pas confondre deux séjours, comptes, dates ou budgets ; panne de lecture ≠ absence de sauvegarde |
| P1 | Raccorder le lecteur de flux déjà testé ; valider fin, refus, taille et forme | Fiabilité améliorée, pas de promesse de génération plus rapide | Tests de flux coupé/vide et sauvegarde ; modèles/protocole/longueur préservés |
| P1 | Mesurer les événements du questionnaire, alléger la lecture des séjours ; index uniquement si le plan SQL le justifie | Moins de travail/transfert potentiel | Aucun événement utile supprimé ; mêmes réponses et résultats |

Ordre d’intégration proposé : finaliser chaque copie séparément → comparer les différences communes → valider ensemble dans un environnement isolé → présenter tests et retour arrière → demander accord d’application → publication distincte. La copie performance peut être intégrée d’abord **si** la comparaison confirme qu’elle n’exige pas les nouveaux formats serveur ; sinon valider les deux comme un ensemble cohérent.

## 4. Réduire l’IA sans changer les modèles

- **Gain prioritaire candidat :** zéro génération inutile à l’ouverture et zéro duplication après interruption. Gain à chiffrer sur appels évités par action réussie.
- **Caches sûrs :** contenu public Culture/officiel partagé, avec une seule première génération par clé. Données personnelles jamais partagées entre étudiants ; séjour, langue et contexte conservés.
- **Budget :** les quatre sous-appels répètent les instructions et le contexte. Éliminer uniquement les répétitions démontrées inutiles ; conserver sécurité et personnalisation. Regrouper les quatre appels n’est pas prioritaire : cela peut ralentir et dégrader les réponses.
- **Historiques/prompts :** mesurer les tokens réels avant de réduire le contexte. Toute réduction doit passer les critères de fiabilité Visa, Culture et assistants. Ne pas réduire les réponses ni changer Luna/Sol sans accord.

**Quotas serveur vérifiés aujourd’hui :** 10 essais par outil/mois pour un compte ordinaire ; admin exempté ; titulaire d’un accès bêta valide exempté jusqu’à expiration. **ESTICE ne constitue donc pas un plafond individuel de dépenses.** La protection globale doit fonctionner aussi pour ces comptes, sans leur donner de droit admin. Aucun quota modifié.

## 5. Coûts : mesures et scénarios, pas devis TTC

### Développement et fonctionnement séparés

Du **4 au 17 novembre, journée actuelle partielle** : 97,56 crédits demandés de développement, dont 4,50 de suivi automatique ; environ 1,079 crédit demandé de fonctionnement enregistré, principalement la base. Aucun appel IA trouvé dans les journaux du 10 au 17 novembre ; cela ne prouve pas l’absence d’activité hors fenêtre ou hors journaux. Cette faible activité ne permet pas une extrapolation par étudiant.

Les crédits de développement, Cloud et IA puisent dans le même solde du workspace, mais leurs usages doivent être suivis séparément. Les 200 crédits de ce plan concernent **les améliorations**, pas un forfait de fonctionnement.

### Tarifs IA vérifiés sans génération

Pour des requêtes texte dans le premier palier de contexte, tarif standard :

| Modèle conservé | 1 million de tokens d’entrée | 1 million de tokens d’entrée réutilisés par le fournisseur | 1 million de tokens de sortie |
|---|---:|---:|---:|
| Luna | 0,40 crédit | 0,04 crédit | 2 crédits |
| Sol | 8 crédits | 0,80 crédit | 40 crédits |

Réutiliser un résultat complet supprime l’appel ; réutiliser l’entrée chez le fournisseur ne réduit que sa part d’entrée. La disponibilité catalogue est vérifiée, pas le débit réel. Aucun appel de génération lancé.

### Scénario mensuel hypothétique pour 500 étudiants

Hypothèses explicites, **non mesurées** : deux séjours/étudiant, huit appels Luna par séjour en moyenne, dix questions par séjour, soit 18 000 appels Luna ; 50 résumés Sol partagés. La moyenne de huit doit être mesurée : Culture et Valise peuvent la dépasser.

| Scénario | Hypothèses de tokens facturables par appel Luna | IA, marge de 20 % incluse |
|---|---|---:|
| Réponses modérées | 3 000 entrée + 1 200 sortie ; Sol 8 000 entrée + 1 500 sortie | **85,20 crédits** |
| Contexte/réponses plus longs | 6 000 entrée + 2 500 sortie ; mêmes appels Sol | **167,28 crédits** |

Inclure le raisonnement facturable dans la mesure de sortie ; ni cache fournisseur ni appels évités supposés dans ces calculs. Ce ne sont pas des prévisions garanties ou des euros TTC.

**Cloud, scénario continu du calcul seul :** pico 55,74 crédits/30 jours à 720 heures ; micro 74,30 ; small 120,74 ; medium 237,86. Aucune taille supérieure recommandée avec ce seul instantané.

Illustration supplémentaire, non observée : 10 000 pages vues sur le compteur correspondant = 15,20 crédits ; 20 000 invocations = 0,20 ; 10 Go de transfert non mis en cache = 4,50. En ajoutant ces hypothèses au pico continu et aux scénarios IA : **environ 161–243 crédits/mois**, hors stockage base/fichiers, temps des copies, autres services et autres compteurs applicables. Ce total partiel n’est ni un plafond ni le coût réel de Xplania. Ne pas additionner plusieurs compteurs d’hébergement sans vérifier ceux réellement utilisés.

**Coût TTC réel et respect des anciens plafonds en euros : non confirmés**, faute de conversion/facturation client applicable et de charge mesurée. Aucun réglage financier changé. La régulation ajoute des lectures/écritures et un éventuel suivi des demandes ; son coût supplémentaire reste à mesurer.

## 6. Plan de développement plafonné à 200 crédits

Enveloppes de pilotage proposées, **pas prix fixes ni blocage automatique garanti** :

| Lot | Enveloppe maximale visée |
|---|---:|
| Comparaison des copies, inventaire et conflits | 20 |
| Sauvegardes, reprises, essais et régulation indispensables | 65 |
| Double lecture Budget et optimisations prouvées | 25 |
| Tests locaux et parcours bêta FR/EN, deux appareils | 45 |
| Préparation du test de charge et rapport de décision | 15 |
| Réserve pour régressions indispensables | 30 |
| **Total** | **200 crédits de développement** |

Réutiliser les tests et travaux existants, livrer par lot, relever la consommation à chaque jalon. À 170 crédits consommés depuis le début de l’enveloppe, arrêter les travaux non bloquants ; avant tout dépassement prévisible, demander arbitrage. Le point de départ des 200 doit être fixé avant exécution ; les 97,56 historiques ne sont pas automatiquement imputables à cette nouvelle enveloppe.

Aucune refonte, fonctionnalité nouvelle, migration externe, changement de modèle ou réglage financier. Le trafic de test Cloud et l’échantillon IA réel nécessitent des budgets **distincts** approuvés.

## 7. Validation et véritable test à 500 actifs

### Avant la charge

1. Comparaison des copies effectivement relue ; tests historiques datés et nouveau passage ciblé. Les 303/305/316 sont des tests locaux unitaires/intégration simulée : ne pas les additionner, ni les appeler tests de charge.
2. Parcours à l’écran des cinq outils et du questionnaire, FR/EN : succès, panne, fermeture pendant demande, reconnexion, rechargement, changement de langue et d’appareil.
3. Sauvegardes relues depuis le compte sur un deuxième navigateur ; aucun double séjour, mélange de compte, écrasement Budget ni essai injustifié. Tester aussi accès ordinaire/ESTICE/admin et consultation avec IA bloquée.
4. Fonctions/tâches de la copie vérifiées sans e-mails ni appels externes non autorisés ; version de retour arrière testée sans rejouer une demande d’issue inconnue.

### Paliers proposés — non exécutés

**50 → 100 → 250 → 500 actifs**, cinq minutes minimum par palier, deux minutes de récupération ; si réussite, maintien à 500 pendant vingt minutes pour détecter accumulation et dérive.

Répartition hypothétique au palier 500 : 200 consultations/navigation, 125 questionnaires, 75 modifications Budget/Logement, 60 générations réparties, 40 assistants. Tous accomplissent des actions répétées réalistes : pas 500 sessions inactives. Adapter la répartition aux usages ESTICE avant lancement.

Première campagne : **réponses IA simulées côté serveur isolé**, durées 5–10 secondes, vrais mécanismes d’admission/sauvegarde. Une interception dans le navigateur seule ne teste pas les protections serveur. Scénario séparé : pic synchronisé des demandes IA et cache froid commun, pour mesurer la file et l’équité.

Mesurer par outil : temps total et temps d’attente séparés, p50/p95/p99, erreurs, appels réels/simulés, longueur/âge de file, résultats sauvegardés et relus, essais, connexions/mémoire, requêtes et consommation enregistrée après délai d’ingestion.

**Arrêt de sécurité :** fuite ou doublon immédiatement ; >5 % d’erreurs, p95 hors IA >5 s, mémoire >85 %, connexions >75 %. Ces seuils arrêtent un test ; ils ne suffisent pas pour le déclarer réussi.

**Critères de réussite proposés :** zéro fuite/perte/doublon/essai injustifié ; ≥99 % d’actions hors IA réussies et p95 ≤2 s ; aucune file en croissance durable au palier stable ; toutes demandes admises retrouvent une issue durable. Cible IA hors pic p95 ≤30 s et sous charge ≤60 s à valider avant test : impossible à promettre avant mesure fournisseur. Une grande vague simultanée doit donner une attente explicite, pas une fausse erreur.

### Autorisations et limites restantes

- Accord explicite de trafic distant et budget Cloud/test, même avec IA simulée : le trafic peut coûter.
- 500 comptes fictifs préparés sans envoi massif d’e-mails ; générateur de charge suffisamment puissant, données isolées et surveillance disponible.
- Échantillon IA réel séparé : nombre d’appels, tokens maximaux applicables et budget approuvés ; aucun changement de Luna/Sol. La simulation ne valide pas le fournisseur.
- Taille actuelle testée d’abord ; agrandissement uniquement si saturation mesurée et accord financier.
- Vérification sur téléphone réel ; informations juridiques encore à compléter avant lancement.

**Décision finale : prêt / prêt avec limites nommées / non prêt**, fondée sur ces mesures. Si le débit réel ne permet pas les pics souhaités, annoncer la limite et l’organisation nécessaire, sans présenter « 500 connectés » comme « 500 actifs validés ».
