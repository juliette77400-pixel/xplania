import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Mail, Settings as SettingsIcon, BookOpen, CalendarDays, ArrowRight } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ProfileStats from "@/components/profil/ProfileStats";
import BadgeShowcase from "@/components/profil/BadgeShowcase";
import ProfilePersonalization from "@/components/profil/ProfilePersonalization";
import AvatarEditor from "@/components/profil/AvatarEditor";
import DisplayNameEditor from "@/components/profil/DisplayNameEditor";
import { useDisplayName } from "@/lib/data/profiles";
import { FEATURE_FLAGS } from "@/config/featureFlags";

const Profil = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  // Shared with the dashboard, the menu and the assistants: a saved change shows up everywhere.
  const displayName = useDisplayName(user?.id) ?? "";
  const [avatarUrl, setAvatarUrl] = useState("");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url, created_at").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadError(true);
        } else {
          setAvatarUrl(data?.avatar_url || "");
          setMemberSince(data?.created_at || user.created_at || null);
        }
        setLoading(false);
      });
  }, [user]);

  const formattedMemberSince = memberSince
    ? new Date(memberSince).toLocaleDateString(i18n.language?.startsWith("fr") ? "fr-FR" : "en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/home");
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
              {user && (
                <AvatarEditor userId={user.id} avatarUrl={avatarUrl} initials={initials} alt={displayName} onChange={setAvatarUrl} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayName || t("profil.anonymousTraveler")}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 shrink-0" /> {user?.email}
                </p>
                {formattedMemberSince && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CalendarDays className="w-3 h-3 shrink-0" /> {t("profil.memberSince", { date: formattedMemberSince })}
                  </p>
                )}
              </div>
            </div>

            {loadError && (
              <p className="text-xs text-destructive">{t("profil.loadError")}</p>
            )}

            <DisplayNameEditor />
          </Card>
        )}

        {!loading && <ProfilePersonalization />}
        {!loading && FEATURE_FLAGS.ENABLE_GAMIFICATION && <ProfileStats />}
        {!loading && FEATURE_FLAGS.ENABLE_GAMIFICATION && <BadgeShowcase />}

        {FEATURE_FLAGS.ENABLE_TRAVEL_JOURNAL && <Card className="p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" /> {t("profil.publicCard.title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("profil.publicCard.hint")}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/carnets">
              <BookOpen className="w-4 h-4 mr-2" /> {t("profil.publicCard.cta")} <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </Card>}

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
