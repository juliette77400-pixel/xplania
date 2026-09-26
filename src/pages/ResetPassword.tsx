import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const hash = window.location.hash?.replace(/^#/, "");
    const search = window.location.search?.replace(/^\?/, "");
    const params = new URLSearchParams(hash || search || "");
    const errorCode = params.get("error_code") || params.get("error");
    const errorDescription = params.get("error_description");
    if (errorCode || errorDescription) {
      setExpired(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timeout = window.setTimeout(() => {
      setReady((current) => {
        if (!current) setExpired(true);
        return current;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("resetPassword.success"));
      navigate("/app");
    }
  };

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("resetPassword.expiredTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("resetPassword.expiredMessage")}</p>
          <Button className="w-full" onClick={() => navigate("/auth")}>
            {t("resetPassword.backToAuth")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="glass-card rounded-2xl p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-foreground">{t("resetPassword.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("resetPassword.subtitle")}</p>
        <div>
          <Label htmlFor="new-pwd">{t("resetPassword.newPasswordLabel")}</Label>
          <Input id="new-pwd" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !ready}>
          {ready ? t("resetPassword.submit") : t("resetPassword.verifying")}
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
