CREATE OR REPLACE FUNCTION public.refund_quota(_user uuid, _tool public.quota_tool)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.usage_counters SET count = GREATEST(count - 1, 0)
  WHERE user_id = _user AND tool = _tool AND period_month = date_trunc('month', now())::date;
END $$;
REVOKE ALL ON FUNCTION public.refund_quota(uuid, public.quota_tool) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_quota(uuid, public.quota_tool) TO service_role;