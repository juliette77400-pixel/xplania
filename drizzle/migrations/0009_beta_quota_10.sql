CREATE OR REPLACE FUNCTION public.get_quota_limit(_tool quota_tool)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT 10;
$function$;