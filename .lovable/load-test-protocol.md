# Protocole progressif — non exécuté

Ne lancer aucun trafic distant sans accord spécifique. Une copie du code seule ne suffit pas : vérifier une base, des comptes, des secrets et des fonctions isolés, et désactiver les e-mails/tâches externes dans cette copie uniquement. Aucun compte ni séjour réel à copier.

## Scénarios distincts
1. Connectés inactifs : une connexion préparée avant le palier, aucune action ensuite.
2. Navigation : consultation de pages et séjours, sans clic de génération ; intercepter l’IA.
3. Questionnaire : saisie locale, création unique du séjour à la fin, lecture après rafraîchissement ; réponses fictives.
4. IA simulée : réponses 5–10 secondes, 429 avec Retry-After, 402/403, refus HTTP 200, coupure de flux, panne de sauvegarde.
5. Inscriptions : test séparé du Wi-Fi partagé et des e-mails après vérification des limites et autorisation ; ne pas contourner l’anti-abus.

## Paliers
10 → 30 → 50 → 100 → 250 → 500, cinq minutes par palier et deux minutes de récupération. Une série par scénario : ne pas mélanger les utilisateurs inactifs et ceux qui écrivent. Le nombre représente des sessions actives, pas 500 comptes créés instantanément.

Mesurer chaque action : moyenne, p95, p99, erreurs, requêtes réellement envoyées, créations uniques, résultats relus, mémoire, connexions/pool avant-pendant-après et crédits demandés après ingestion. CPU et attribution financière par environnement : non vérifiés tant qu’un diagnostic ne les fournit pas.

Arrêt : >5 % d’erreurs, p95 lectures/écritures >5 secondes, mémoire >85 %, connexions >75 % du maximum ; arrêt immédiat sur fuite entre utilisateurs ou doublon de séjour. Ces seuils ne sont pas des garanties de service. Ne pas appliquer le seuil de 5 secondes à une réponse IA.

## IA réelle, séparée
Seulement avec un accord précisant budget et nombre d’appels fournisseur (une génération d’outil peut en faire plusieurs). Commencer bas et augmenter si les réponses restent valides. Aucun changement de Luna/Sol. Refus terminal : fin du test, sans changement de modèle, de clé ou de protocole.

## Comparaison de tailles
Tiny d’abord ; Small/Medium uniquement si échec mesuré et accord financier. Même scénario, mêmes données fictives, même période et même taux de requêtes. Garder la plus petite taille validée avec marge. Les crédits par 30 jours continus sont un scénario tarifaire, pas la consommation observée de Xplania.

## Retour en arrière
Garder la version actuelle. Les nouveaux schémas restent additifs ; couper la régulation par configuration serveur après diagnostic sans effacer les résultats ni réservations. Vérifier qu’une bascule ne rejoue pas les demandes d’issue inconnue. La suppression de la copie et de ses comptes fictifs nécessite validation de son identité et accord ; aucune donnée réelle à supprimer.