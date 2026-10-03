CREATE TABLE public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nps smallint NOT NULL CHECK (nps BETWEEN 0 AND 10),
  ease smallint NOT NULL CHECK (ease BETWEEN 1 AND 5),
  favorite_feature text CHECK (char_length(favorite_feature) <= 60),
  trip_context text CHECK (char_length(trip_context) <= 60),
  comment text CHECK (char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.satisfaction_surveys TO authenticated;
GRANT ALL ON public.satisfaction_surveys TO service_role;
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own survey" ON public.satisfaction_surveys FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own surveys" ON public.satisfaction_surveys FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all surveys" ON public.satisfaction_surveys FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX satisfaction_surveys_user_idx ON public.satisfaction_surveys(user_id);