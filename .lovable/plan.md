# Optimisation de Xplania avant la bêta étudiante

## Périmètre et décision proposée

Audit en lecture seule réalisé le **12 novembre 2026, vers 07:24 UTC**. Aucun changement de l’application, de la base, des fonctions ou des réglages ; aucune publication, suppression, génération IA ni test de charge.

**Priorité : fiabiliser les reprises et les sauvegardes, puis réguler les appels IA. Ne pas agrandir le serveur aujourd’hui.** Les tarifs, modèles Luna/Sol, quotas étudiants, code ESTICE et protections existantes restent inchangés.

L’approbation de ce plan autorise les corrections et les tests locaux sans IA réelle. Elle n’autorise ni test de charge distant, ni génération payante, ni changement financier. Les changements des fonctions et de la base seront préparés et testés séparément : leur mise en ligne nécessite un accord distinct, car le serveur actuel est commun à l’aperçu et au site publié.

## Résultats de l’audit

Légende : 🟢 preuve mesurée ou test ciblé ; 🟡 plausible mais non validé à pleine charge ; 🟠 risque identifié ; 🔴 échec critique confirmé ; ⚪ non vérifiable actuellement.

**Attention : « après » est identique à « avant » puisqu’aucune optimisation n’a encore été appliquée.** Les objectifs proposés ne sont pas des résultats obtenus.

| Composant | Indicateur initial / preuve | Problème identifié | Optimisation proposée | Coût éventuel / risque de régression | Indicateur après audit et validation nécessaire |
|---|---|---|---|---|---|
| Base et serveur Tiny | 40 % de mémoire ; 5 connexions sur 60 ; 1 client sur 200 ; disque 4 % ; aucun signal d’épuisement sur 48 h | Aucune saturation actuelle ; capacité à 500 actifs inconnue | Conserver Tiny ; mesurer avant tout agrandissement | Pas de nouveau coût de serveur maintenant ; risque faible | 🟢 état actuel seulement ; 🟡 pleine charge non testée |
| Questionnaire bêta | Brouillon enregistré sur l’appareil ; création du séjour à la fin ; verrou contre double création | Pas d’écriture des réponses en base à chaque étape ; événements statistiques envoyés séparément | Ne pas différer les réponses ni la création ; dédupliquer les événements d’une même transition et envisager leur regroupement | Cloud existant ; risque faible pour les réponses, moyen pour les statistiques | 🟡 parcours non testé sous charge ; tests de rafraîchissement, double clic et échec d’enregistrement à ajouter |
| Requêtes historiques les plus coûteuses | Ancien suivi d’inscription : 809 appels, moyenne 149,79 ms, maximum 4 378,46 ms ; autre variante 1 086 appels à 45,55 ms | Ces écritures concernent l’ancien parcours masqué, pas la sauvegarde des étapes du questionnaire bêta | Ne pas optimiser un parcours masqué au détriment du parcours actif ; mesurer les événements bêta séparément | Aucun changement nécessaire ici | 🟡 historique uniquement ; ne prouve pas un ralentissement actuel du questionnaire |
| Lecture des séjours | 795 appels historiques : moyenne 30,84 ms, maximum 1 447,32 ms ; index propriétaire présent ; lectures mises en commun pendant 1 minute | Lecture de toutes les colonnes ; erreur de lecture transformée en liste vide | Propager l’erreur au lieu de conclure « aucun séjour » ; examiner les colonnes utiles ; comparer un index propriétaire + date avant de l’ajouter | Cloud existant ; risque moyen si une colonne utile est retirée | 🟠 gestion de l’erreur à corriger ; aucun gain d’index démontré pour l’instant |
| Conseils Budget après erreur | Une reprise automatique est autorisée pour « rate » et « server » ; elle n’est pas liée à l’attente demandée par le fournisseur | Risque de recommencer une génération entière, notamment après un résultat non enregistré | Supprimer la reprise globale aveugle ; séparer génération et sauvegarde ; réessayer seulement la sauvegarde si le résultat existe | Pas de nouveau service ; risque faible à moyen | 🟠 risque présent ; prouver avec réponses simulées que l’IA n’est appelée qu’une fois |
| Pics d’appels IA | Appels découpés en parallèle ; limites par utilisateur conservées uniquement dans la mémoire de chaque serveur | Pas de plafond global de simultanéité ; les limites locales ne se cumulent pas correctement entre serveurs | Régulation partagée au niveau de chaque appel fournisseur, pas seulement au niveau de l’outil | Pas de fournisseur supplémentaire proposé ; lectures/écritures Cloud supplémentaires ; risque moyen à élevé | 🟠 pas de régulation globale aujourd’hui ; validation en environnement isolé nécessaire |
| Cache Culture et résumés Visa | Cache partagé avec clés uniques ; regroupement Visa en mémoire locale seulement | Deux serveurs peuvent générer le même contenu en même temps ; la clé unique empêche deux lignes, pas deux facturations IA | Verrou partagé par pays/langue/contenu ; relire le cache après acquisition ; ne jamais régénérer un thème validé | Cloud supplémentaire modeste mais non chiffré ; risque moyen | 🟠 doublons possibles ; test de concurrence simulée entre plusieurs travailleurs |
| Attente IA et erreurs | Pas de délai applicatif explicite dans les helpers de génération ; événements d’échec/refus du flux non traités explicitement | Attente prolongée ; raison du refus parfois remplacée par une erreur générique | Délai borné côté serveur, message d’attente FR/EN, traitement explicite des fins de flux et raisons sûres | Aucun abonnement supplémentaire ; risque moyen | 🟠 contrôle incomplet ; simulations de flux interrompu, vide, refusé et trop lent |
| Essais étudiants | Remboursement sur erreur HTTP ou exception ; décrémentation en base prévue | Trace de consommation en mémoire ; un arrêt du serveur ou un échec du remboursement peut empêcher la restitution | Réservation durable et finalisation idempotente : essai validé uniquement avec résultat exploitable ; annulation sur échec | Écritures Cloud supplémentaires ; risque élevé, tests indispensables ; aucune modification des limites | 🟠 « aucun essai perdu en toute circonstance » n’est pas démontré |
| Compteur d’essais indisponible | Le garde serveur laisse actuellement passer la génération si la base ne répond pas | Protection anti-abus amoindrie pendant une panne | Proposer de bloquer seulement la nouvelle génération temporairement, en laissant les contenus enregistrés accessibles | Pas de service supplémentaire ; changement de comportement à valider avant application | 🟠 fail-open confirmé dans le code |
| Inscriptions depuis le Wi-Fi universitaire | Boutons désactivés pendant la demande ; erreurs traduites via une aide commune | Limites par adresse internet et débit d’e-mails du projet non consultables avec les outils disponibles | Conserver les protections ; expliquer le délai et permettre une nouvelle tentative explicite ; ne pas renvoyer automatiquement un e-mail | 50 000 e-mails transactionnels/mois inclus par espace payant selon la documentation ; 4 crédits/1 000 au-delà ; ce n’est pas une garantie de débit | ⚪ limites exactes non vérifiées ; relever les réglages dans More → Users → Auth settings → Email → Advanced |
| Démarrage des fonctions | 4 tests de reprise réussis ; trois délais avec variation aléatoire ; reprise uniquement sur 503 BOOT_ERROR | Aucun temps de démarrage mesuré aujourd’hui ; ce mécanisme ne régule pas le fournisseur IA | Garder cette reprise distincte des erreurs IA ; ne pas réveiller les fonctions périodiquement | Aucun service ajouté ; risque faible | 🟢 règle de reprise testée localement ; 🟡 simultanéité réelle non mesurée |
| Séparation des données | Règles d’accès lues pour séjours, résultats et compteurs : propriétaire obligatoire, séjour possédé contrôlé à l’écriture | Toute nouvelle régulation doit préserver cette isolation | Accès aux demandes uniquement par leur propriétaire ; contrôle administrateur côté serveur ; cache partagé sans données personnelles | Tests de sécurité, pas de données réelles ajoutées | 🟡 règles présentes, pas de nouveau test réel d’isolation dans cet audit |

Les statistiques de requêtes sont historiques et leur date de remise à zéro n’a pas été vérifiée : elles ne décrivent ni une session de charge ni le trafic de ce matin. Les transactions annulées depuis le démarrage ne sont pas un taux d’erreur utilisateur.

## Ordre des corrections

### 1. Corrections légères, sans nouveau service
- Corriger l’affichage d’une lecture de séjours en échec : ne pas rediriger un étudiant vers un nouveau questionnaire.
- Séparer résultat Budget et enregistrement ; retirer la reprise automatique d’une génération entière.
- Borner l’attente IA côté serveur et traiter les erreurs/refus du flux ; préserver les anciens résultats et la date du résumé Visa.
- Dédupliquer uniquement les événements statistiques réellement doublonnés ; ne pas regrouper ou retarder les réponses étudiantes.
- Compléter les messages d’attente et de nouvelle tentative en français et anglais, sans désactiver les protections d’inscription.

### 2. Régulation partagée, avec validation séparée avant mise en ligne
- Réserver un nombre borné de places pour les **appels fournisseur**, car une génération d’outil peut produire plusieurs appels.
- Dédupliquer une demande personnelle par propriétaire/séjour/type/empreinte et une demande publique par clé de cache.
- Fixer des durées de réservation et d’attente ; libérer les places sur toutes les sorties ; éviter de relancer une demande dont l’issue est inconnue.
- Respecter Retry-After pour 429, sinon attente exponentielle avec variation et nombre de tentatives borné ; 5xx transitoires seulement. Aucun réessai de refus, 400, 401 ou indisponibilité confirmée.
- Arrêter la chaîne et conserver une pause partagée sur manque de crédits ou blocage de politique. Les refus d’accès fournisseur ne déclenchent aucun sondage automatique.
- Une file durable est à retenir seulement si l’attente bornée ne suffit pas : elle exige traitement limité, verrou partagé, progression idempotente, réveil à l’ajout et arrêt après vidage. Pas de tâche qui vérifie éternellement une file vide.
- Aucune valeur de simultanéité ne sera présentée comme une limite réelle du fournisseur : elle devra être mesurée ou restera un réglage prudent de Xplania.

### 3. Dimensionnement et stratégie de tests
- **Tiny :** état actuel mesuré, capacité maximale inconnue.
- **Small / Medium :** aucune mesure comparative ni tarif précis vérifié ; ne pas annoncer des multiplicateurs CPU/mémoire ni des capacités garanties.
- Préparer le protocole 10 → 30 → 50 → 100 → 250 → 500, avec scénarios séparés : connectés inactifs, navigation, questionnaire/enregistrement et IA simulée.
- Vérifier d’abord que la copie dispose réellement d’une base et de comptes isolés. Une simple copie du code n’est pas une isolation suffisante. Aucune donnée étudiante ne sera copiée.
- Mesurer moyenne, p95, p99, erreurs par action, mémoire, connexions et coût observé. CPU et coût instantané resteront ⚪ si indisponibles.
- Arrêt proposé : erreurs > 5 %, p95 des lectures/écritures > 5 secondes, mémoire > 85 % ou connexions > 75 % du maximum. Ces seuils sont des critères de test, pas des limites officielles de Lovable ; ils ne s’appliquent pas au temps de rédaction IA.
- Tester d’abord avec IA simulée. Toute charge distante et toute génération réelle feront l’objet d’une autorisation précisant durée, nombre d’appels et budget. Ne pas poursuivre un test IA après refus terminal du fournisseur.
- Comparer Small puis Medium uniquement si Tiny échoue, avec mêmes données et scénario, après accord sur le coût. Retenir la plus petite taille démontrée suffisante avec marge.

## Coûts et limites

Pas de nouvel abonnement requis par la régulation proposée : utilisation de Lovable Cloud existant, **mais ce n’est pas gratuit**. Réservations, verrous et suivi ajoutent du travail Cloud. Le surcoût doit être mesuré avant généralisation ; aucun montant mensuel fiable n’est disponible aujourd’hui.

Le coût de développement est facturé à l’usage ; un nombre exact de crédits ne peut pas être annoncé honnêtement à l’avance. Aucun réglage financier ni taille de serveur ne sera modifié par cette approbation.

Une alerte Cloud ne bloque pas la consommation, mais un solde général épuisé peut finir par mettre le serveur en pause : conserver une réserve disponible reste nécessaire pour l’accès étudiant.

Les précédentes affirmations « 100–150 actifs en Tiny », « 500 nécessitent Small/Medium », « 20–40 connexions pour 500 étudiants » et les temps estimés sous charge **ne sont pas des capacités démontrées et ne sont pas retenues comme preuves**. Agrandir la base ne relève pas la limite de débit IA ni les protections d’inscription.

## Preuves déjà obtenues et validation finale

**32 tests locaux réussis** : 13 questionnaire, 12 règles des résultats enregistrés, 4 reprise de démarrage, 3 classement des erreurs de connexion. Ils ne prouvent pas la capacité à 500 utilisateurs ni la bonne remise d’un essai après un arrêt serveur.

Après chaque correction : tests ciblés sans IA réelle ; parcours connecté avec réponses simulées ; deux sessions pour les sauvegardes ; refus d’accès à un autre propriétaire ; panne d’enregistrement, double clic, erreurs 429/402/403, flux vide/interrompu et arrêt d’un travailleur. Rapport final reprenant ce tableau avec indicateurs réellement mesurés, coûts observés et limites restantes. Aucune publication automatique.