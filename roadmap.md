# Roadmap — parcours étudiant (après refonte accueil)

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
- [ ] 1. Budget + Valise : plus de génération automatique à la réouverture / actualisation / changement de langue ; résultats enregistrés dans le compte, par séjour (multi-appareil)
- [ ] 2. Visa : analyse enregistrée dans le compte, par séjour
- [ ] 3. Première préparation complète garantie + protections anti-abus ; quotas généreux régénérations/assistants, consultations jamais bloquées
- [ ] 4. Culture : précharger les destinations prioritaires ; geste du jour moins cher
- [ ] 5. Budget IA global : compteur, alertes, plafond contraignant (avec la limite Lovable comme filet)
- Après chaque étape : résultats accessibles, essais bien décomptés, test sur 2 appareils
