// Notifications tab — per-user notification preferences.
// Stored in localStorage (no DB migration). Also lets the user enable browser push.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellRing, Mail, Sparkles, AlertTriangle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "xplania.notif-prefs";

type Prefs = {
  badgesValidated: boolean;
  badgesRejected: boolean;
  tripAlerts: boolean;
  weeklyDigest: boolean;
  emailMarketing: boolean;
};

const DEFAULTS: Prefs = {
  badgesValidated: true,
  badgesRejected: true,
  tripAlerts: true,
  weeklyDigest: false,
  emailMarketing: false,
};

const load = (): Prefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
};

const NotificationsSettings = () => {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>("default");

  useEffect(() => {
    setPrefs(load());
    if (typeof Notification !== "undefined") {
      setPushStatus(Notification.permission);
    }
  }, []);

  const update = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    toast.success(t("settings.notif.saved"));
  };

  const requestPush = async () => {
    if (typeof Notification === "undefined") {
      toast.error(t("settings.notif.push.unsupported"));
      return;
    }
    const res = await Notification.requestPermission();
    setPushStatus(res);
    if (res === "granted") toast.success(t("settings.notif.push.granted"));
    else toast.error(t("settings.notif.push.denied"));
  };

  const row = (
    icon: React.ReactNode,
    title: string,
    hint: string,
    key: keyof Prefs
  ) => (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
      <div className="flex gap-3">
        <div className="mt-0.5 text-primary">{icon}</div>
        <div>
          <Label className="text-sm font-medium">{title}</Label>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Switch checked={prefs[key]} onCheckedChange={(v) => update({ [key]: v } as any)} />
    </div>
  );

  return (
    <div className="space-y-5">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.notif.inApp.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.notif.inApp.hint")}</p>
        <div className="space-y-2">
          {row(<Sparkles className="w-4 h-4" />, t("settings.notif.badgesValidated.title"), t("settings.notif.badgesValidated.hint"), "badgesValidated")}
          {row(<AlertTriangle className="w-4 h-4" />, t("settings.notif.badgesRejected.title"), t("settings.notif.badgesRejected.hint"), "badgesRejected")}
          {row(<BellRing className="w-4 h-4" />, t("settings.notif.tripAlerts.title"), t("settings.notif.tripAlerts.hint"), "tripAlerts")}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.notif.email.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.notif.email.hint")}</p>
        <div className="space-y-2">
          {row(<Send className="w-4 h-4" />, t("settings.notif.weeklyDigest.title"), t("settings.notif.weeklyDigest.hint"), "weeklyDigest")}
          {row(<Mail className="w-4 h-4" />, t("settings.notif.marketing.title"), t("settings.notif.marketing.hint"), "emailMarketing")}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.notif.push.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.notif.push.hint")}</p>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
          <span className="text-sm">
            {pushStatus === "granted"
              ? t("settings.notif.push.statusGranted")
              : pushStatus === "denied"
              ? t("settings.notif.push.statusDenied")
              : t("settings.notif.push.statusDefault")}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={requestPush}
            disabled={pushStatus === "granted" || pushStatus === "denied"}
          >
            {t("settings.notif.push.cta")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotificationsSettings;
