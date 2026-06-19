CREATE TABLE IF NOT EXISTS public.gam_verification_settings (
  id text PRIMARY KEY DEFAULT 'default',
  geo_auto_validate boolean NOT NULL DEFAULT true,
  exif_auto_validate boolean NOT NULL DEFAULT true,
  ai_auto_validate_threshold numeric(3,2) NOT NULL DEFAULT 0.70 CHECK (ai_auto_validate_threshold BETWEEN 0 AND 1),
  ai_auto_reject_threshold numeric(3,2) NOT NULL DEFAULT 0.80 CHECK (ai_auto_reject_threshold BETWEEN 0 AND 1),
  force_manual_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gam_verification_settings TO authenticated;
GRANT ALL ON public.gam_verification_settings TO service_role;

ALTER TABLE public.gam_verification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed-in can read settings"
ON public.gam_verification_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage settings"
ON public.gam_verification_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_gam_verification_settings_updated_at
BEFORE UPDATE ON public.gam_verification_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.gam_verification_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;