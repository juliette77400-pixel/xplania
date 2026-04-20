---
name: Suivi de Voyage
description: Real-time travel companion with GPS tracking, live map (Leaflet), dynamic timeline, auto check-in, AI suggestions, offline cache, public sharing
type: feature
---
# Suivi de Voyage (Live Travel Tracker)

## Routes
- `/suivi` (protected) — User trip list with CTA "Activer le suivi live"
- `/suivi/:tripId` (protected) — Main tracking view (Map + Stats + Controls + Timeline + Suggestions)
- `/suivi/public/:slug` — Public read-only live view (no auth)
- Also embedded as **"📡 Suivi live"** tab inside `/carnet/:tripId`

## DB Tables (all RLS user_id = auth.uid(), public read via trip_tracking.share_enabled=true)
- `trip_tracking` — one row per trip: is_active, started_at, ended_at, share_enabled, share_slug, last_lat/lng, last_position_at, total_distance_km, settings (precision: high|balanced|low, notifications)
- `trip_positions` — GPS history: trip_id, lat, lng, accuracy, speed, recorded_at (skip jitter <10m)
- `trip_activities` — unified timeline: source (ai|journal|manual), day_date, title, description, category, lat, lng, scheduled_at, status (todo|in_progress|done), completed_at, position
- `trip_checkins` — auto check-in events: activity_id, lat, lng, distance_m, checked_at
- All 4 tables added to `supabase_realtime` publication

## Tech
- **Map**: Leaflet + react-leaflet + OpenStreetMap tiles (no API key)
- **Geolocation**: `navigator.geolocation.watchPosition` for high/balanced, `getCurrentPosition` polled every 60s for low-power
- **Notifications**: browser Notification API (opt-in)
- **Offline**: localStorage cache key `xplania:tracking:{tripId}` with online/offline event listeners
- **Realtime**: Supabase channel per trip subscribes to trip_tracking + trip_activities

## Edge Functions
- `trip-suggestions` — Lovable AI Gateway (gemini-3-flash-preview) tool-calling, returns 4 contextual suggestions (food/culture/nature/shopping/nightlife/hidden_gem) based on lat/lng + weather + mood + budget
- `trip-seed-activities` — Reads trip.recommendations.itinerary[].activities + journal_blocks type=location, upserts into trip_activities (clears previous ai/journal sourced rows first)

## Key Hooks (`src/hooks/`)
- `useGeolocation` — wraps watchPosition with precision modes; exports `haversineKm` helper
- `useTracking` — main hook: tracking state, activities, positions, recordPosition (jitter filter + distance accumulation), startTracking, stopTracking, updatePrecision, toggleShare (auto-generates 8-char slug), updateActivityStatus, seedActivities, realtime sync
- `useCheckIn` — detects arrival within 100m for ≥90s → auto status=done + insert in trip_checkins + toast "ajouter au carnet ?"
- `useNotifications` — request + notify wrappers
- `useOfflineCache` — persists tracking+activities to localStorage when online; `readCache(tripId)` for offline hydration

## Key Components (`src/components/tracking/`)
- `LiveMap` — Leaflet with user position (blue), activity markers colored by status (gray=todo, amber=in_progress, green=done), polyline trail, popups, category filter
- `LiveTimeline` — grouped by day_date, click status icon to cycle todo→in_progress→done
- `LiveStats` — distance, lieux visités, étapes, progression %
- `LiveSuggestions` — calls trip-suggestions edge function with current position + mood input
- `TrackingControls` — start/stop, precision selector (high/balanced/low), notifications opt-in, share toggle + copyable URL, manual seed button
- `TripTracker` — composes everything, auto-seeds on first load if empty

## Auto-seed
On first mount of TripTracker, if activities.length === 0 then call seedActivities() which invokes trip-seed-activities to import from trip.recommendations + journal location blocks.

## Privacy
- Geolocation OFF by default, opt-in via "Démarrer" button
- Low-power mode = enableHighAccuracy: false + 60s polling
- Sharing = random slug, revocable via Switch
- Public view shows last known position + timeline (read-only), updates via realtime

## Landing
- 5th card in `FeaturesSection` (Activity icon, link `/suivi`)
- Grid: `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`
