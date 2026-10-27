-- Housing: allow "hotel" among the housing types a student can pick.
ALTER TABLE public.housing_options DROP CONSTRAINT IF EXISTS housing_options_housing_type_check;
ALTER TABLE public.housing_options ADD CONSTRAINT housing_options_housing_type_check
  CHECK (housing_type IS NULL OR housing_type = ANY (ARRAY['residence','flatshare','studio','family','hotel','other']));

-- Admin rights are stored by user id in public.user_roles (already granted to the main admin account).
-- Remove the signup triggers that granted admin from an e-mail address (it also had a typo, so a
-- stranger signing up with that address would have become admin).
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
DROP TRIGGER IF EXISTS auto_grant_admin_juliette_trg ON auth.users;
DROP FUNCTION IF EXISTS public.auto_grant_admin_juliette();