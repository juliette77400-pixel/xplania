-- Tighten SECURITY DEFINER helper functions: revoke anon EXECUTE where only authenticated context makes sense.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid) FROM anon;