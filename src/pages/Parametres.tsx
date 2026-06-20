// Settings / Account page. Hosts user configuration split into tabs:
// Account, Preferences, Notifications, Privacy, Security, Data.
// Lot 1 — moves config cards out of /profil into /parametres.
// Subsequent lots fill the placeholder tabs.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Settings as SettingsIcon, Bell, Shield, Lock, Database } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ProfilePreferences from "@/components/profil/ProfilePreferences";
import CategoryPickerCard from "@/components/gamification/CategoryPickerCard";
import VisibilitySettingCard from "@/components/gamification/VisibilitySettingCard";

const TABS = [
  { value: "compte", icon: User, key: "settings.tabs.account" },
  { value: "preferences", icon: SettingsIcon, key: "settings.tabs.preferences" },
  { value: "notifications", icon: Bell, key: "settings.tabs.notifications" },
  { value: "confidentialite", icon: Shield, key: "settings.tabs.privacy" },
  { value: "securite", icon: Lock, key: "settings.tabs.security" },
  { value: "donnees", icon: Database, key: "settings.tabs.data" },
] as const;

type TabValue = typeof TABS[number]["value"];

const Parametres = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const initial = (params.get("tab") as TabValue) || "compte";
  const [tab, setTab] = useState<TabValue>(initial);

  const onChange = (v: string) => {
    setTab(v as TabValue);
    setParams({ tab: v }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-6 sm:py-10 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <Tabs value={tab} onValueChange={onChange} className="space-y-5">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1 bg-muted/40">
            {TABS.map((tt) => {
              const Icon = tt.icon;
              return (
                <TabsTrigger
                  key={tt.value}
                  value={tt.value}
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 py-2 px-2 text-[11px] sm:text-xs data-[state=active]:bg-background"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{t(tt.key)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="compte" className="space-y-5 mt-0">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t("settings.accountSoon")}</p>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-5 mt-0">
            <ProfilePreferences />
            <CategoryPickerCard />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-5 mt-0">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t("settings.notificationsSoon")}</p>
            </Card>
          </TabsContent>

          <TabsContent value="confidentialite" className="space-y-5 mt-0">
            <VisibilitySettingCard />
          </TabsContent>

          <TabsContent value="securite" className="space-y-5 mt-0">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t("settings.securitySoon")}</p>
            </Card>
          </TabsContent>

          <TabsContent value="donnees" className="space-y-5 mt-0">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">{t("settings.dataSoon")}</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Parametres;
