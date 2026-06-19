
-- 1) Revoke broad PUBLIC execute on all public schema functions; grant explicit roles per function
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_premium_waitlist_email()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_place_rating()                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_explore_progress_from_badge()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_node_media_count()                      FROM PUBLIC, anon, authenticated;

-- API-callable helpers: revoke from PUBLIC, keep only the roles that actually need to call them
REVOKE EXECUTE ON FUNCTION public.get_public_display_name(uuid)                  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_waitlist_count()                           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_trip_tracking(text)                 FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_trip_activities(text)               FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_trip_positions(text)                FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid)                    FROM PUBLIC, anon;

-- Re-grant explicit access for legitimate callers
GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_count()                            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_to_waitlist(text, text, text, jsonb)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_tracking(text)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_activities(text)                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_trip_positions(text)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_place_list(uuid, uuid)                     TO authenticated; -- referenced inside RLS policies

-- 2) Stop the public 'place-reviews' bucket from listing all files via storage.objects
DROP POLICY IF EXISTS "Place review photos are publicly accessible" ON storage.objects;
