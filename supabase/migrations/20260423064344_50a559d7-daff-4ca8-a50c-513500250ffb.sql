-- Anti-spam rules for premium_waitlist:
-- 1) Normalize emails (lowercase + trim) automatically
-- 2) Enforce unique email (deduplication)
-- 3) RPC for client to safely subscribe with 7-day cooldown for re-subscribe attempts on the same email/source

-- Normalize trigger
CREATE OR REPLACE FUNCTION public.normalize_premium_waitlist_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_premium_waitlist_email ON public.premium_waitlist;
CREATE TRIGGER trg_normalize_premium_waitlist_email
BEFORE INSERT OR UPDATE ON public.premium_waitlist
FOR EACH ROW EXECUTE FUNCTION public.normalize_premium_waitlist_email();

-- Backfill: normalize existing rows so the unique index can be created safely
UPDATE public.premium_waitlist SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- Deduplicate existing rows: keep the oldest row per email
DELETE FROM public.premium_waitlist a
USING public.premium_waitlist b
WHERE a.email = b.email
  AND a.created_at > b.created_at;

-- Unique index on email (case-insensitive guaranteed by trigger)
CREATE UNIQUE INDEX IF NOT EXISTS premium_waitlist_email_unique ON public.premium_waitlist (email);

-- Secure RPC for safe subscription with 7-day cooldown
CREATE OR REPLACE FUNCTION public.subscribe_to_waitlist(
  _email text,
  _source text DEFAULT 'unknown',
  _pack text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(_email));
  v_existing public.premium_waitlist%ROWTYPE;
  v_cooldown_days int := 7;
BEGIN
  -- Validate email format
  IF v_email IS NULL OR v_email = '' OR v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_email');
  END IF;

  -- Lookup existing entry
  SELECT * INTO v_existing FROM public.premium_waitlist WHERE email = v_email LIMIT 1;

  IF FOUND THEN
    -- Already on the list: enforce 7-day cooldown before any new write attempt
    IF v_existing.created_at > now() - (v_cooldown_days || ' days')::interval THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason', 'cooldown',
        'cooldown_days', v_cooldown_days,
        'next_allowed_at', v_existing.created_at + (v_cooldown_days || ' days')::interval
      );
    END IF;

    -- Past cooldown: refresh metadata + source but keep same row (still deduplicated)
    UPDATE public.premium_waitlist
       SET source = COALESCE(_source, source),
           pack = COALESCE(_pack, pack),
           metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(_metadata, '{}'::jsonb),
           created_at = now()
     WHERE id = v_existing.id;

    RETURN jsonb_build_object('ok', true, 'reason', 'updated');
  END IF;

  -- New email: insert
  INSERT INTO public.premium_waitlist (email, source, pack, metadata)
  VALUES (v_email, COALESCE(_source, 'unknown'), _pack, COALESCE(_metadata, '{}'::jsonb));

  RETURN jsonb_build_object('ok', true, 'reason', 'created');
END;
$$;

-- Allow anon + authenticated to call the RPC (insert path is controlled inside the function)
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) TO anon, authenticated;