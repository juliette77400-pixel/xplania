## Refonte Badges & Gamification

Gros chantier touchant data model, vérification anti-triche, UI, admin et import. Découpé en lots livrables successivement (chaque lot est testable, rien ne casse l'existant Travel Map / Globe Trotter).

### Lot 1 — Modèle de données (migration Supabase)
Nouvelles tables :
- `categories` (id, slug, name_fr, name_en, icon, gradient_from, gradient_to, active)
- `badges` (id, category_id FK, name_fr/en, description_fr/en, points, icon, verification_method enum `geo|photo|ticket|geo_photo|manual`, target_lat/lng/radius_m, is_repeatable, is_weekly_mission_eligible, active)
- `badge_claims` (id, user_id, badge_id, status enum `in_progress|submitted|validated|rejected`, proof_type, proof_url, geo_lat/lng, ai_analysis jsonb, reviewed_by, review_reason, submitted_at, reviewed_at)
- `user_category_preferences` (user_id, category_id)
- `user_settings` ajout `competition_visibility enum public|anonymized|private` default `anonymized`
- `current_missions` (id, badge_id, scope `weekly|monthly`, start_date, end_date, active, optional user_id pour perso)
- `app_role` enum + `user_roles` table + `has_role()` security definer (pour l'admin)
- Storage bucket privé `badge-proofs`
- RLS : claims insertable seulement par leur user en statut `submitted`/`in_progress` ; passage à `validated`/`rejected` réservé service_role / admin via Edge Function
- GRANTs explicites sur chaque table publique
- View / RPC `leaderboard_points(user_id)` qui ne somme que claims `validated`

### Lot 2 — Edge Functions vérification
- `badge-claim-submit` : reçoit `{badge_id, proof_type, geo?, photo?, ticket?}`, applique la cascade :
  - geo → Haversine vs target ; dans rayon = `validated`, sinon bascule photo
  - photo → upload Storage, lit EXIF GPS si présent, valide si match sinon `submitted`
  - ticket → Lovable AI Gateway (google/gemini-2.5-flash multimodal, pas Anthropic — déjà câblé, gratuit) prompt JSON strict `{lieu_detecte,date_detectee,correspond,confiance}` ; auto-validate si haute+match, sinon `submitted`
  - anti-abus : rate-limit 5/j/user, hash SHA-256 de l'image (dédup), check incohérence GPS <1h/>200km
- `badge-claim-review` : admin only, valide/refuse + motif, recalcul points
- `missions-rotate` : cron pg_cron lundi 00:00 Europe/Paris (weekly) + 1er du mois (monthly), évite répétition <4 semaines
- `admin-badge-crud` : create/update/soft-delete badges & categories (admin only)

### Lot 3 — UI utilisateur (réutilise palette/composants existants)
- `src/pages/Gamification.tsx` refonte : ajout sections Mission de la semaine + Défi du mois (countdown), filtres catégories, états visuels distincts
- Composant `BadgeMedal` SVG paramétrable (dégradé par catégorie + icône + état verrouillé/en cours/soumis/validé/refusé, animation unlock + confettis via `badges-fx`)
- `BadgeClaimDialog` : bouton "J'ai terminé" → demande géoloc, fallback photo (capture="environment"), upload ticket, états loading/error/success
- `BadgeLocationMap` : réutilise Leaflet déjà utilisé dans Suivi/Discover, pin + cercle, distance utilisateur, bouton Itinéraire (deep-link maps:// / google.com/maps)
- Onboarding + Profil : multi-select catégories (chips style existant)
- Profil → Paramètres : segmented control `competition_visibility` (3 options, défaut anonymized)
- `Leaderboard.tsx` : respecte le mode visibilité ; masque/anonymise en conséquence ; n'agrège que claims validated

### Lot 4 — Admin
- `src/pages/admin/Badges.tsx` (protégé par `has_role('admin')`)
  - Liste filtrable, formulaire create/edit (FR+EN, catégorie, points, méthode, coords/rayon, repeatable, weekly-eligible), soft-delete
  - File d'attente claims `submitted` avec aperçu photo/IA + boutons Valider/Refuser
  - CRUD catégories
- Route cachée du menu si non-admin

### Lot 5 — i18n
- Toutes les nouvelles clés ajoutées dans `fr.json` + `en.json` (statuts, méthodes, paramètres, admin, missions, carte, erreurs)
- Locale passée à l'Edge Function ticket pour réponse IA dans la bonne langue
- Audit final : aucun texte en dur dans les composants

### Lot 6 — Seed / import (260 badges)
Script de migration qui :
- Crée les 10 catégories détectées dans l'XLSX (Culture 75, Exploration 61, Spiritualité 44, Créativité 20, Eco-responsabilité 13, Famille 11, Gastronomie 10, Romantique 10, Travail 10, Technologie 6) avec icône + dégradé
- Insère les 260 badges (name_fr depuis colonne A, description_fr depuis "Comment le débloquer", points depuis col C, category mappée)
- name_en/description_en auto-traduits via Edge Function one-shot (Lovable AI Gateway) en batch ou laissés == FR avec TODO si tu préfères traduire manuellement
- `verification_method` par défaut `manual` (faute de coordonnées dans le sheet) ; badges géo activables ensuite via admin

### Ordre d'exécution proposé (livraisons indépendantes)
1. Lot 1 (migration) — bloquant
2. Lot 6 (seed des 260 badges)
3. Lot 3 (UI user de base avec verification manuelle uniquement)
4. Lot 2 (edge functions vérif auto + ticket IA)
5. Lot 4 (admin)
6. Lot 5 finalisation i18n + checklist validation

### Points à confirmer avant que je lance
1. **IA pour l'analyse de billet** : tu as demandé Anthropic claude-sonnet-4-6 mais le projet utilise déjà Lovable AI Gateway (gratuit, multimodal via `google/gemini-2.5-flash`). Je pars sur Gemini sauf si tu veux absolument ajouter une clé Anthropic (payante, à fournir).
2. **Traduction EN des 260 badges** : auto-traduits via IA au seed, ou je laisse EN = FR avec drapeau "à traduire" dans l'admin ?
3. **Mission de la semaine** : commune à tous (V1 simple, dynamique communautaire) ou personnalisée par utilisateur (selon ses catégories) ? Tu mentionnes les deux.
4. **Compte admin** : à qui je donne le rôle `admin` (ton email user) ?
5. **Vu l'ampleur**, je propose de livrer Lot 1 + Lot 6 en premier (data + 260 badges visibles), puis itérer. OK ?
