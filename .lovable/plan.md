## Constat du code actuel

- Page `/suivi/:tripId` → `SuiviTrip.tsx` → `TripTracker.tsx` (~360 lignes).
- La carte importée est `SimulatedLiveMap` (déjà aliasé en `LiveMap` dans `TripTracker`). Elle utilise Leaflet et est le candidat #1 du crash.
- Aucun composant « Maya » n'est monté sur `/suivi/*` (Maya = `BudgetOnboardingChat`, présent uniquement sur Budget). À confirmer : le « Maya » que tu vois sur Suivi est probablement le widget global Pip déjà présent (`GlobalPipChat`) — auquel cas il faudra ajouter un **PipChat dédié Suivi** plutôt qu'un remplacement.
- Le store `useActiveTrip` existe déjà et est alimenté à l'ouverture de la page → bonne base pour la centralisation réactive.
- `useOfflineCache` existe déjà → base offline en place.
- `ShareTripDialog` existe déjà (lien public via `share_slug`) → base partage en place, à compléter avec QR code.

## Découpage en 4 lots livrables

### Lot A — Stabilisation + carte safe + chatbot Pip (Parties 1, 2, 6)
1. **Tuer le crash** : retirer `SimulatedLiveMap` du rendu, créer `FakeMapView.tsx` (SVG stylisé : route pointillée, pin de départ, pin courant, pins d'étapes positionnés sur une grille relative, sans Leaflet ni tile). Garder les props compatibles (`activities`, `positions`, `pois` → ignorés ou résumés en liste sous la carte) pour ne pas casser les callbacks `onPoiAddToCarnet` / `onAiPinAddToCarnet` (basculés vers la liste « POI autour »).
2. **Visu km (Partie 6)** : sous la fausse carte, barre de progression « parcouru / restant » + libellé `X km parcourus · Y km restants` calculés depuis `trip.total_distance_km` et `trip.target_distance_km` (ou somme des positions). Affichée même hors-ligne.
3. **Chatbot Pip dédié Suivi** : nouveau `SuiviPipChat.tsx` calqué sur `DiscoverPipChat`, options guidées :
   - « 🧭 Suivre mon trajet », « 🏅 Voir mes badges », « 🔔 Configurer une alerte », « 📍 Partager ma position », « 🚶 Juste me promener seule ».
   - Le bouton « me promener seule » referme le chat et n'insiste plus.
4. **i18n** : clés `suiviTrip.fakeMap.*`, `suiviTrip.km.*`, `suiviPip.*` (FR + EN).

### Lot B — Centralisation réactive + badges + partage/QR (Parties 3, 7, 8)
5. **Realtime trip** : élargir `useActiveTrip` pour exposer transport, dates, budget, destination, itinéraire. S'abonner via Supabase Realtime aux `UPDATE` sur `trips` + `trip_activities` du tripId actif, et rafraîchir le store sans rechargement. Affichage d'une carte « Paramètres du voyage » en haut de la page (transport, dates, budget) qui se met à jour live.
6. **Bandeau badges** : nouveau `BadgesSummary.tsx` (count total / unlocked depuis `explore_badges`) + bouton « Voir tous mes badges » → lien `/globe-trotter` (ou route existante équivalente à vérifier dans `App.tsx`).
7. **QR code de partage** : étendre `ShareTripDialog` avec une vue QR (lib `qrcode.react` à ajouter) du `shareUrl`, bouton « Télécharger PNG ». Réactiver l'activation de `share_enabled` via la méthode existante `tracking.toggleShare`.

### Lot C — Alertes + suggestions d'itinéraire adapté (Parties 4, 5)
8. **Schéma BDD** : migration créant `trip_alerts` (catégorie, message, severity, source, link, created_at, trip_id, dismissed) et `alert_subscriptions` (user_id, trip_id, channel `email|sms`, categories[], phone, email). RLS user-scoped, GRANT authenticated.
9. **Edge function `fetch-trip-alerts`** : agrège plusieurs sources publiques, ton neutre et factuel imposé via prompt système :
   - **Météo** : OpenWeatherMap (clé déjà présente).
   - **Climat** : moyenne saisonnière via OpenWeather/historique.
   - **Conflit/sécurité** : pour cette catégorie sensible, **proposition** : afficher un encadré « Source officielle » avec lien direct vers la fiche pays de `https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/` (FR) et `https://travel.state.gov` (EN), plutôt qu'un scraping non autorisé. Ces sites n'exposent pas d'API publique stable → la page renvoie systématiquement vers la source officielle. **À confirmer avec toi avant implémentation.**
   - **Activité / festival / événement** : prompt Gemini avec destination + dates, ton neutre, format JSON `{ title, body, source_url }`.
10. **UI Alertes** : composant `AlertsPanel.tsx` (icônes par catégorie, badge non-lues, bouton « marquer comme lue »).
11. **Abonnement SMS/email** : dialog `AlertSubscriptionDialog.tsx`, sélection canal + catégories. SMS via GatewayAPI (connecteur dispo) — **à confirmer : OK pour utiliser GatewayAPI ?**. Email via l'infra mail Lovable (à provisionner si pas déjà fait).
12. **Suggestion d'itinéraire adapté (Partie 5)** : quand une alerte météo/conflit est active, bouton « ✨ Adapter mon itinéraire » qui appelle une edge function `adapt-itinerary` (Gemini) renvoyant 2-3 propositions concrètes (ex. décaler J3, remplacer activité extérieure). Affichage dans `AlertsPanel`.

### Lot D — Mode hors-ligne renforcé (Partie 9)
13. Étendre `useOfflineCache` pour cacher en plus : `tracking` (déjà partiel), `trip_alerts`, `badges_summary`, `trip` settings. Service Worker minimal (ou simple cache localStorage) pour servir la coquille de page.
14. Bandeau « Hors-ligne — données du <date> » déjà présent → enrichi avec timestamp du dernier sync.

## Détails techniques (interne)

- **FakeMap** : pure SVG/Tailwind, props `{ progressKm, totalKm, stages: {label, done}[] }` ; pas de hook géo.
- **Pip Suivi** : pattern identique à `DiscoverPipChat` (state local, quick replies, action callbacks).
- **Realtime** : `supabase.channel("trip:"+tripId).on("postgres_changes", { table: "trips", filter: ... }, fn).on("postgres_changes", { table: "trip_activities", ... }, fn).subscribe()` dans un `useEffect` du `TripTracker`, cleanup en démontage.
- **QR** : `qrcode.react` (`<QRCodeCanvas value={shareUrl} size={220} />`).
- **Migration alertes** : CREATE TABLE + GRANT authenticated + RLS `user_id = auth.uid()` + trigger `updated_at`.
- **GatewayAPI SMS** : header `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key: GATEWAYAPI_API_KEY`, endpoint `/mobile/single`.

## Questions ouvertes — réponds avant Lot B

1. **Confirmer Pip vs Maya** : on remplace bien le widget global Pip par un Pip-Suivi spécifique, ou tu veux les deux (global + spécifique) ?
2. **Source sécurité/conflit** : OK pour s'en remettre à un **lien sortant** vers diplomatie.gouv.fr / travel.state.gov (pas d'API officielle, pas de scraping) ? Sinon, indique une source alternative.
3. **SMS** : OK pour ajouter le connecteur GatewayAPI (compte requis) ? Sinon je limite l'abonnement au canal email.
4. **Route badges** : la page existante est-elle `/globe-trotter`, `/gamification`, autre ?

Confirme le découpage et les 4 questions et je démarre par le **Lot A** (priorité crash).
