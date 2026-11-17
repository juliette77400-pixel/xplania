# Xplania — plan d'action pour 500 étudiants actifs

Plan à valider. Rien ne sera modifié, fusionné, publié ou testé à vos frais avant ton accord. Les crédits indiqués sont des **enveloppes maximales estimées**, pas des prix fixes.

## 1. Ce qui empêche aujourd'hui de garantir 500 étudiants actifs

1. **Sauvegarde non confirmée** : un résultat Visa, Budget ou Valise peut s'afficher comme réussi alors que l'enregistrement sur le compte a échoué.
2. **Reprise après coupure fragile** : si l'étudiant ferme la page pendant une génération, on ne sait pas toujours retrouver le résultat, ce qui peut mener à une génération en double.
3. **Essais suivis en mémoire** : en cas de panne, un essai peut être débité sans résultat, ou rendu deux fois.
4. **Pas de régulation commune des appels IA** : lors d'un pic, toutes les demandes partent en même temps vers le fournisseur, qui peut refuser.
5. **Double lecture Budget** à l'ouverture : correction incomplète.
6. **Aucun test réel à 500** : la base est peu chargée aujourd'hui (mémoire 44 %, 5 connexions sur 60), mais cela ne mesure pas un pic.

## 2. Corrections déjà réalisées / restant à intégrer

**Déjà sur la version de travail principale :** erreurs de lecture des séjours affichées avec « Réessayer » ; Budget sans relance automatique ; résultats Visa/Budget/Valise sauvegardés par séjour ; caches Culture et résumés officiels ; questionnaire sans double avance ; 303 tests locaux.

**Dans la copie « Capacité 500 » (non intégrée) :** 12 entrées protégées, réservation durable des essais, pause commune, régulation par appel ; 316 tests locaux. Restent : sauvegardes compatibles Visa/Valise/Budget, reprises après interruption, parcours à l'écran.

**Dans la copie « Performance » (non intégrée) :** Valise sans IA à l'ouverture ; 305 tests. Reste : unifier les deux lectures Budget.

Les copies sont en retard sur la version principale : une comparaison est nécessaire avant toute intégration.

## 3. Gérer les huit appels IA simultanés sans attente trop longue

Avec 8 places et 5 à 10 secondes par appel : environ 48 à 96 appels par minute (calcul théorique, à mesurer).
- 500 actions simples en même temps : 5 à 10 minutes pour vider la vague.
- 500 analyses Budget (4 appels chacune) : 21 à 42 minutes — trop long.

Solutions prévues :
1. **Ne jamais appeler l'IA pour rien** : consultations, réouvertures et changements de langue lisent la sauvegarde.
2. **Réutiliser les résultats partagés** (Culture, résumés officiels) : une seule génération par pays et langue.
3. **File équitable** : chaque demande admise reçoit un numéro ; l'étudiant voit « ta demande est en cours », peut fermer la page et retrouve son résultat plus tard.
4. **Refus clair avant tout appel** si l'attente dépasse un seuil (par exemple 60 s) : message FR/EN, aucun essai débité.
5. **Budget** : garder 4 appels pour 1 essai, mais supprimer le contexte répété inutile (mesuré avant).
6. **Nombre de places** : ajusté seulement après mesure du débit réel du fournisseur, jamais augmenté au hasard.
7. **Arrivée par vagues** conseillée à l'école (par classe), en complément.

## 4. Interventions classées

### A. Indispensable avant la bêta — 140 crédits max

| # | Intervention | Crédits max |
|---|---|---:|
| A1 | Comparer les deux copies avec la version principale, lister les conflits | 15 |
| A2 | Confirmer la sauvegarde Visa/Budget/Valise sur le compte avant d'afficher le succès | 20 |
| A3 | Reprise après coupure : retrouver le résultat, jamais de double génération ni rejeu automatique | 20 |
| A4 | Essais réservés et rendus une seule fois ; si le contrôle est en panne, bloquer seulement les nouvelles générations (consultations toujours libres) | 15 |
| A5 | Régulation commune des appels IA, file équitable, refus clair sans essai débité, pause commune si crédits/fournisseur bloqués | 25 |
| A6 | Unifier la double lecture Budget sans mélanger séjours ni montants | 10 |
| A7 | Tests locaux + parcours à l'écran FR/EN, deux appareils, coupure, compte ordinaire/ESTICE/admin | 25 |
| A8 | Intégration validée dans un environnement isolé, avec retour arrière préparé | 10 |

### B. Recommandée — 35 crédits max

| # | Intervention | Crédits max |
|---|---|---:|
| B1 | Préparer le test de charge (comptes fictifs sans e-mails, IA simulée côté serveur, scripts) + rapport | 15 |
| B2 | Alléger les événements du questionnaire et la lecture des séjours (les requêtes les plus lourdes mesurées) | 10 |
| B3 | Réduire le contexte répété des 4 appels Budget, après mesure, sans changer Luna ni la qualité | 10 |

### C. Facultative — hors enveloppe sauf accord

| # | Intervention | Crédits max |
|---|---|---:|
| C1 | Raccorder le lecteur de flux renforcé (plus fiable, pas plus rapide) | 10 |
| C2 | Alléger les images du questionnaire (~1,5 Mo) | 5 |
| C3 | Réactiver ou retirer les 5 anciens tests des modules masqués | 5 |

**Total A + B = 175 crédits, + 25 de réserve pour régressions = 200.** C seulement s'il reste de la marge. Point d'arrêt : à 170 crédits consommés, je termine uniquement l'indispensable et je te demande avant tout dépassement.

## 5. Coûts de fonctionnement estimés pour 500 étudiants (par mois)

Hypothèse non mesurée : 500 étudiants × 2 séjours × (8 appels IA + 10 questions) = 18 000 appels Luna + environ 50 résumés Sol partagés.

| Poste | Estimation en crédits/mois |
|---|---:|
| IA (Luna), réponses courtes à longues, marge 20 % | 85 à 167 |
| IA (Sol), résumés officiels partagés | quelques crédits |
| Cloud, plus petite taille en continu | environ 56 |
| Cloud, taille au-dessus si saturation mesurée | environ 74 |
| Pages vues, fonctions, trafic (exemple 10 000 pages) | environ 20 |
| **Total indicatif** | **environ 161 à 243** |

Ce sont des scénarios, pas un devis TTC : la conversion en euros et la consommation réelle restent à mesurer pendant la bêta. Ton plafond IA (35 € TTC avec blocage) et Cloud (30 € en alerte) ne sont pas modifiés.

## 6. Tests pour vérifier la capacité réelle

1. **Tests locaux** (gratuits) : sauvegardes, reprises, essais, isolation entre comptes.
2. **Parcours à l'écran** FR/EN, deux appareils, coupure réseau, changement de langue.
3. **Test de charge avec IA simulée** dans un environnement isolé : paliers 50 → 100 → 250 → 500 étudiants actifs, 5 minutes chacun, puis 20 minutes à 500. Répartition : 200 consultations, 125 questionnaires, 75 modifications Budget/Logement, 60 générations, 40 assistants.
4. **Petit échantillon IA réel** avec nombre d'appels et budget validés par toi séparément.
5. **Téléphone réel** par un humain.

**Arrêt immédiat :** fuite entre comptes, doublon, plus de 5 % d'erreurs, pages hors IA > 5 s, mémoire > 85 %, connexions > 75 %.
**Réussite :** aucune perte, fuite, doublon ni essai injustifié ; pages hors IA ≤ 2 s pour 95 % ; IA ≤ 60 s sous charge (à confirmer) ; file qui se vide.

**Accords séparés nécessaires :** test de charge (coût Cloud même simulé), échantillon IA réel, éventuel agrandissement Cloud, intégration puis publication.

## 7. Limites qui dépendent de Lovable et du fournisseur IA

Démarrage des fonctions après inactivité, débit maximal du fournisseur IA, nombre de connexions, envoi d'e-mails d'inscription limité par heure. L'aperçu et le site publié partagent la même base : aucun test serveur sur le site principal.

**Verdict final après mesures : prêt / prêt avec limites nommées / non prêt.**
