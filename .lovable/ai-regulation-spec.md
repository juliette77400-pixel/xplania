# Régulation IA — préparation, non activée

## Frontière de mise en ligne
La base et les fonctions en ligne sont communes au site publié et à l’aperçu. Aucune migration, aucun déploiement ni test distant n’est autorisé par le plan approuvé. Ne pas raccorder les helpers préparés avant accord séparé et validation isolée.

## Architecture retenue pour validation
- Régulation par appel fournisseur, partagée dans PostgreSQL, sans Redis ni abonnement externe.
- Une table serveur de configuration et de pause, une table de places/réservations et une table de demandes idempotentes ; accès service_role uniquement, GRANT explicites et RLS sans accès étudiant direct. L’API lit les demandes avec authentification et propriétaire vérifié, pas avec un identifiant client seul.
- Réserver par transaction atomique avant de lancer l’appel. Le verrou ne dure pas pendant le fetch réseau ; seule la réservation durable demeure. Une demande n’a jamais deux propriétaires de travail actifs.
- Dédupliquer les caches publics par pays/langue/contenu ; les demandes personnalisées par propriétaire/séjour/type/empreinte. Les clés publiques ne contiennent aucun budget ni profil.
- Une expiration de réservation n’autorise pas une deuxième génération : l’issue devient inconnue et doit être réconciliée, faute de preuve de fin de la première. Ne pas réattribuer une place pendant que l’appel peut encore être actif ; les pertes de processus demandent une stratégie vérifiée avant lancement.
- Attente d’admission bornée, différente de la durée de génération. Pas de timer artificiel qui abandonne un appel fournisseur payé. L’attente prolongée s’explique à l’étudiant sans déverrouiller l’envoi.
- 429 : respecter Retry-After, réduire les départs au niveau partagé, reprise bornée après délai ; 5xx uniquement si transitoire. Un échec terminal ou une réponse sans résultat exploitable n’est pas relancé automatiquement.
- 402 / blocage de politique : pause durable commune à tous les points d’entrée ; reprise explicite propriétaire. Refus d’accès fournisseur : aucune sonde ni réessai ; restauration de l’accès puis nouvelle demande explicite. Refus de contenu : terminer seulement la demande concernée.
- Compter un essai par demande d’outil, pas par sous-appel. Réserver les essais par transaction en respectant consume_quota, ESTICE et exemptions admin actuelles. Valider uniquement si le résultat exploitable est durablement enregistré ; annuler de manière idempotente sur échec. Ne pas rembourser à travers un simple count - 1 sans identité de réservation.
- Les générations publiques Culture et les résumés Visa suivent leurs règles actuelles ; aucune nouvelle consommation d’essai sur lecture du cache. Ne pas recoder les règles d’accès sans tests.

## Pourquoi ne pas activer une file durable tout de suite
Elle ajoute états de demandes, réveil à l’ajout, traitement borné et verrous, ainsi que coûts Cloud. Un réveil ne doit jamais engendrer une chaîne sans budget ni refaire du travail fini. Le processeur cesse après vidage, avec reprise future uniquement s’il reste des demandes ; aucun balayage permanent d’une file vide.

## Tests requis avant activation
Avec IA simulée : concurrence de plusieurs processus, aucun doublon fournisseur, propriétaire impossible à changer, cache après acquisition, crash avant et après résultat, panne de sauvegarde, réservation expirée, 402/403/429, aucun essai perdu ou rendu deux fois. Avec appel réel, après autorisation : succès, refus, temps d’attente et coût, puis test de charge progressif isolé.

## Blocages
Accord distinct pour créer/vérifier l’environnement isolé, appliquer le schéma et déployer les fonctions. Limites de débit réelles du fournisseur inconnues. Coûts additionnels Cloud non mesurés. Pas de garantie de capacité 500 avant test représentatif.