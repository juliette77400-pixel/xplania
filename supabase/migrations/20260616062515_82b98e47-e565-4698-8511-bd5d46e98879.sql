-- Tighten premium_waitlist INSERT policy: require valid email and no impersonation of other users
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.premium_waitlist;

CREATE POLICY "Anyone can join waitlist (validated)"
ON public.premium_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (user_id IS NULL OR user_id = auth.uid())
);