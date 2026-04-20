---
name: Suivi de Voyage
description: Real-time travel companion (Suivi de voyage) — GPS tracking, immersive hero, Leaflet map with planned route + recorded trail + nearby POI, enriched timeline with distances/durations, AI suggestions, offline cache, public sharing
type: feature
---
# Suivi de Voyage (Live Travel Tracker)

## Naming
Always use "Suivi" / "Suivi de voyage" in user-facing UI (NEVER "Tracking"). Code identifiers can remain English (TripTracker, useTracking).

## Routes
- `/suivi` — User trip list
- `/suivi/:tripId` — Main view (immersive hero + Map + POI + Timeline + Suggestions)
- `/suivi/public/:slug` — Public read-only live view
- Embedded as **"📡 Suivi live"** tab inside `/carnet/:tripId`

## DB Tables (RLS user_id = auth.uid(), public read via trip_tracking.share_enabled=true)
- `trip_tracking`, `trip_positions`, `trip_activities`, `trip_checkins` — all in `supabase_realtime`

## Tech
- **Map**: Leaflet + react-leaflet + OSM tiles
- **Routing line**: OSRM public demo (`router.project-osrm.org`) — driving polyline between activities, fallback dashed straight line
- **POI nearby**: OpenStreetMap Overpass API (`overpass-api.de`) — restaurants, culture, nature, shopping, nightlife — radius 600m, in-memory + sessionStorage cache by ~100m grid → 50 results max
- **Geolocation**: `watchPosition` (high/balanced) or polled `getCurrentPosition` (low)
- **Realtime**: Supabase channel per trip on trip_tracking + trip_activities

## Edge Functions
- `trip-suggestions` — Lovable AI Gateway (gemini-3-flash-preview), 4 contextual suggestions
- `trip-seed-activities` — imports trip.recommendations.itinerary + journal location blocks

## Key Hooks (`src/hooks/`)
- `useGeolocation` — wraps watchPosition; `haversineKm` helper
- `useTracking` — main: state, activities, positions, recordPosition (jitter <10m), startTracking, stopTracking, updatePrecision, toggleShare, updateActivityStatus, seedActivities
- `useNearbyPOI(position, enabled, radius)` — OSM Overpass nearby places, classified into 6 categories with `POI_COLORS` + `POI_LABELS` exports
- `useCheckIn` — auto status=done within 100m for ≥90s
- `useNotifications`, `useOfflineCache`

## Key Components (`src/components/tracking/`)
- `LiveMap` — user marker (stable, no flicker), planned OSRM route (purple), recorded GPS trail (cyan), activity pins colored by status, **POI pins colored by category with popup → "Itinéraire ↗" + "+ Carnet"**, fallback Google Maps / OSM buttons
- `LiveTimeline` — grouped by day with progress count, vertical connector spine, step number badges, status icon (todo/in_progress=pulse/done), **distance + walking duration estimate (~5 km/h) between consecutive activities** (haversine)
- `LiveStats` — distance, lieux visités, étapes, progression %
- `LiveSuggestions` — calls `trip-suggestions` with current position + mood
- `TrackingControls` — start/stop, precision (high/balanced/low), notifications, share toggle + slug, manual seed
- `TripTracker` — composes all + **immersive hero gradient (cyan/purple blur orbs, "EN DIRECT" pulse badge, total distance live)** + category filter chips + POI on/off Switch + POI legend dots

## Auto-seed
On first mount of TripTracker, if activities.length === 0 → call seedActivities().

## Privacy
Geolocation OFF by default, opt-in. Low-power = no high accuracy + 60s polling. Share = revocable random 8-char slug.

## Landing
5th card in `FeaturesSection` (Activity icon, link `/suivi`).
