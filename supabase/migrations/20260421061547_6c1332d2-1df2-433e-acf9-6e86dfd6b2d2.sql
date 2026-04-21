CREATE TABLE public.premium_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'unknown',
  pack text,
  user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX premium_waitlist_email_unique ON public.premium_waitlist (lower(email));

ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.premium_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);