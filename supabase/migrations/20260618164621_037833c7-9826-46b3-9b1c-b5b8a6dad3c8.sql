
CREATE TABLE public.pip_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  stage TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pip_chat_sessions TO authenticated;
GRANT ALL ON public.pip_chat_sessions TO service_role;

ALTER TABLE public.pip_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own pip chat sessions"
  ON public.pip_chat_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_pip_chat_sessions_updated_at
  BEFORE UPDATE ON public.pip_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pip_chat_sessions_user_kind ON public.pip_chat_sessions(user_id, kind);
