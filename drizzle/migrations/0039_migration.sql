-- 1. Waitlist: never let a caller rewrite an existing entry
CREATE OR REPLACE FUNCTION public.subscribe_to_waitlist(_email text, _source text DEFAULT 'unknown'::text, _pack text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_email text := lower(trim(_email));
BEGIN
  IF v_email IS NULL OR v_email = '' OR v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_email');
  END IF;
  IF EXISTS (SELECT 1 FROM public.premium_waitlist WHERE email = v_email) THEN
    RETURN jsonb_build_object('ok', true, 'reason', 'exists');
  END IF;
  INSERT INTO public.premium_waitlist (email, source, pack, metadata)
  VALUES (v_email, left(COALESCE(_source, 'unknown'), 64), left(_pack, 64), COALESCE(_metadata, '{}'::jsonb));
  RETURN jsonb_build_object('ok', true, 'reason', 'created');
END $function$;

-- 2. Game points: only your own (admins any)
CREATE OR REPLACE FUNCTION public.gam_user_points(_user_id uuid)
 RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(b.points), 0)::int
  FROM public.gam_badge_claims c
  JOIN public.gam_badges b ON b.id = c.badge_id
  WHERE c.user_id = _user_id AND c.status = 'validated'
    AND (_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
$function$;

-- 3. Exploration nodes: client inserts start as planned, never city level
CREATE OR REPLACE FUNCTION public.guard_explore_node_insert()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.status := 'planned';
    NEW.visited_at := NULL;
    IF NEW.level IS NULL OR NEW.level < 2 THEN NEW.level := 2; END IF;
  END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS trg_guard_explore_node_insert ON public.explore_nodes;
CREATE TRIGGER trg_guard_explore_node_insert BEFORE INSERT ON public.explore_nodes
  FOR EACH ROW EXECUTE FUNCTION public.guard_explore_node_insert();

-- 4. Exploration badges: server re-checks the unlock rule
CREATE OR REPLACE FUNCTION public.guard_explore_badge_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  n int; v int; m int; ok boolean;
  vt text; t text; rx text; target int; kind text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid()
     OR NOT EXISTS (SELECT 1 FROM public.trips WHERE id = NEW.trip_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT kind_, type_, regex_, target_ INTO kind, t, rx, target FROM (VALUES
    ('explorer','visited',NULL,NULL,1),('urban_explorer','visited_type','place',NULL,5),('globe_trotter','visited',NULL,NULL,10),
    ('collector','all',NULL,NULL,20),('city_master','visited',NULL,NULL,8),('pathfinder','visited',NULL,NULL,30),
    ('local_insider','gem',NULL,NULL,5),('voyageur_master','visited',NULL,NULL,50),
    ('foodie','type','food',NULL,1),('food_lover','type','food',NULL,5),('street_food','visited_type','food',NULL,3),
    ('gourmet','visited_type','food',NULL,10),('coffee_addict','name',NULL,'caf[eé]|coffee',5),
    ('sweet_tooth','name',NULL,'patiss|bakery|dessert|glace|ice',3),('wine_explorer','name',NULL,'vin|wine|bar',3),
    ('michelin_dream','visited_type','food',NULL,20),('museum_visitor','visited_type','culture',NULL,1),
    ('culture_hunter','type','culture',NULL,5),('art_lover','visited_type','culture',NULL,5),
    ('history_buff','name',NULL,'monument|histor|chateau|palais|cathedral|temple',5),('architect_eye','type','culture',NULL,10),
    ('show_lover','name',NULL,'concert|spectacle|theatre|opera|show',3),('photo_journal','media',NULL,NULL,20),
    ('culture_master','visited_type','culture',NULL,20),('memory_keeper','media',NULL,NULL,10),('storyteller','media',NULL,NULL,5),
    ('share_friend','with_media',NULL,NULL,1),('mood_curator','media',NULL,NULL,5),('travel_blogger','media',NULL,NULL,30),
    ('group_traveler','planned',NULL,NULL,10),('influencer','media',NULL,NULL,50),('social_legend','media',NULL,NULL,100),
    ('nature_lover','type','nature',NULL,3),('mountain_adventurer','type','nature',NULL,5),
    ('night_explorer','visited_type','nightlife',NULL,3),('party_animal','type','nightlife',NULL,5),
    ('water_lover','name',NULL,'plage|beach|lac|lake|piscine|rivière|river',3),
    ('sunset_chaser','name',NULL,'vue|view|panoram|rooftop|sunset|coucher',5),('extreme_sport','type','activity',NULL,3),
    ('legendary_explorer','adventure',NULL,NULL,25)
  ) AS d(code_, kind_, type_, regex_, target_) WHERE code_ = NEW.code;
  IF kind IS NULL THEN RAISE EXCEPTION 'unknown badge'; END IF;

  SELECT count(*) INTO v FROM public.explore_nodes x WHERE x.trip_id = NEW.trip_id AND
    CASE kind
      WHEN 'visited' THEN x.status = 'visited'
      WHEN 'visited_type' THEN x.status = 'visited' AND x.type = t
      WHEN 'type' THEN x.type = t
      WHEN 'all' THEN true
      WHEN 'gem' THEN x.status = 'visited' AND (x.metadata->>'hidden_gem')::boolean IS TRUE
      WHEN 'name' THEN x.name ~* rx
      WHEN 'with_media' THEN x.media_count > 0
      WHEN 'planned' THEN x.status = 'planned'
      WHEN 'adventure' THEN x.type IN ('nature','activity','nightlife')
      ELSE false END;
  IF kind = 'media' THEN
    SELECT count(*) INTO v FROM public.explore_node_media WHERE trip_id = NEW.trip_id;
  END IF;
  IF v < target THEN RAISE EXCEPTION 'badge criteria not met'; END IF;
  RETURN NEW;
END $function$;
DROP TRIGGER IF EXISTS trg_guard_explore_badge_insert ON public.explore_badges;
CREATE TRIGGER trg_guard_explore_badge_insert BEFORE INSERT ON public.explore_badges
  FOR EACH ROW EXECUTE FUNCTION public.guard_explore_badge_insert();