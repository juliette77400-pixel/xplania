-- Assistant conversations are kept 30 days after the last message, then removed.
-- Only conversation rows are touched: trips, saved AI results (trip_ai_results) and other trip data are separate tables.
CREATE INDEX IF NOT EXISTS pip_chat_sessions_updated_at_idx ON public.pip_chat_sessions (updated_at);

CREATE OR REPLACE FUNCTION public.purge_old_assistant_chats(_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  IF _days IS NULL OR _days < 30 THEN
    RAISE EXCEPTION 'retention must be at least 30 days';
  END IF;
  DELETE FROM public.pip_chat_sessions
  WHERE updated_at < now() - make_interval(days => _days);
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_old_assistant_chats(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_assistant_chats(integer) TO service_role;