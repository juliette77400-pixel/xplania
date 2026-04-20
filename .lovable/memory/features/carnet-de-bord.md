---
name: Carnet de Bord
description: Travel logbook feature with auth, trips persistence, journal blocks, AI story, insights, badges, PDF export, public sharing
type: feature
---
# Carnet de Bord (Travel Logbook)

## Routes
- `/auth` — Email + password signup/signin + Google OAuth (via `lovable.auth.signInWithOAuth`)
- `/reset-password` — Password recovery
- `/carnets` — User trip list (protected)
- `/carnet/:tripId` — Logbook (protected): Timeline, Story, Insights, Share tabs
- `/carnet/public/:slug` — Public read-only view (no auth)

## Auth
- Email verification REQUIRED (auto_confirm = false)
- Google OAuth managed via `src/integrations/lovable/index.ts` (`lovable.auth.signInWithOAuth("google", { redirect_uri })`)
- `useAuth()` hook (`src/hooks/useAuth.tsx`) provides user/session/loading/signOut
- `<ProtectedRoute>` wraps protected pages
- `AuthProvider` wraps Routes in `App.tsx` INSIDE `BrowserRouter`

## DB Tables (all RLS user_id = auth.uid())
- `profiles` — auto-created on signup via trigger `handle_new_user()` (display_name from metadata or email prefix)
- `trips` — title, destination, arrival_city, departure_location, departure_date, return_date, duration, form_data (jsonb), recommendations (jsonb)
- `journals` — trip_id, title, cover_url, tone, is_public, public_slug
- `journal_days` — journal_id, date, title, summary, weather, position
- `journal_blocks` — day_id, journal_id, type (note/photo/video/location/mood/audio/highlight), content (jsonb), position
- `journal_stories` — journal_id, tone, content (AI generated)
- `journal_badges` — user_id + journal_id + code unique
- Public journals readable by anyone via `is_public = true` policies on journals/days/blocks/stories

## Storage
- Bucket `journal-media` (private). Path layout: `{user_id}/{journal_id}/{file}`.
- Policies: owner full CRUD, public read if journal `is_public = true` (folder[2] = journal id)
- Photos use signed URLs (1 year) stored in block.content.url + content.path

## Edge Functions
- `journal-story` — Lovable AI Gateway (gemini-3-flash-preview), 4 tones (storytelling/poetic/fun/documentary), returns `{ content }`
- `journal-insights` — Pure JS aggregation: topLocations, moodTimeline, highlights, happiestDay, stats

## Trip → Journal flow
- When `TravelFormDialog` finishes, `Index.tsx` inserts a row in `trips` (if user logged in) and shows floating CTA "Ouvrir mon Carnet" linking to `/carnet/{tripId}`
- `useJournal(tripId)` auto-creates the journal + one `journal_days` row per day in trip date range
- Block CRUD via `BlockCard.tsx` (inline edit on click)
- Day title saved on blur

## Badges (auto-unlock in `BadgesBar.tsx`)
- explorer (≥3 locations), storyteller (≥5 notes), photographer (≥10 photos), emotional (≥5 moods), highlight (≥3 highlights)

## PDF Export
- `jsPDF` text-only export in `ShareExport.tsx` — title + per-day blocks
- Public link: `/carnet/public/{public_slug}` (slug = uuid 8 chars)

## Key components (src/components/journal/)
- BlockCard, DayView, StoryGenerator, InsightsPanel, BadgesBar, ShareExport

## Access control (Pack Créatif)
- Currently OPEN for all logged-in users during beta. Pricing gating to add later via subscription check.
