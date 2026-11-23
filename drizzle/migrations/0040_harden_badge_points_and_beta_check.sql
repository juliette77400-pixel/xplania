CREATE OR REPLACE FUNCTION public.enforce_admin_claim_decision()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('validated','rejected')
     AND OLD.status NOT IN ('validated','rejected') THEN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'forbidden: only admins can validate or reject a claim';
    END IF;
    IF NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'forbidden: admins cannot decide their own claim';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_gam_badge_points()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.points IS DISTINCT FROM OLD.points AND EXISTS (
    SELECT 1 FROM public.gam_badge_claims WHERE badge_id = OLD.id AND status IN ('validated','submitted')
  ) THEN
    RAISE EXCEPTION 'forbidden: points of a badge with claims cannot change';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_gam_badge_points ON public.gam_badges;
CREATE TRIGGER guard_gam_badge_points BEFORE UPDATE ON public.gam_badges
FOR EACH ROW EXECUTE FUNCTION public.guard_gam_badge_points();

CREATE OR REPLACE FUNCTION public.has_beta_access(_user uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.beta_access WHERE user_id = _user AND expires_at > now())
    AND (auth.uid() IS NULL AND current_user <> 'anon' OR _user = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
$function$;

REVOKE EXECUTE ON FUNCTION public.has_beta_access(uuid) FROM PUBLIC, anon;