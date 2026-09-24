ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS home_city text,
  ADD COLUMN IF NOT EXISTS travel_style text,
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dream_destinations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prompts jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) > 300 THEN
    RAISE EXCEPTION 'bio too long';
  END IF;
  IF jsonb_typeof(NEW.prompts) <> 'array' OR jsonb_array_length(NEW.prompts) > 3 THEN
    RAISE EXCEPTION 'max 3 prompts';
  END IF;
  IF coalesce(array_length(NEW.interests, 1), 0) > 12
     OR coalesce(array_length(NEW.languages, 1), 0) > 10
     OR coalesce(array_length(NEW.dream_destinations, 1), 0) > 5 THEN
    RAISE EXCEPTION 'too many items';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS validate_profile_fields ON public.profiles;
CREATE TRIGGER validate_profile_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();