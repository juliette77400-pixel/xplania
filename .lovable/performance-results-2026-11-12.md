# Résultats — optimisation avant la bêta

## Ce qui est livré dans l’aperçu
Corrections des lectures de séjours en panne, de la reprise automatique Budget, des transitions du questionnaire et de l’attente des assistants. Aucune publication, migration appliquée, fonction déployée, taille de serveur ou réglage financier changé. Modèles, quotas, ESTICE et données conservés.

| Élément | Avant | Correction / coût éventuel | Risque | Après et preuve |
|---|---|---|---|---|
| Séjours | Erreur transformée en compte vide | Erreur affichée avec nouvelle tentative, pas de création proposée par redirection ; pas de service ajouté | Faible | 🟢 panne simulée sur compte connecté : /app, /preparation et /guide-logement restent sur leur page ; FR/EN et mobile vérifiés |
| Budget | Une reprise automatique pouvait relancer tout le travail | Reprise automatique supprimée ; lecture du compte requise avant de conclure à un résultat absent ; copie locale conservée sur panne | Faible à moyen | 🟢 tests : une seule invocation pour 429/500/403 et panne de sauvegarde ; zéro invocation si lecture du compte échoue sans copie locale |
| Questionnaire | Plusieurs actions de la même étape pouvaient envoyer deux événements | Verrou synchrone de transition ; déverrouillage après retour ou échec ; aucune réponse différée | Faible | 🟢 tests de transition ciblés ; brouillon existant conservé ; charge 500 non testée |
| Assistants | Faux échec au bout de 45 secondes, travail potentiellement encore actif | Attendre la vraie réponse ; message après 15 secondes, anti-double clic renforcé ; aucun abonnement supplémentaire | Faible à moyen | 🟢 simulation Logement à 17 secondes : message anglais, envoi bloqué pendant attente, une seule réponse finale et champ réactivé |
| Assistant Valise hors ligne | Vidage automatique à l’ouverture et remise en file de demandes déjà envoyées | Reprise uniquement sur action explicite ; aucune remise en file d’une demande soumise ; retrait d’un élément refusé lors du traitement manuel | Moyen | 🟡 code corrigé et règles terminales testées ; parcours hors ligne complet non vérifié en navigateur |
| Flux serveur IA | Fin incomplète ou refus non traités explicitement | Nouveau lecteur pur préparé, non raccordé ; aucun appel fournisseur | Moyen | 🟢 7 tests simulés (UTF-8 fragmenté, métadonnées, sortie finale, coupure, vide, refus et 403) ; 🟠 comportement serveur en ligne inchangé |
| Régulation globale | Limites locales par serveur | Spécification durable préparée sans appliquer de schéma ; coût Cloud supplémentaire à mesurer | Élevé | 🟠 non implémentée/activée ; attend accord de validation isolée et mise en ligne |
| Essais après arrêt serveur | Restitution dépendant d’une trace en mémoire | Réservation durable spécifiée ; aucune modification du quota | Élevé | 🟠 pas de garantie nouvelle en cas de crash ; attend validation isolée |
| Base Tiny | 40 % mémoire, 5/60 connexions, 1/200 pool, disque 4 %, pas d’alerte 48 h | Aucune augmentation | Aucun changement | 🟢 relevé ponctuel ; 🟡 pleine charge inconnue, aucune capacité maximale annoncée |
| Wi-Fi universitaire / e-mails | Limites exactes non disponibles | Message sans promesse de délai fixe ; protections préservées | Faible | ⚪ débit réel non vérifié ; pas d’e-mail envoyé pendant les tests |
| Charge 500 / Small / Medium | Aucun test comparatif | Protocole progressif préparé | Aucun trafic lancé | 🟡 stratégie prête ; capacité 500 toujours non démontrée |

## Tests et limitations
303 tests locaux réussis sur 52 fichiers après les premières corrections ; aucune génération IA réelle. Avertissement non bloquant préexistant dans les tests de l’ancien questionnaire : certaines mises à jour React ne sont pas enveloppées par act. Ce n’est pas une preuve de panne en production.

Navigateur : session du compte existant, aucune création de compte ni séjour ; toutes les fonctions interceptées, écritures bloquées. Pannes de lecture simulées sur trois pages, bouton Réessayer en anglais, vérification mobile 390 × 844 et absence de débordement. Assistant Logement avec seule réponse simulée à 17 secondes. Aucun test de charge.

La limitation artificielle à 45 secondes a été retirée plutôt que remplacée par un autre abandon : interrompre l’attente visuelle ne garantit pas l’arrêt de l’IA facturée. Le message prolongé ne relance ni ne coupe la demande. Les limites d’exécution de Lovable restent extérieures à Xplania.

## Coûts vérifiables, pas d’économie annoncée
Relevé financier du 30 octobre au 12 novembre 2026, 07:26 UTC : crédits demandés enregistrés — développement 108,30 (dont suivi automatique 6,90), base 1,513545363, IA 2,116974880, fonctions 0,001130000, réseau 0,000969203 et stockage 0,000000266. Ce ne sont ni des paiements en euros ni une mesure de trafic à 500 ; dates d’enregistrement et activité peuvent différer.

Tarifs actuels du calcul serveur seul, avant franchises, en supposant 720 heures actives : compteur pico 55,74 crédits, small 120,74, medium 237,86. Ce sont des scénarios continus, pas les coûts mensuels observés ni la preuve qu’une taille supporte 500 actifs. Le nom utilisateur actuel reste Tiny. Aucun agrandissement effectué.

Coût exact de développement non prédictible ; réduction de crédits après correction non mesurée. La régulation partagée n’exige pas de nouvel abonnement proposé, mais ajoute du travail Cloud : coût supplémentaire inconnu tant qu’elle n’est pas mesurée.

## Accord encore nécessaire
1. Vérifier/créer un environnement réellement isolé, puis préparer et valider les réservations durables, la régulation et les pauses serveur.
2. Raccorder le lecteur de flux et déployer les corrections serveur seulement après présentation des tests et accord distinct.
3. Autoriser séparément le test de charge distant, puis d’éventuels appels IA réels avec budget précisé.
4. Publication manuelle des corrections d’écran après validation.

La spécification de régulation et le protocole de charge sont conservés dans le projet. Aucun indicateur « 500 simultanés » passé au vert sans mesure.