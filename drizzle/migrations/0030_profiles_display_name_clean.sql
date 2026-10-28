-- Display names are cleaned on every write (signup trigger included): trimmed, control
-- characters and angle brackets removed, spaces collapsed, at most 40 characters.
-- Normalising instead of rejecting keeps signups from ever failing on a long name.
CREATE OR REPLACE FUNCTION public.clean_profile_display_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF NEW.display_name IS NULL THEN
    RETURN NEW;
  END IF;
  v := regexp_replace(NEW.display_name, '[[:cntrl:]<>]', '', 'g');
  v := btrim(regexp_replace(v, '\s+', ' ', 'g'));
  v := left(v, 40);
  NEW.display_name := NULLIF(btrim(v), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_clean_display_name ON public.profiles;
CREATE TRIGGER profiles_clean_display_name
BEFORE INSERT OR UPDATE OF display_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.clean_profile_display_name();