ALTER TABLE public.housing_options
  ADD COLUMN IF NOT EXISTS commute_minutes integer,
  ADD COLUMN IF NOT EXISTS written_contract boolean,
  ADD COLUMN IF NOT EXISTS visited boolean,
  ADD COLUMN IF NOT EXISTS payment_before_visit boolean,
  ADD COLUMN IF NOT EXISTS lease_notes text;
ALTER TABLE public.housing_options
  ADD CONSTRAINT housing_options_commute_minutes_range CHECK (commute_minutes IS NULL OR (commute_minutes >= 0 AND commute_minutes <= 600)),
  ADD CONSTRAINT housing_options_lease_notes_len CHECK (lease_notes IS NULL OR char_length(lease_notes) <= 500);