CREATE OR REPLACE FUNCTION public.lock_submitted_claim_evidence()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.ai_analysis IS DISTINCT FROM OLD.ai_analysis THEN
    RAISE EXCEPTION 'ai_analysis is server-managed';
  END IF;
  IF OLD.status = 'submitted' AND (
       NEW.geo_lat IS DISTINCT FROM OLD.geo_lat OR NEW.geo_lng IS DISTINCT FROM OLD.geo_lng
    OR NEW.proof_url IS DISTINCT FROM OLD.proof_url OR NEW.proof_hash IS DISTINCT FROM OLD.proof_hash
    OR NEW.proof_type IS DISTINCT FROM OLD.proof_type OR NEW.badge_id IS DISTINCT FROM OLD.badge_id
    OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at) THEN
    RAISE EXCEPTION 'Submitted claim evidence cannot be changed';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_lock_submitted_claim_evidence ON public.gam_badge_claims;
CREATE TRIGGER trg_lock_submitted_claim_evidence BEFORE UPDATE ON public.gam_badge_claims
FOR EACH ROW EXECUTE FUNCTION public.lock_submitted_claim_evidence();