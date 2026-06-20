import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Save, User as UserIcon, Mail, Loader2, Settings as SettingsIcon, BookOpen, CalendarDays, ArrowRight } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProfileStats from "@/components/profil/ProfileStats";
import BadgeShowcase from "@/components/profil/BadgeShowcase";

const Profil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadError(true);
        } else {
          setDisplayName(data?.display_name || "");
          setAvatarUrl(data?.avatar_url || "");
          setMemberSince(data?.created_at || user.created_at || null);
        }
        setLoading(false);
      });
  }, [user]);

  const formattedMemberSince = memberSince
    ? new Date(memberSince).toLocaleDateString(i18n.language?.startsWith("fr") ? "fr-FR" : "en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(t("profil.saveError"));
    else toast.success(t("profil.saveSuccess"));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (displayName || user?.email || "X").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("profil.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("profil.subtitle")}</p>
        </div>

        {loading ? (
          <Card className="p-6 space-y-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ) : (
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-xl gradient-button text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayName || t("profil.anonymousTraveler")}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 shrink-0" /> {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" /> {t("profil.displayName")}
              </Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t("profil.displayNamePlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">{t("profil.avatarUrl")}</Label>
              <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gradient-button">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {t("profil.save")}
            </Button>
          </Card>
        )}

        {!loading && <ProfileStats />}

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-primary" /> {t("profil.settingsCardTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("profil.settingsCardHint")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/parametres">
              <SettingsIcon className="w-4 h-4 mr-2" /> {t("profil.settingsCardCta")}
            </Link>
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-3">{t("profil.account")}</h2>
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="w-4 h-4 mr-2" /> {t("profil.logout")}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Profil;
