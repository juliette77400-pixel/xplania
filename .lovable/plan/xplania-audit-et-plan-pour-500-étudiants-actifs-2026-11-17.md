# Xplania — audit et plan pour 500 étudiants actifs

**17 novembre 2026 — audit uniquement.** Aucune modification de l’application, fusion, publication, génération IA ou modification financière. L’audit détaillé est conservé séparément. L’approbation du plan ne vaut pas autorisation de fusionner, publier ou lancer un test distant/payant.

## Verdict

**Xplania ne peut pas encore être déclarée prête pour 500 étudiants actifs simultanément.** Les travaux existants sont utiles, mais les sauvegardes et reprises durables restent à finaliser et aucun test représentatif à 500 n’a été exécuté.

- **500 inscrits** : nombre de comptes, pas une charge.
- **500 connectés** : éventuellement simples consultations.
- **500 actifs** : navigation, questionnaire, modifications et IA mélangées ; c’est l’objectif à tester.
- **500 générations simultanées** : demande beaucoup plus forte ; une attente régulée sera nécessaire, sans promesse de réponse immédiate.

## 1. Corrections déjà réalisées et restant à intégrer

### Version principale de travail : source vérifiée aujourd’hui

- Les erreurs de lecture des séjours sont remontées, au lieu de faire croire que le compte est vide.
- Budget ne relance pas automatiquement une génération après erreur et recherche le résultat sauvegardé avant un appel.
- Visa, Budget et résultats Valise peuvent être enregistrés par séjour et réutilisés ; les montants Budget sont également sauvegardés.
- Culture et résumés officiels Visa disposent de caches par pays/langue.
- Les premières corrections du questionnaire et des assistants sont décrites dans le rapport existant : **303 tests locaux**, vérifications ciblées avec réponses simulées.

**Limites vérifiées :** la sauvegarde du compte se fait encore en arrière-plan et peut échouer sans empêcher l’affichage du succès ; la restitution des essais reste suivie en mémoire ; une panne du contrôle des essais laisse passer la génération ; le lecteur de flux renforcé est préparé mais pas raccordé. Certaines premières ouvertures sans résultat peuvent encore générer : à distinguer des consultations de résultats existants.

Cette source de travail ne prouve pas que chaque correction est déjà publiée sur xplania.app.

### Copies isolées : statut confirmé, derniers rapports connus

| Copie | Déjà rapporté | Restant rapporté |
|---|---|---|
| Capacité 500 — régulation IA | 12 entrées bêta protégées, réservations durables, pause commune, régulation par appel ; 316 tests locaux + 5 tests de données | Sauvegardes compatibles Visa/Valise/nouvelles suggestions Budget, reprises après interruption, tâches automatiques et parcours à l’écran |
| Performance outils bêta | Valise sans IA à l’ouverture ; déduplication Budget pour une même clé ; 305 tests | Deux lectures Budget avec des clés différentes : correction incomplète |

Les deux copies existent, sont inactives, disposent chacune d’une base de test isolée et sont **en retard sur la version principale**. Aucune n’est acceptée.

**Limite importante : les fichiers des copies n’ont pas pu être relus depuis ce chat.** Les réalisations ci-dessus sont les derniers rapports, pas une nouvelle certification. Les conflits exacts restent à comparer avant toute intégration. Ne pas refaire les corrections déjà validées.

## 2. Ce qui empêche encore la garantie à 500

Relevé actuel : mémoire **44 %**, connexions **5/60**, clients du pool **1/200**, disque **4 %**, aucune alerte récente d’épuisement. C’est un instantané à faible charge, pas une mesure de capacité.

Les écritures d’événements du questionnaire dominent les requêtes historiques inspectées : environ 171 secondes cumulées sur 1 896 appels, maximum 4,38 secondes. Lecture des séjours : moyenne 30,78 ms, maximum 1,45 seconde sur 797 appels. La date de remise à zéro est indisponible : ces statistiques orientent une investigation, sans démontrer une saturation actuelle ni mesurer le CPU.

**Blocages :** sauvegarde compte non confirmée avant succès ; reprise durable non validée ; anti-doublon après interruption ; régulation globale non intégrée ; débit fournisseur et attente inconnus ; double lecture Budget ; aucun test à 500.

### Limite de huit appels IA

Cette limite n’est pas vérifiable dans la version principale inspectée ; elle doit être confirmée dans la copie serveur.

Avec **8 places réellement occupées** et une durée hypothétique de **5–10 secondes/appel**, le débit idéal serait **48–96 appels/minute**, avant erreurs et autres limites :
- 500 actions à un appel : environ **5–10,5 minutes** pour terminer la vague.
- 500 analyses Budget à quatre appels : environ **21–42 minutes**.

Ce sont des calculs théoriques, pas des délais mesurés. Huit places peuvent protéger le service tout en rendant les pics lents. Ne pas augmenter ce nombre arbitrairement : tester le débit et l’équité. Une attente courte seule ne suffit pas : demande admise récupérable, ou refus clair avant appel et sans essai débité.

## 3. Optimisations indispensables, dans l’ordre

| Priorité | Changement proposé | Impact et risque |
|---|---|---|
| P0 | Comparer les deux copies à la version principale et identifier les fichiers communs | Évite le travail répété ; conflits non certifiés aujourd’hui |
| P0 | Confirmer la sauvegarde serveur Visa/Budget/Valise avant succès ; signaler une sauvegarde manuelle encore en attente | Écritures supplémentaires ; vérifier formats historiques et deuxième appareil |
| P0 | Identifiant durable par action ; suivi en cours/sauvegardée/échouée/issue inconnue ; récupération du résultat | Évite les doubles générations ; jamais rejouer automatiquement une issue inconnue |
| P0 | Réservation et restitution durable des essais, une seule fois ; contrôle indisponible → bloquer uniquement les nouvelles générations | Préserve consultations ; tester arrêt avant/après appel et sauvegarde |
| P0 | Régulation partagée de chaque appel fournisseur, équité et relecture du cache après admission | Attente au pic ; travail Cloud supplémentaire ; Budget conserve quatre appels pour un essai |
| P0 | Pause durable commune sur crédits/politique ; refus fournisseur terminal ; reprises différées et bornées seulement pour erreurs transitoires autorisées | Évite relances coûteuses ; conserve messages/statuts sûrs |
| P1 | Une identité Budget stable après chargement du séjour, déduplication lecture/sauvegarde | Moins de requêtes potentielles ; aucun mélange de compte, séjour, date ou montants |
| P1 | Raccorder le lecteur de flux testé ; valider fin/refus/taille/forme | Fiabilité améliorée, sans promesse de génération plus rapide |
| P1 | Mesurer événements du questionnaire et alléger la lecture des séjours ; index uniquement si justifié | Gain à mesurer, pas de suppression d’informations utiles |

**Ordre sécurisé :** finaliser séparément → comparer les différences communes → valider ensemble dans un environnement isolé → présenter tests/retour arrière → demander accord d’application → publication distincte. Performance d’abord seulement si elle ne dépend pas des nouveaux formats serveur.

## 4. Économies IA sans changer les modèles

- Supprimer les appels inutiles à l’ouverture et doublons après coupure : priorité, économies à mesurer par action réussie.
- Une seule première génération par clé de cache public Culture/officiel ; jamais partager les données personnelles entre étudiants.
- Les quatre sous-appels Budget répètent du contexte : mesurer puis supprimer uniquement les répétitions inutiles, en conservant sécurité/personnalisation. Regrouper les appels n’est pas prioritaire : risque de ralentissement.
- Réduire prompts/historiques seulement après mesure des tokens et contrôle de fiabilité ; conserver Luna/Sol, longueur des réponses et sources officielles.

**Quotas serveur vérifiés :** 10 essais/outil/mois pour comptes ordinaires ; admin exempté ; accès bêta valide exempté jusqu’à expiration. **ESTICE n’est donc pas un plafond individuel de dépenses.** La protection globale doit aussi couvrir ces comptes. Aucun quota changé.

## 5. Coûts de fonctionnement : scénarios, pas devis TTC

### Mesure historique

Du **4 au 17 novembre, journée actuelle partielle** : **97,56 crédits demandés de développement**, dont 4,50 de suivi automatique ; **environ 1,079 crédit demandé de fonctionnement enregistré**, surtout la base. Aucun appel IA trouvé dans les journaux du 10 au 17 : cela ne prouve pas l’absence d’activité hors fenêtre/journaux. Cette faible activité ne permet pas un coût mesuré par étudiant.

Développement, Cloud et IA utilisent le même solde, mais doivent être suivis séparément. Les **200 crédits demandés concernent les améliorations**, pas un forfait de fonctionnement.

### Tarifs IA vérifiés sans génération

Premier palier de contexte, texte standard, crédits par million de tokens :

| Modèle conservé | Entrée | Entrée réutilisée chez le fournisseur | Sortie |
|---|---:|---:|---:|
| Luna | 0,40 | 0,04 | 2 |
| Sol | 8 | 0,80 | 40 |

Le cache d’entrée réduit seulement l’entrée ; un résultat complet réutilisé supprime l’appel. Disponibilité catalogue vérifiée, pas débit réel.

**Hypothèse mensuelle, non mesurée :** 500 étudiants × 2 séjours × (8 appels Luna + 10 questions) = **18 000 appels Luna**, plus **50 résumés Sol partagés**. La moyenne de huit appels doit être mesurée et peut être dépassée.

- Luna 3 000 tokens entrée + 1 200 sortie/appel : **85,20 crédits IA**, marge 20 % incluse.
- Luna 6 000 entrée + 2 500 sortie/appel : **167,28 crédits IA**, même marge.
- Sol supposé à 8 000 entrée + 1 500 sortie ; inclure le raisonnement facturable dans la mesure. Aucun cache fournisseur supposé.

**Cloud, calcul seul à 720 heures/30 jours :** pico **55,74 crédits**, micro **74,30**, small **120,74**, medium **237,86**. Ce ne sont pas les heures observées ni une recommandation d’agrandissement.

Illustration supplémentaire : 10 000 pages vues sur ce compteur = 15,20 crédits ; 20 000 invocations = 0,20 ; 10 Go non mis en cache = 4,50. Avec pico continu et les scénarios IA : **environ 161–243 crédits/mois**, total partiel hypothétique, hors stockage, copies et autres services/compteurs applicables. Vérifier les compteurs effectivement utilisés avant addition.

**Coût réel TTC non confirmé** : conversion/facturation client et charge représentative manquent. Le coût supplémentaire des réservations/files reste à mesurer. Aucun réglage financier changé.

## 6. Plan dans une enveloppe de 200 crédits de développement

Enveloppes proposées, pas prix fixes ni blocage automatique garanti :

| Lot | Crédits visés maximum |
|---|---:|
| Comparaison, inventaire, conflits | 20 |
| Sauvegardes, reprises, essais, régulation | 65 |
| Budget et optimisations prouvées | 25 |
| Tests locaux et parcours bêta FR/EN, deux appareils | 45 |
| Préparation charge et rapport final | 15 |
| Réserve pour régressions indispensables | 30 |
| **Total** | **200** |

Fixer le point de départ de l’enveloppe avant exécution. Réutiliser les travaux/tests ; vérifier les crédits à chaque lot ; à 170 consommés, arrêter le non-bloquant ; demander arbitrage avant dépassement prévisible. Les 97,56 historiques ne sont pas automatiquement imputables à cette nouvelle enveloppe.

Aucune refonte, nouvelle fonctionnalité, migration externe ou changement de modèle. Tests Cloud et IA réelle : budgets distincts approuvés.

## 7. Tests et conditions de lancement

**Avant charge :** comparer réellement les copies ; rejouer les tests pertinents ; vérifier les cinq outils/questionnaire FR/EN à l’écran, deuxième appareil, panne de sauvegarde, fermeture/reconnexion, changement de langue, ESTICE/admin/ordinaire et consultation IA bloquée. Les **303/305/316 tests sont locaux et simulés** : ne pas les additionner ni les appeler tests de charge. Adapter les anciens scénarios de modules masqués.

**Paliers : 50 → 100 → 250 → 500 actifs**, cinq minutes minimum chacun, deux minutes de récupération ; puis vingt minutes à 500 si réussite.

Répartition hypothétique au palier 500 : 200 consultations, 125 questionnaires, 75 modifications Budget/Logement, 60 générations réparties, 40 assistants. Actions répétées réalistes, pas sessions inactives.

Première campagne : IA simulée **côté serveur isolé**, durée 5–10 s, vrais mécanismes d’admission/sauvegarde. Intercepter seulement le navigateur ne teste pas le serveur. Ajouter un pic synchronisé IA/cache froid.

Mesures par outil : p50/p95/p99, attente et génération séparées, erreurs, appels, longueur/âge de file, sauvegarde relue, essais, mémoire/connexions, consommation après ingestion.

- **Arrêt :** fuite/doublon immédiat ; >5 % erreurs, p95 hors IA >5 s, mémoire >85 %, connexions >75 %.
- **Réussite proposée :** zéro perte/fuite/doublon/essai injustifié ; ≥99 % réussite hors IA et p95 ≤2 s ; file sans croissance durable ; résultat/issue récupérable pour toute demande admise. Cibles IA p95 ≤30 s hors pic, ≤60 s sous charge à valider : non garanties avant mesure fournisseur.

**Accords nécessaires :** trafic distant et budget Cloud même simulé ; 500 comptes fictifs sans e-mails massifs ; surveillance/générateur de charge suffisants ; échantillon IA réel avec nombre d’appels et budget distincts ; agrandissement seulement si saturation mesurée et accord financier. Vérifier aussi téléphone réel, documents juridiques et retour arrière sans rejouer les demandes inconnues.

### Limites directement dépendantes de Lovable

Démarrages/limites d’exécution des fonctions, débit fournisseur, connexions, inscription/e-mails. CPU continu et certaines limites de débit non fournis par les diagnostics ici. Les copies ont une base isolée ; l’aperçu principal et le site publié partagent leur base : aucune validation serveur sur le principal sans accord.

**Verdict final après mesures : prêt / prêt avec limites nommées / non prêt.** Ne jamais présenter « 500 connectés » comme « 500 actifs validés ».
