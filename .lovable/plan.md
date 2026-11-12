# Préparer Xplania pour 500 étudiants actifs

## Ce qui est réellement prouvé aujourd’hui

- **303 tests sur 303 réussis**, revérifiés maintenant : 52 fichiers Vitest. Ce sont des tests unitaires et des tests d’intégration locaux de règles, hooks et parcours avec services simulés. Ils vérifient notamment les quotas, reprises, sauvegardes, erreurs et flux incomplets.
- **Aucun de ces 303 tests n’est un test de performance ou de charge.** Ils ne mesurent ni 500 sessions, ni le débit du fournisseur IA, ni la tenue du serveur.
- Il existe aussi **14 scénarios Playwright dans 6 fichiers**, hors décompte des 303 ; ils ne constituent pas non plus un test de charge. Les vérifications navigateur déjà présentées étaient des simulations ciblées séparées.
- Relevé actuel : base disponible, mémoire 40 %, 6 connexions sur 60, 1 client de pool sur 200, disque 4 %, aucune alerte de saturation récente. C’est un instantané à faible activité, pas une preuve de capacité à 500.
- Point technique déterminant : une action Budget peut lancer **quatre appels fournisseur en parallèle**. La régulation doit donc porter sur chaque appel IA, tout en conservant **un seul essai par action d’outil**.

**Conclusion : Xplania ne peut pas encore être déclarée prête pour 500 étudiants actifs simultanés.**

## Changements proposés, d’abord sur une copie réellement isolée

### 1. Préparer la copie et les mesures de référence

- Vérifier/créer un environnement avec base, comptes fictifs, fonctions et secrets séparés ; aucune donnée réelle copiée, aucun e-mail ni travail programmé externe dans cette copie.
- Mesurer navigation, questionnaire, consultations et générations simulées avant optimisation : temps de réponse, requêtes envoyées, erreurs, lectures/écritures et ressources.
- Vérifier que les modules masqués ne font plus de requêtes en arrière-plan sur les pages bêta. Les requêtes historiques vers d’anciens modules ne prouvent pas qu’elles existent encore aujourd’hui.

### 2. Réguler chaque génération IA sans changer les quotas

**Dans la partie technique :**
- Ajouter une configuration serveur de pause, des réservations de places et des demandes idempotentes en base. Tables accessibles uniquement au serveur, avec droits explicites et RLS ; aucun accès direct des étudiants.
- Une transaction atomique réserve une place avant **chaque appel fournisseur**, y compris les quatre sous-appels Budget. Le verrou de transaction ne reste pas ouvert pendant l’appel réseau.
- Une clé unique par action explicite relie l’utilisateur, le séjour, l’outil et le contenu demandé. Une nouvelle tentative avec la même clé relit l’état ou le résultat : elle ne relance pas l’IA.
- Attente d’admission courte et bornée, avec message FR/EN. Si aucun appel n’a commencé, une reprise après délai est sûre et ne consomme aucun essai. Pas de file qui balaie en permanence une base vide.
- `429` : respecter `Retry-After`, ralentir les départs et borner les reprises. `5xx` : reprise bornée uniquement si transitoire. `402`/blocage de politique : pause commune durable. Refus d’accès ou de contenu : arrêt sans nouvelle tentative automatique.
- Une demande dont l’issue est inconnue n’est jamais rejouée automatiquement : elle est affichée comme à vérifier, afin d’éviter une double facturation.

**Essais et données :**
- Remplacer la dépendance au suivi en mémoire des essais par une réservation durable et une restitution idempotente. Un échec ne doit jamais retirer deux fois ni rembourser deux fois.
- Si le service de quota/régulation est indisponible, bloquer seulement la **nouvelle génération**, sans appel IA et sans débit ; les résultats enregistrés restent consultables. Cela remplace le fonctionnement actuel qui peut laisser passer l’appel en cas de panne du contrôle.
- Enregistrer côté serveur le résultat exploitable, après vérification du propriétaire et du séjour, avant de confirmer le succès. Conserver exactement les formats actuels de Visa, Budget et Valise et les caches Culture/officiels.
- Ajouter au questionnaire un identifiant de brouillon unique par compte pour éviter un doublon de séjour si la réponse réseau se perd après création. Le brouillon reste conservé jusqu’à confirmation de la sauvegarde.

**Inchangé :** Luna/Sol, SAFETY_RULE, contenu et longueur des réponses, valeurs des quotas, ESTICE, rôle admin, sources Visa et consultations gratuites.

### 3. Renforcer les protections serveur et la lecture des réponses

- Raccorder le lecteur de flux déjà testé à `generateJson` et `generateText` : une réponse coupée, vide, refusée ou refusant l’accès ne doit plus être prise pour un résultat valide.
- Conserver le protocole, les modèles, les plafonds de tokens et les consignes existants ; ne pas changer de fournisseur.
- Valider taille et forme des données avant tout travail, conserver l’authentification et les contrôles de propriété.
- Ne pas ajouter de délai artificiel qui abandonne visuellement un appel IA déjà payé. Ne conserver côté navigateur que la reprise des erreurs de démarrage où la fonction n’a réellement rien exécuté.
- Ajouter au suivi admin des compteurs agrégés : demandes actives/en attente, erreurs, pauses, issues inconnues et durées ; aucun contenu privé des étudiants.

### 4. Optimiser les outils sur preuves, sans réécriture générale

- Vérifier les doubles écritures d’événements du questionnaire et des statistiques : elles dominent une partie du temps SQL historique. Dédupliquer seulement les événements identiques parasites, sans bloquer l’étape suivante et sans changer le consentement ni les statistiques attendues.
- Examiner la lecture des séjours : ne sélectionner que les colonnes nécessaires et tester un index `(user_id, created_at)` seulement si les plans de requête démontrent son intérêt.
- Supprimer les appels réseau de modules masqués uniquement s’ils sont reproduits sur les pages bêta ; ne pas supprimer ces modules.
- Mesurer chaque outil avant/après. Aucune modification de règles métier, de prix, de textes officiels ou de données enregistrées.

## Impact attendu sur la vitesse

| Situation | Effet attendu |
|---|---|
| Consultation ou résultat déjà en cache | Aucun appel IA ; requêtes éventuellement réduites après mesure |
| Génération hors pic | Quelques écritures de réservation/sauvegarde en plus ; surcoût de temps à mesurer, temps du modèle inchangé |
| Pic de demandes | Attente volontaire et message clair plutôt qu’une avalanche d’erreurs ; le délai total peut augmenter |
| Réponse perdue ou nouvelle tentative | Récupération du même état/résultat au lieu d’une deuxième génération |
| Panne du contrôle des essais | Nouvelle génération temporairement indisponible, mais consultations et données conservées |

## Coûts supplémentaires possibles

- **Développement :** crédits Lovable pour la copie isolée, la régulation, les tests de concurrence et les corrections ; montant non prédictible précisément.
- **Fonctionnement :** pas de nouvel abonnement externe proposé. Quelques lectures/écritures supplémentaires par génération et du temps de fonction pendant l’admission ; coût Cloud à mesurer, donc inconnu avant test.
- **Tests :** le trafic simulé peut consommer des crédits base/fonctions/réseau. Tout test avec IA réelle aura un nombre maximal d’appels et un budget de crédits validés séparément.
- **Serveur :** Tiny reste inchangé. Une augmentation ne sera proposée que si les mesures démontrent une saturation que le code ne résout pas, avec accord financier distinct.
- Aucun réglage financier, plafond ou alerte n’est modifié dans ce plan.

## Risques de régression et parade

- **Élevé — double appel, essai perdu ou remboursé deux fois :** tests concurrents multi-processus, transactions et identifiants de réservation.
- **Élevé — régulation indisponible bloquant trop largement :** pause limitée aux nouvelles générations ; lectures toujours ouvertes ; retour arrière par configuration sans effacer les données.
- **Moyen — format de résultat modifié par la sauvegarde serveur :** migration outil par outil et comparaison des résultats existants.
- **Moyen — déduplication du questionnaire refusant un vrai nouveau séjour :** clé limitée au même compte et au même brouillon, tests de nouveaux séjours volontaires.
- **Moyen — optimisation SQL sans bénéfice :** `EXPLAIN` et comparaison avant/après avant tout index.
- **Faible à moyen — messages ou attente incohérents :** parcours FR/EN, mobile et double clic vérifiés.

## Limites qui dépendent de Lovable

- L’aperçu et le site publié partagent actuellement le même backend : aucune migration ni fonction modifiée ne doit être appliquée avant validation isolée et accord de mise en ligne.
- Les démarrages à froid, limites d’exécution/concurrence des fonctions et capacités exactes d’authentification ne sont pas entièrement contrôlables par Xplania.
- Les limites de débit et la disponibilité du fournisseur IA restent externes ; la régulation réduit les pics mais ne garantit pas 500 générations IA simultanées.
- Certaines mesures détaillées, notamment le CPU et certaines limites de débit, ne sont pas disponibles dans les diagnostics actuels.
- Les e-mails d’inscription ont des limites horaires et une délivrabilité propres au service ; un test séparé est nécessaire, sans contourner l’anti-abus ni saturer le Wi-Fi universitaire.

## Protocole représentatif de 500 étudiants

**Sans IA payante dans un premier temps**, avec réponses IA simulées de 5 à 10 secondes et scénarios d’erreur :

- 200 sessions navigant et consultant leurs résultats ;
- 125 remplissant le questionnaire et enregistrant un séjour fictif ;
- 75 utilisant Logement ou modifiant manuellement Budget ;
- 60 lançant des générations simulées Visa/Budget/Valise/Culture de façon échelonnée ;
- 40 posant des questions aux assistants simulés.

Cette répartition est une **hypothèse de test**, faute de mesures réelles d’usage ; elle sera ajustée avec les données de la bêta. Les 500 sessions sont actives sur le même palier, pas 500 inscriptions au même instant.

Paliers : **10 → 30 → 50 → 100 → 250 → 500**, cinq minutes par palier puis deux minutes de récupération. Séparer ensuite le scénario « 500 comptes connectés mais inactifs » et un petit test d’inscriptions/e-mails.

Mesures : p50/p95/p99, taux d’erreur, requêtes réelles, séjours uniques, résultats relus, appels IA réels/simulés, essais débités/remboursés, mémoire, connexions et pool avant-pendant-après. Arrêt à plus de 5 % d’erreurs, p95 non-IA supérieur à 5 secondes, mémoire supérieure à 85 %, connexions supérieures à 75 % ; arrêt immédiat sur fuite entre comptes ou doublon. Ces seuils sont des garde-fous, pas une promesse commerciale.

Un **test IA réel limité**, séparé, commencera bas avec nombre d’appels et budget approuvés ; il mesurera latence, qualité, 429 et coût. Il ne prouvera que la charge réellement exercée.

## Plan de validation final de la bêta

1. **Sécurité :** zéro fuite entre comptes, droits serveur vérifiés, aucun secret exposé.
2. **Données :** zéro perte de réponses, zéro séjour dupliqué, résultats relus après actualisation et sur un second appareil.
3. **Essais :** zéro débit sur consultation ou échec avant appel ; un seul débit par action réussie ; restitution exactement une fois sur échec éligible.
4. **Charge :** palier 500 terminé sur le scénario déclaré, sans arrêt ni saturation persistante ; résultats et limites consignés.
5. **IA réelle :** échantillon autorisé valide, pauses et reprises conformes, coût mesuré après enregistrement ; aucune extrapolation à 500 générations simultanées.
6. **Parcours humain :** téléphone réel, FR/EN, visiteur → questionnaire → inscription → outils → reprise après erreur.
7. **Ouverture :** documents juridiques complétés/validés, surveillance active, retour arrière testé, puis publication manuelle uniquement après ton accord.

Le verdict final sera **prêt / prêt avec limites nommées / non prêt**, avec les preuves associées. Le label « 500 simultanés » ne sera validé que pour les scénarios effectivement mesurés.
