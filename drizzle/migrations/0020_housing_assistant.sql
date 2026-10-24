CREATE TABLE public.housing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  city text CHECK (city IS NULL OR char_length(city) <= 120),
  neighborhood text CHECK (neighborhood IS NULL OR char_length(neighborhood) <= 120),
  housing_type text CHECK (housing_type IS NULL OR housing_type IN ('residence','flatshare','studio','family','other')),
  monthly_rent numeric NOT NULL CHECK (monthly_rent >= 0 AND monthly_rent <= 100000),
  charges_included boolean,
  monthly_charges numeric CHECK (monthly_charges IS NULL OR (monthly_charges >= 0 AND monthly_charges <= 100000)),
  deposit numeric CHECK (deposit IS NULL OR (deposit >= 0 AND deposit <= 100000)),
  extra_fees numeric CHECK (extra_fees IS NULL OR (extra_fees >= 0 AND extra_fees <= 100000)),
  commute text CHECK (commute IS NULL OR char_length(commute) <= 120),
  furnished boolean,
  available_from date,
  available_to date,
  listing_url text CHECK (listing_url IS NULL OR (char_length(listing_url) <= 500 AND listing_url ~* '^https?://')),
  pros text CHECK (pros IS NULL OR char_length(pros) <= 600),
  cons text CHECK (cons IS NULL OR char_length(cons) <= 600),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.housing_options TO authenticated;
GRANT ALL ON public.housing_options TO service_role;
ALTER TABLE public.housing_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own housing options" ON public.housing_options
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add housing options to own trips" ON public.housing_options
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users update own housing options" ON public.housing_options
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users delete own housing options" ON public.housing_options
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX housing_options_trip_idx ON public.housing_options (trip_id, user_id);

CREATE TRIGGER housing_options_updated_at BEFORE UPDATE ON public.housing_options
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.housing_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  item text NOT NULL CHECK (char_length(item) BETWEEN 1 AND 60),
  done_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, item)
);

GRANT SELECT, INSERT, DELETE ON public.housing_checklist TO authenticated;
GRANT ALL ON public.housing_checklist TO service_role;
ALTER TABLE public.housing_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own housing checklist" ON public.housing_checklist
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users check items on own trips" ON public.housing_checklist
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Users uncheck own items" ON public.housing_checklist
  FOR DELETE TO authenticated USING (auth.uid() = user_id);