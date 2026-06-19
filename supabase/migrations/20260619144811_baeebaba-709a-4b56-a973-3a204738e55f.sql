
-- ============================================================
-- LOT 1 — Refonte Badges & Gamification
-- ============================================================

-- ---------- Roles infra ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE public.gam_verification_method AS ENUM ('geo','photo','ticket','geo_photo','manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gam_claim_status AS ENUM ('in_progress','submitted','validated','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gam_competition_visibility AS ENUM ('public','anonymized','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gam_mission_scope AS ENUM ('weekly','monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Categories ----------
CREATE TABLE public.gam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏅',
  gradient_from TEXT NOT NULL DEFAULT '#057dcd',
  gradient_to TEXT NOT NULL DEFAULT '#9138c8',
  active BOOLEAN NOT NULL DEFAULT true,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gam_categories TO anon, authenticated;
GRANT ALL ON public.gam_categories TO service_role;
ALTER TABLE public.gam_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.gam_categories
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage categories" ON public.gam_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_gam_categories_updated BEFORE UPDATE ON public.gam_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Badges ----------
CREATE TABLE public.gam_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.gam_categories(id) ON DELETE RESTRICT,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  reward_fr TEXT,
  reward_en TEXT,
  points INT NOT NULL DEFAULT 50,
  icon TEXT,
  verification_method public.gam_verification_method NOT NULL DEFAULT 'manual',
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  target_radius_m INT,
  target_place TEXT,
  is_repeatable BOOLEAN NOT NULL DEFAULT false,
  is_weekly_mission_eligible BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  needs_translation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gam_badges_category ON public.gam_badges(category_id) WHERE active;
GRANT SELECT ON public.gam_badges TO anon, authenticated;
GRANT ALL ON public.gam_badges TO service_role;
ALTER TABLE public.gam_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active badges" ON public.gam_badges
  FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage badges" ON public.gam_badges
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_gam_badges_updated BEFORE UPDATE ON public.gam_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Badge claims (anti-cheat: validation server-side only) ----------
CREATE TABLE public.gam_badge_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.gam_badges(id) ON DELETE CASCADE,
  status public.gam_claim_status NOT NULL DEFAULT 'in_progress',
  proof_type TEXT,
  proof_url TEXT,
  proof_hash TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  ai_analysis JSONB,
  reviewed_by UUID REFERENCES auth.users(id),
  review_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gam_claims_user ON public.gam_badge_claims(user_id, status);
CREATE INDEX idx_gam_claims_badge ON public.gam_badge_claims(badge_id, status);
CREATE INDEX idx_gam_claims_hash ON public.gam_badge_claims(proof_hash) WHERE proof_hash IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gam_badge_claims TO authenticated;
GRANT ALL ON public.gam_badge_claims TO service_role;
ALTER TABLE public.gam_badge_claims ENABLE ROW LEVEL SECURITY;

-- Users can read their own claims, admins read all
CREATE POLICY "Users read own claims" ON public.gam_badge_claims
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users may insert only their own claims, never as validated/rejected
CREATE POLICY "Users insert own pending claims" ON public.gam_badge_claims
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('in_progress','submitted')
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

-- Users may update only their own non-validated claims, never escalate status
CREATE POLICY "Users update own pending claims" ON public.gam_badge_claims
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('in_progress','submitted'))
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('in_progress','submitted')
    AND reviewed_by IS NULL
  );

-- Admins can do anything (used by review UI; server validation also runs via service_role edge functions)
CREATE POLICY "Admins manage claims" ON public.gam_badge_claims
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_gam_claims_updated BEFORE UPDATE ON public.gam_badge_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- User category preferences ----------
CREATE TABLE public.gam_user_category_prefs (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.gam_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gam_user_category_prefs TO authenticated;
GRANT ALL ON public.gam_user_category_prefs TO service_role;
ALTER TABLE public.gam_user_category_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own prefs" ON public.gam_user_category_prefs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- User settings (competition visibility) ----------
CREATE TABLE public.gam_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_visibility public.gam_competition_visibility NOT NULL DEFAULT 'anonymized',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gam_user_settings TO authenticated;
GRANT ALL ON public.gam_user_settings TO service_role;
ALTER TABLE public.gam_user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.gam_user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_gam_user_settings_updated BEFORE UPDATE ON public.gam_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Current missions (weekly + monthly) ----------
CREATE TABLE public.gam_current_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES public.gam_badges(id) ON DELETE CASCADE,
  scope public.gam_mission_scope NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_gam_current_missions_active ON public.gam_current_missions(scope, active);
GRANT SELECT ON public.gam_current_missions TO anon, authenticated;
GRANT ALL ON public.gam_current_missions TO service_role;
ALTER TABLE public.gam_current_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view current missions" ON public.gam_current_missions
  FOR SELECT USING (true);
CREATE POLICY "Admins manage missions" ON public.gam_current_missions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- Anti-cheat: validated-only points helper ----------
CREATE OR REPLACE FUNCTION public.gam_user_points(_user_id uuid)
RETURNS INT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(b.points), 0)::int
  FROM public.gam_badge_claims c
  JOIN public.gam_badges b ON b.id = c.badge_id
  WHERE c.user_id = _user_id AND c.status = 'validated';
$$;

GRANT EXECUTE ON FUNCTION public.gam_user_points(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
