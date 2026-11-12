# Roadmap — parcours étudiant (après refonte accueil)

## Capacité 500 étudiants actifs — préparation demandée le 12/11
- [x] Confirmer la nature des 303 tests : unitaires/intégration locale simulée, aucun test de charge ; 303/303 réussis
- [x] Présenter changements, vitesse, coûts, risques, limites Lovable, protocole 500 et validation finale sans modifier l’application
- [x] Créer deux copies avec base de test isolée : régulation serveur et optimisations frontend ; aucune donnée réelle copiée
- [ ] Réguler chaque appel fournisseur, rendre essais/reprises idempotents et conserver les consultations — validation isolée puis accord de mise en ligne requis
- [ ] Raccorder les flux serveur, renforcer les validations et mesurer les optimisations des outils — accord de mise en ligne requis
- [ ] Exécuter les paliers jusqu’à 500 sessions avec IA simulée — accord de test distant requis
- [ ] Test IA réel borné — budget, nombre d’appels et accord explicite requis
- [ ] Fiabiliser le suivi navigateur : 9/14 scénarios réussis ; 5 anciens tests de modules masqués à exclure dynamiquement ou réactiver avec leur module, sans les présenter comme des pannes bêta

## Optimisation avant 500 étudiants (plan validé le 12/11)
- [x] Lectures des séjours : erreur distincte d’une liste vide, nouvelle tentative explicite (3 pages connectées vérifiées)
- [x] Budget : pas de reprise automatique d’une génération ; panne de lecture du résultat distincte d’un résultat absent (tests simulés)
- [x] Questionnaire : transitions dédupliquées, réponses conservées en cas d’échec (tests locaux)
- [x] Attente des assistants : pas de faux échec pendant une demande encore active, messages FR/EN (attente simulée vérifiée)
- [x] Préparer et tester la gestion des flux IA sans appel réel (helper non raccordé)
- [ ] Raccorder les flux serveur : accord distinct de mise en ligne requis, pas de déploiement effectué
- [ ] Régulation et réservations durables : spécification prête ; validation isolée et activation attendent l’accord distinct
- [x] Protocole de charge isolée et rapport des preuves préparés ; aucun test distant lancé

- [x] Bugs : bouton « Créer mon compte » coupé (aperçu questionnaire, mobile) ; ronds flottants Visa et Valise en plus de « Aide »
- [x] Questionnaire : retirer l'étiquette « Glisse la photo… », question budget plus simple avec exemple, lien « Essayer le Budget sans compte » après l'aperçu
- [x] Tableau de bord : carte « Ta prochaine étape » en haut, outils compacts sans les « 0 % / Non commencé »
- [x] 5 outils : titres au ton étudiant (pas « Propulsé par IA », pas « parfaitement »), Visa avis en une ligne, Valise préremplie selon le séjour, Culture sans re-demander le pays
- [x] Visa : ne poser que les questions manquantes (passeport, escale) ; reprise des réponses visiteur après inscription testée de bout en bout
- [ ] À proposer plus tard : montrer un premier résultat sans IA avant les boutons « Créer / Lancer / Générer » (Budget, Visa, Valise)

## Corrections fonctionnelles avant la bêta (prompt du 27/10)
- [x] 1. Admin juliette77400@gmail.com : rôle admin par identifiant, quotas illimités côté serveur
- [x] 2. Questionnaire : pas de Maroc par défaut
- [x] 3. Logement : bouton Modifier (type, meublé, trajet, points d'attention, avantages, inconvénients)
- [x] 4. Culture : geste du jour quotidien par pays/contexte + 2-3 infos par conseil
- [x] 5. Valise : activités, météo actuelle réelle, régénération conseil, retrait doublons culture, tenues, vélo
- [x] 6. Espace de préparation : boutons « Ouvrir »
- [x] 7. Budget : phrase retirée, illustration, astuces locales, alertes & bons plans, graphique/répartition, Ping descriptions
- [x] 8-9. Vérifications + rapport

## Optimisations ciblées avant la bêta (prompt du 28/10)
- [x] 1. Vérification quotidienne automatique des liens (date réelle en base, échec = ancienne date + « à revérifier », lien accessible ≠ contenu contrôlé)
- [x] 2. Accueil : titre/sous-titre/CTA, présentation, personnalisation (3 badges), gratuité en 2 cartes (écoles partenaires / autres), FAQ gratuité + lien Offres
- [x] 3. Offres écoles : sélecteur Mensuel | Annuel, total + coût par étudiant, sans remise inventée
- [x] 4. Culture : geste du jour qui change chaque jour par destination sans répétition rapprochée ; présentation plus visuelle (cartes, pictos, À faire / À éviter / Bon à savoir)
- [x] 5. Budget : bouton « Régénérer » pour Alertes et Optimisations IA (2-3 conseils, anti double clic, sans inventer de problème, crédits vérifiés)
- [x] 6. Visa : audit des informations essentielles — filet de sécurité ajouté à la checklist (passeport, admission, santé, autorisation de stage, résidence, copies, Ariane)
- [ ] Accès « étendu » écoles partenaires : non mis en place (mêmes 10 essais pour tous) — décision de Juliette attendue

## Crédits IA épuisés (28/10)
- [x] Message clair « IA en pause » dans tous les outils au lieu d'une erreur ou de « plus d'essais », résultats déjà affichés conservés, essai rendu

## Performances, personnalisation, traductions, assistants (prompt du 28/10, 2e)
- [x] 1. Culture : mesurer puis réduire le temps de chargement (cache, affichage progressif, squelettes, réessai)
- [x] 2. Visa : textes plus humains, tutoiement, personnalisés, sans rien inventer
- [x] 3. Profil : modifier son nom affiché (Enregistrer/Annuler, validation, partout dans l'app)
- [x] 4. Audit traductions FR/EN (textes en dur, cohérence, mobile)
- [x] 5A. Chatbot Budget : audit + vrais tests
- [x] 5B-E. Assistant réutilisable par outil (Visa, Valise, Culture, Logement) avec quotas et sécurité
- [x] 6-7. Tests + compte rendu

## Retours du 28/10 (3e)
- [x] Guides par pays dans la partie outils de l'accueil et dans le menu
- [x] 21 pays : 19 nouveaux guides publics (MX, BR existaient), fiches culture écrites à la main, sites visa ID/ZA, 14 ressources logement vérifiées
- [x] 21 pays reliés partout : devises, noms anglais, repères de prix Budget, repères pays des assistants IA
- [x] Îles et outre-mer : encart dans Visa/Budget/Logement + rubrique « Et les îles ? » des guides

## Sécuriser l'IA pour la bêta ESTICE du 20/11/2026 (validé le 29/10) — en attente des réponses de Juliette avant exécution
- [x] 1. Budget + Valise : plus de génération automatique à la réouverture / actualisation / changement de langue ; résultats enregistrés dans le compte, par séjour (multi-appareil)
- [x] 2. Visa : analyse enregistrée dans le compte, par séjour
- [ ] 3. Première préparation complète garantie + protections anti-abus ; quotas généreux régénérations/assistants, consultations jamais bloquées
- [ ] 4. Culture : précharger les destinations prioritaires ; geste du jour moins cher
- [ ] 5. Budget IA global : compteur, alertes, plafond contraignant (avec la limite Lovable comme filet)
- [ ] 6. Clarification du 29/10 : première préparation garantie = Visa + tous les conseils Budget + conseils/tenues/vérification Valise + tous les thèmes Culture + Logement/Tableau de bord, hors quotas ; faisabilité et budget présentés, décidé : pilote 20/11→12/12, 2 séjours garantis, modèles actuels ; montant à réserver recommandé (≈ 1 300), en attente de sa validation
- Après chaque étape : résultats accessibles, essais bien décomptés, test sur 2 appareils

- [x] Chiffrer crédits Lovable vs OpenAI direct pour 1 000 voyages (IA vs développement), sans modification
- [x] Test qualité Luna/Sol vs modèles actuels (Visa x3, Culture, Valise, Logement, assistant Visa), sans modification
- [ ] Après accord : renforcer la checklist Visa (titre de séjour pour non-nationaux, pièces d enregistrement UE > 3 mois) avant de passer à Luna
- [x] Retest Luna avec consignes renforcées (copie de test uniquement)
- [ ] Après accord : appliquer consignes Visa/assistants/Culture, règle titre de séjour seulement si résidence ≠ nationalité, retirer l écriture inclusive des consignes IA, contrôle qualité Culture avant mise en cache, passage à Luna
- [x] Migration Luna préparée en copie de test + rappels Visa côté écran + contrôle qualité Culture + tests de non-régression (en attente de validation avant mise en ligne du serveur)
- [x] Mise en ligne serveur Luna/Sol (1er nov. 2026, 17:53 UTC) + vérification en ligne ; sauvegarde de l ancienne version gardée pour retour arrière
- [ ] Juliette : publier pour mettre en ligne les rappels Visa à l écran

## Sécuriser la bêta avec les plafonds (audit du 01/11, accord le 01/11)
- [x] 4-5. Résumé officiel Visa : garder le dernier résumé daté + avertissement si revérification impossible ; aucun essai compté sans clic de l étudiant
- [x] 6. Tenues Valise et bouton Aide : message calme « IA en pause » quand le plafond est atteint
- [x] 7. Réponse Valise vide : essai rendu
- [ ] 1-3. Visa, Budget, Valise : résultats enregistrés dans le compte par séjour (multi-appareil), plus de relance à la réouverture / actualisation / changement de langue, bouton « Mettre à jour » après modification du séjour

## Finalisation avant bêta (document du 1/11)
- [x] P0 Budget/Valise/Visa : résultats enregistrés par séjour, aucune relance automatique, bouton « Mettre à jour »
- [x] P0 Assistants Budget et Visa : réponse vide → essai rendu
- [x] P0 Suppression de compte : efface aussi les données sans lien direct au compte (Logement, résultats IA, accès bêta…)
- [x] P0 Sécurité : isolation entre étudiants testée, 2 alertes du scan expliquées (données publiques voulues)
- [x] P2 Projets de textes juridiques FR/EN (non publiés)
- [ ] Purge automatique des conversations assistants > 30 jours — attend l'accord de Juliette (suppression de données)
- [ ] Remplacer les textes juridiques publiés — attend statut/SIREN/adresse et accord de Juliette
- [ ] P3 UX/SEO/traductions complètes, tests multi-appareils réels, inscription/suppression de compte de bout en bout — crédits à arbitrer

## Finalisation 2 (1/11 soir)
- [x] Conservation 30 jours des conversations : nettoyage prêt et testé (en pause), copies sur l'appareil limitées à 30 jours
- [x] Documents juridiques v2 FR/EN (non publiés)
- [x] Tests réels compte fictif : inscription, quotas, ESTICE, sauvegarde multi-appareils, mobile, suppression de compte
- [x] Message d'inscription qui reste affiché ; export des données complété
- [x] Nettoyage des conversations activé (2 anciennes conversations Valise vides supprimées)
- [ ] Publier les textes juridiques — attend adresse, hébergeur, statistiques écoles
- [x] Budget : montants, catégories et changements manuels enregistrés dans le compte (testé sur deux appareils)
- [x] Statistiques école : agrégées, seuil 5, arrondi 5, destinations rares regroupées
