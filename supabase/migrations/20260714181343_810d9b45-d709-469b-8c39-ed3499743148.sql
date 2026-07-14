ALTER TABLE public.traveler_profiles
  ADD COLUMN IF NOT EXISTS reward_points int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_unlocks text[] NOT NULL DEFAULT '{}';