CREATE OR REPLACE FUNCTION public.guard_explore_badge_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v int; t text; rx text; target int; kind text;
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

  SELECT count(*) INTO v FROM public.explore_nodes x
  WHERE x.trip_id = NEW.trip_id AND
    CASE kind
      WHEN 'visited' THEN x.status = 'visited'
      WHEN 'visited_type' THEN x.status = 'visited' AND x.type = t
      WHEN 'type' THEN x.type = t
      WHEN 'all' THEN true
      WHEN 'gem' THEN x.status = 'visited' AND (x.metadata->>'hidden_gem')::boolean IS TRUE
      WHEN 'name' THEN x.name ~* rx
      WHEN 'with_media' THEN true
      WHEN 'planned' THEN x.status = 'planned'
      WHEN 'adventure' THEN x.type IN ('nature','activity','nightlife')
      ELSE false END
    AND (kind NOT IN ('visited','visited_type','gem','with_media') OR EXISTS (
      SELECT 1 FROM public.explore_node_media m
      WHERE m.node_id = x.id AND m.user_id = auth.uid() AND m.url IS NOT NULL AND btrim(m.url) <> ''));
  IF kind = 'media' THEN
    SELECT count(*) INTO v FROM public.explore_node_media
    WHERE trip_id = NEW.trip_id AND user_id = auth.uid() AND url IS NOT NULL AND btrim(url) <> '';
  END IF;
  IF v < target THEN RAISE EXCEPTION 'badge criteria not met'; END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.subscribe_to_waitlist(_email text, _source text DEFAULT 'unknown'::text, _pack text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_email text := lower(trim(_email));
BEGIN
  IF v_email IS NULL OR v_email = '' OR v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_email');
  END IF;
  INSERT INTO public.premium_waitlist (email, source, pack, metadata)
  SELECT v_email, left(COALESCE(_source, 'unknown'), 64), left(_pack, 64), COALESCE(_metadata, '{}'::jsonb)
  WHERE NOT EXISTS (SELECT 1 FROM public.premium_waitlist WHERE email = v_email);
  RETURN jsonb_build_object('ok', true, 'reason', 'created');
END $function$;

CREATE OR REPLACE FUNCTION public.owns_place_list(_list_id uuid, _user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT _user_id = auth.uid()
     AND EXISTS (SELECT 1 FROM public.place_lists WHERE id = _list_id AND user_id = _user_id);
$function$;