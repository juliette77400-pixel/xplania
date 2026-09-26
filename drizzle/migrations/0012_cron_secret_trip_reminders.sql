CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS private.cron_secrets (
  name text PRIMARY KEY,
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')
);
REVOKE ALL ON private.cron_secrets FROM anon, authenticated;
INSERT INTO private.cron_secrets(name) VALUES ('trip-reminders') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_cron_secret(_name text, _secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT _secret IS NOT NULL AND EXISTS (SELECT 1 FROM private.cron_secrets WHERE name = _name AND secret = _secret)
$$;
REVOKE EXECUTE ON FUNCTION public.verify_cron_secret(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text, text) TO service_role;

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'trip-reminders-daily'),
  command := $cmd$select net.http_post(
    url:='https://alhhvpqtskymltokcgov.supabase.co/functions/v1/trip-reminders',
    headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',(select secret from private.cron_secrets where name='trip-reminders')),
    body:='{}'::jsonb);$cmd$
);