ALTER TABLE public.traveler_profiles
  ADD COLUMN IF NOT EXISTS onboarding_step text,
  ADD COLUMN IF NOT EXISTS need_tags text[],
  ADD COLUMN IF NOT EXISTS qualif jsonb;

UPDATE public.traveler_profiles
   SET onboarding_step = 'done'
 WHERE completed_at IS NOT NULL AND onboarding_step IS NULL;