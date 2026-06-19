# Refonte Carnet de voyage — Plan

## État actuel (audit rapide)

Architecture déjà en place (gros avantage) :
- Tables `journals`, `journal_days`, `journal_blocks` (types: note/photo/video/location/mood/audio/highlight), `journal_stories`, `journal_badges`.
- Bucket privé `journal-media` (photos), bucket privé `trip-documents` (pièces jointes), tous deux avec RLS owner-only et lecture publique scoped aux carnets publics.
- Composants: `Carnets.tsx` (liste), `Carnet.tsx` (vue carnet avec onglets Timeline / Live / Story / Insights / Docs / Share), `DayView`, `BlockCard`, `StoryGenerator`, `ShareExport`, `BadgesBar`.
- Edge functions: `journal-story`, `journal-insights`.
- Chatbots existants: `ValisePipChat`, `VisaPipChat` (spécifiques à une feature, pas de routeur global).
- Secrets disponibles: `LOVABLE_API_KEY`, `OPENWEATHER_API_KEY`, `UNSPLASH_ACCESS_KEY`, `RESEND_API_KEY`.
- i18n: `react-i18next` avec `fr.json` / `en.json`, switch `xplania-lang`.

## Faisabilité

**Réalisable immédiatement (réutilise l'existant)**
- Grille "carnets" avec couverture, dates, compte de pages (cover via Unsplash sur la destination, fallback dégradé).
- Suppression du tab "Live" dans Carnet (1 ligne).
- Mode IA "style adaptatif" : nouvelle edge function qui lit les `journal_blocks` (notes) + `pip_chat_sessions` + `journal_stories` précédents de l'user et en déduit un mini "style profile" (vocabulaire, longueur phrases, ton). Badge affiché ("style auto" vs "ton: poétique").
- Ajout photo + mood sur une page (les types de blocs existent déjà ; on améliore le DayView pour rendre photo/mood plus visibles et rapides).
- Lieu géolocalisé + météo du jour : type `location` existe déjà, et `journal_days.weather` existe ; on branche OpenWeather + Geolocation API en 1 bouton "Météo du jour" / "Ma position".
- Documents attachés à une page : on étend `trip_documents` avec un `day_id` nullable optionnel, sinon on garde au niveau voyage et on affiche dans la page.
- Export PDF par page ou carnet entier : `ShareExport` fait déjà l'entier ; on ajoute "exporter cette page" via jsPDF/html2canvas.
- Partage social (image format story Instagram 1080×1920) : génération via html2canvas d'un template DOM stylé (cover + titre + 1 extrait + photo principale). Pas d'appel IA nécessaire.
- Chatbot routeur intelligent : nouveau composant `GlobalPipChat` + edge function `pip-router` qui utilise Gemini avec un schéma d'output `{ intent, route, mode }` et retourne soit une réponse texte soit un CTA pour naviguer vers `/guide-valise` / `/guide-visa` / `/carnet/:id` / `/mood` etc. Détecte "je veux explorer seule" → mode libre (pas de relance).
- Bilingue FR/EN : ajout systématique des clés dans `fr.json` + `en.json`.

**Demande un peu plus de travail (mais réalisable)**
- Note vocale : enregistrement micro via `MediaRecorder`, upload dans `journal-media`, type de bloc `audio` (déjà autorisé). ~30 min de UI/upload.
- Génération de couverture custom IA (au lieu d'Unsplash) : possible avec `google/gemini-3.1-flash-image-preview` via Lovable AI, mais plus lent/coûteux. **Recommandation : Unsplash par défaut, IA en option "Générer une couverture unique".**

**Hors scope / à éviter pour cette itération**
- Real-time collaboration sur un carnet (multi-user).
- Reconnaissance vocale → texte automatique (whisper).

## Décisions techniques à confirmer (rapides)

1. **Couverture par défaut** : Unsplash (rapide, gratuit, déjà branchable). OK ?
2. **Documents par page vs par voyage** : je propose de garder `trip_documents` au niveau voyage (déjà fonctionnel) et d'ajouter une colonne `day_id uuid NULL` pour optionnellement épingler à une page. Le tab Docs reste, et chaque page liste ses docs épinglés.
3. **Note vocale** : on l'inclut dans cette itération (oui/non).
4. **Génération cover IA** : on la met comme bouton secondaire optionnel (pas par défaut) (oui/non).

## Plan d'implémentation (ordre)

1. **DB migration** : ajouter `journals.cover_url` est déjà là ; ajouter `trip_documents.day_id uuid NULL` + index ; ajouter `journals.cover_source` (`unsplash`/`ai`/`custom`) et `journals.style_profile jsonb` (cache du profil d'écriture user).
2. **Edge functions** :
   - `journal-cover` : reçoit destination → renvoie URL Unsplash (ou génère IA si `mode=ai`).
   - `journal-style-profile` : lit les écrits user (`journal_blocks` notes + `journal_stories` manuels), résume en JSON `{vocab_register, sentence_length, emotional_tone, signature_words}`.
   - `journal-story` (modif) : accepte `mode: "tone" | "auto"`, si `auto` charge style_profile et l'injecte dans le prompt.
   - `pip-router` : intent classification → `{ intent, route?, freeMode?, reply }`.
3. **Refonte UI** :
   - `Carnets.tsx` → grille de "carnets" avec couverture (image background + dégradé), titre, dates, badge "X pages, Y photos", menu actions.
   - `Carnet.tsx` → retire tab "live", renomme `tabTimeline` en "Pages", header propre style notebook ; ajoute bouton "Exporter cette page" et "Partager visuel".
   - `StoryGenerator.tsx` → 2 cartes radio en haut : "Choisir un ton" vs "S'adapter à mon style". Badge affiché sur le résultat + sauvegardé dans `journal_stories.tone` (`auto:<digest>`).
   - `DayView.tsx` → barre rapide d'ajout (📝 Note / 📷 Photo / 😊 Humeur / 📍 Lieu / 🎤 Audio / ☀️ Météo du jour) ; mood = sélecteur emoji 1–5.
   - Nouveau `SocialShareDialog` : template DOM 1080×1920, capture html2canvas → blob téléchargeable + bouton "Partager" (Web Share API).
   - Nouveau `PagePdfExportButton` : jsPDF d'une page.
4. **Chatbot routeur** :
   - `GlobalPipChat` (FAB en bas-droite, dispo sur Dashboard/Carnet/Index).
   - Intents : `carnet`, `valise`, `visa`, `mood`, `discover`, `suivi`, `budget`, `free_explore`, `smalltalk`.
   - Si `free_explore` détecté ("je veux me promener seule", "laisse-moi tranquille", "juste explorer") → réponse douce + AUCUNE relance/CTA.
5. **i18n** : nouvelles clés `carnets.*`, `carnet.*`, `j2.*`, `pip.*` en FR et EN.
6. **QA** : check switch FR/EN sur tous les nouveaux écrans, build OK, sécurité (RLS inchangée), Live retiré.

## Réponse attendue de toi avant que je code

Confirme rapidement les 4 décisions techniques ci-dessus (cover Unsplash par défaut, doc.day_id, note vocale oui/non, cover IA oui/non) et je commence par la migration + edge functions.
