// Local + browser preferences panel for the Profile page.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Bell, Globe, Coins, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { loadPrefs, savePrefs, type UserPrefs } from "@/lib/user-prefs";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";
import i18n from "@/i18n";

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "BRL", "MAD", "TND", "XOF"];

const ProfilePreferences = () => {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<UserPrefs>(loadPrefs());
  const [lang, setLang] = useState(i18n.language?.startsWith("en") ? "en" : "fr");
  const { permission, request } = useNotifications();

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const update = <K extends keyof UserPrefs>(key: K, value: UserPrefs[K]) => {
    const next = savePrefs({ [key]: value } as Partial<UserPrefs>);
    setPrefs(next);
  };

  const changeLang = (v: string) => {
    setLang(v);
    i18n.changeLanguage(v);
    try { localStorage.setItem("xplania-lang", v); } catch {}
    toast.success(t("profil.prefs.langChanged"));
  };

  const enableBrowserNotifs = async () => {
    const p = await request();
    if (p === "granted") {
      update("notifyBrowser", true);
      toast.success(t("profil.prefs.notifyEnabled"));
    } else {
      toast.error(t("profil.prefs.notifyDenied"));
    }
  };

  return (
    <Card className="p-6 space-y-5">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" /> {t("profil.prefs.title")}
      </h2>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> {t("profil.prefs.travelerType")}</Label>
        <Input
          value={prefs.travelerType}
          onChange={(e) => update("travelerType", e.target.value)}
          placeholder={t("profil.prefs.travelerTypePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("profil.prefs.bio")}</Label>
        <Input
          value={prefs.bio}
          onChange={(e) => update("bio", e.target.value)}
          placeholder={t("profil.prefs.bioPlaceholder")}
          maxLength={160}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {t("profil.prefs.language")}</Label>
          <Select value={lang} onValueChange={changeLang}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> {t("profil.prefs.currency")}</Label>
          <Select value={prefs.preferredCurrency} onValueChange={(v) => update("preferredCurrency", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground"><Bell className="w-3.5 h-3.5" /> {t("profil.prefs.notifications")}</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{t("profil.prefs.notifyInApp")}</p>
            <p className="text-[11px] text-muted-foreground">{t("profil.prefs.notifyInAppHint")}</p>
          </div>
          <Switch checked={prefs.notifyInApp} onCheckedChange={(v) => update("notifyInApp", v)} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm">{t("profil.prefs.notifyBrowser")}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {permission === "granted" ? t("profil.prefs.notifyAllowed") : permission === "denied" ? t("profil.prefs.notifyBlocked") : t("profil.prefs.notifyAsk")}
            </p>
          </div>
          {permission === "granted" ? (
            <Switch checked={prefs.notifyBrowser} onCheckedChange={(v) => update("notifyBrowser", v)} />
          ) : (
            <Button size="sm" variant="outline" onClick={enableBrowserNotifs} disabled={permission === "denied"}>
              {t("profil.prefs.notifyEnable")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProfilePreferences;
