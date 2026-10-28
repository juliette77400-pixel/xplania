import { useState, useEffect } from "react";
import { PREPARATION_HOME } from "@/config/featureFlags";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { safeNextPath } from "@/lib/safe-redirect";
import { hasCompleteGuestDraft, PREP_RESUME_PATH, finishedGuestAnswers, ACCOUNT_DRAFT_META_KEY } from "@/lib/prep-quiz";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { browserLang } from "@/lib/browser-locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { authErrorKey } from "@/lib/auth-errors";
import { PROMO_META_KEY, normalizePromo } from "@/lib/promo-code";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  // After sign-in, land on the marketing home ("/home") — never the anonymous
  // Tinder deck at "/". If the user was bounced here from a protected page,
  // send them back there instead.
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  // Beta: signing in leads straight to the preparation dashboard.
  // A visitor who finished the questionnaire always comes back to it, so the answers become the trip.
  const next = safeNextPath(params.get("next") || (hasCompleteGuestDraft() ? PREP_RESUME_PATH : null) || (from && from !== "/" && from !== "/auth" ? from : null), PREPARATION_HOME);
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [promo, setPromo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate(next);
  }, [user, authLoading, navigate, next]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    track("signup_started");
    setLoading(true);
    try {
    // Finished questionnaire answers travel with the account, so confirming the email
    // on another device (e.g. a phone) still creates the trip there.
    const guestAnswers = finishedGuestAnswers();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${next}`,
        data: {
          display_name: displayName,
          locale: browserLang(),
          ...(guestAnswers ? { [ACCOUNT_DRAFT_META_KEY]: guestAnswers } : {}),
          // Checked by the server at the first sign-in; a wrong code gives nothing.
          ...(normalizePromo(promo) ? { [PROMO_META_KEY]: normalizePromo(promo) } : {}),
        },
      },
    });
    setLoading(false);
    if (error) toast.error(t(authErrorKey(error.message)));
    else {
      track("signup_completed");
      toast.success(t("auth.signupSuccess"));
    }
    } catch {
      toast.error(t(authErrorKey("Failed to fetch")));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(t(authErrorKey(error.message)));
    else {
      track("login");
      navigate(next);
    }
    } catch {
      toast.error(t(authErrorKey("Failed to fetch")));
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
    });
    if (result.error) {
      setLoading(false);
      toast.error(t("auth.appleError"));
      return;
    }
    if (result.redirected) return;
    navigate(next);
    } catch {
      setLoading(false);
      toast.error(t("auth.appleError"));
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
    });
    if (result.error) {
      setLoading(false);
      toast.error(t("auth.googleError"));
      return;
    }
    if (result.redirected) return;
    navigate(next);
    } catch {
      setLoading(false);
      toast.error(t("auth.googleError"));
    }
  };

  const handleReset = async () => {
    if (!email.trim()) return toast.error(t("auth.resetEmailFirst"));
    const emailInput = document.getElementById("email-in");
    if (emailInput instanceof HTMLInputElement && !emailInput.reportValidity()) return;
    setLoading(true);
    try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(t(authErrorKey(error.message)));
    else toast.success(t("auth.resetSent"));
    } catch {
      toast.error(t(authErrorKey("Failed to fetch")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <h1 className="sr-only">{t("auth.pageHeading")}</h1>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Link to="/home" className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-2xl font-bold gradient-text">Xplania</span>
        </Link>
        <p className="mb-8 text-center text-xs font-medium text-muted-foreground">
          {t("home.differentiation.tagline")}
        </p>

        <div className="glass-card rounded-2xl p-8">
          <Tabs defaultValue={params.get("mode") === "signup" ? "signup" : "signin"}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email-in">{t("auth.email")}</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email-in" type="email" required className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pwd-in">{t("auth.password")}</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="pwd-in" type="password" required className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {t("auth.signInCta")} <ArrowRight className="w-4 h-4" />
                </Button>
                <Button type="button" variant="link" disabled={loading} onClick={handleReset} className="text-xs text-muted-foreground hover:text-primary w-full text-center">
                  {t("auth.forgotPassword")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t("auth.firstName")}</Label>
                  <Input id="name" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email-up">{t("auth.email")}</Label>
                  <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="pwd-up">{t("auth.password")}</Label>
                  <Input id="pwd-up" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="promo-up">{t("promo.labelOptional")}</Label>
                  <Input id="promo-up" type="text" autoComplete="off" maxLength={40} value={promo} onChange={(e) => setPromo(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {t("auth.signUpCta")} <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("auth.confirmEmailNote")}
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t("auth.continueGoogle")}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={handleApple} disabled={loading}>
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M16.365 1.43c0 1.14-.47 2.2-1.23 3.01-.8.88-2.1 1.56-3.18 1.48-.14-1.1.44-2.28 1.18-3.05.83-.88 2.24-1.53 3.23-1.44zM20.5 17.14c-.55 1.27-.82 1.83-1.53 2.95-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1.01-4.03-1-2.09.01-2.53 1.03-4.07 1.01-1.73-.02-3.05-1.77-4.04-3.33C.14 16.3-.17 11.34 1.4 8.71c1.09-1.82 2.81-2.89 4.43-2.89 1.65 0 2.68 1.02 4.04 1.02 1.32 0 2.13-1.02 4.03-1.02 1.44 0 2.97.79 4.05 2.14-3.56 1.95-2.98 7.03 2.55 9.18z"/></svg>
            {t("auth.continueApple")}
          </Button>
        </div>

        <Link
          to="/home"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("auth.backHome")}
        </Link>
      </motion.div>
    </div>
  );
};

export default Auth;
