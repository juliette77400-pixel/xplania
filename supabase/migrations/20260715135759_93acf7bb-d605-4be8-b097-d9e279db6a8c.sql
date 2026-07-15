
CREATE OR REPLACE FUNCTION public.record_quiz_completion()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;
  INSERT INTO public.quiz_completions (user_id, count) VALUES (v_user, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN jsonb_build_object('ok', true);
END;
$$;
