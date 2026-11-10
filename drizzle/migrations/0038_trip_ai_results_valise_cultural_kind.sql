DO $$
DECLARE c text;
BEGIN
  SELECT conname INTO c FROM pg_constraint
   WHERE conrelid = 'public.trip_ai_results'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%kind = ANY%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.trip_ai_results DROP CONSTRAINT %I', c); END IF;
END $$;
ALTER TABLE public.trip_ai_results ADD CONSTRAINT trip_ai_results_kind_check
  CHECK (kind = ANY (ARRAY['visa','budget_insights','valise_tip','valise_outfits','budget_state','valise_cultural']));