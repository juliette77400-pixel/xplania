// Security tab of /parametres — Lot 3
// Lets the user change password & email, sign out everywhere,
// and manage linked OAuth accounts (Google).
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Mail, LogOut, Link2, Unlink, ShieldCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

type SupportedProvider = "google";
const PROVIDERS: { id: SupportedProvider; label: string }[] = [
  { id: "google", label: "Google" },
];

const SecuritySettings = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Sessions
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Linked accounts
  const [identities, setIdentities] = useState<any[]>([]);
  const [identitiesLoading, setIdentitiesLoading] = useState(true);
  const [providerBusy, setProviderBusy] = useState<string | null>(null);

  const refreshIdentities = async () => {
    setIdentitiesLoading(true);
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
    setIdentitiesLoading(false);
  };

  useEffect(() => {
    refreshIdentities();
  }, []);

  const linkedProviders = useMemo(
    () => new Set(identities.map((i) => i.provider)),
    [identities]
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newPassword.length < 8) {
      toast.error(t("settings.security.password.tooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.security.password.mismatch"));
      return;
    }
    setPwLoading(true);
    try {
      // Reauth with current password
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) {
        toast.error(t("settings.security.password.wrongCurrent"));
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("settings.security.password.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error(t("settings.security.email.invalid"));
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail },
        { emailRedirectTo: `${window.location.origin}/parametres?tab=securite` }
      );
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("settings.security.email.success"));
      setNewEmail("");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSignOutAll = async () => {
    setSessionsLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("settings.security.sessions.success"));
      await signOut();
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleLink = async (provider: SupportedProvider) => {
    setProviderBusy(provider);
    try {
      // supabase-js exposes linkIdentity for adding a provider to existing user
      const { error } = await (supabase.auth as any).linkIdentity({
        provider,
        options: { redirectTo: `${window.location.origin}/parametres?tab=securite` },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (err: any) {
      toast.error(err?.message ?? String(err));
    } finally {
      setProviderBusy(null);
    }
  };

  const handleUnlink = async (identity: any) => {
    if (identities.length <= 1) {
      toast.error(t("settings.security.linked.lastWarn"));
      return;
    }
    setProviderBusy(identity.provider);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t("settings.security.linked.unlinked"));
      await refreshIdentities();
    } finally {
      setProviderBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Password */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.security.password.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.security.password.hint")}
        </p>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cur-pw">{t("settings.security.password.current")}</Label>
            <Input
              id="cur-pw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">{t("settings.security.password.new")}</Label>
            <Input
              id="new-pw"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conf-pw">{t("settings.security.password.confirm")}</Label>
            <Input
              id="conf-pw"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" disabled={pwLoading}>
            {pwLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("settings.security.password.cta")}
          </Button>
        </form>
      </Card>

      {/* Email */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.security.email.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.security.email.hint", { email: user?.email ?? "" })}
        </p>
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-email">{t("settings.security.email.new")}</Label>
            <Input
              id="new-email"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              required
            />
          </div>
          <Button type="submit" disabled={emailLoading}>
            {emailLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("settings.security.email.cta")}
          </Button>
        </form>
      </Card>

      {/* Sessions */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <LogOut className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.security.sessions.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.security.sessions.hint")}
        </p>
        <Button variant="destructive" onClick={handleSignOutAll} disabled={sessionsLoading}>
          {sessionsLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("settings.security.sessions.cta")}
        </Button>
      </Card>

      {/* Linked accounts */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.security.linked.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.security.linked.hint")}
        </p>

        {identitiesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Email/password identity */}
            {identities
              .filter((i) => i.provider === "email")
              .map((i) => (
                <div
                  key={i.identity_id}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium">Email</span>
                    <span className="text-xs text-muted-foreground">
                      {i.identity_data?.email ?? user?.email}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {t("settings.security.linked.primary")}
                  </span>
                </div>
              ))}

            {/* OAuth providers */}
            {PROVIDERS.map(({ id, label }) => {
              const linkedIdentity = identities.find((i) => i.provider === id);
              const isLinked = !!linkedIdentity;
              const busy = providerBusy === id;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3"
                >
                  <div className="flex items-center gap-2">
                    {isLinked ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{label}</span>
                    {isLinked && linkedIdentity.identity_data?.email && (
                      <span className="text-xs text-muted-foreground">
                        {linkedIdentity.identity_data.email}
                      </span>
                    )}
                  </div>
                  {isLinked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlink(linkedIdentity)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="w-3.5 h-3.5 mr-1.5" />
                          {t("settings.security.linked.unlink")}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLink(id)}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="w-3.5 h-3.5 mr-1.5" />
                          {t("settings.security.linked.link")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SecuritySettings;
