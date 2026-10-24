// Notifications tab — per-user notification preferences.
// Stored in localStorage (no DB migration). Also lets the user enable browser push.
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellRing, Mail, Sparkles, AlertTriangle, Send, CalendarClock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  const { user } = useAuth();
  // Departure reminders (J-60, J-7) are sent by the server, so the choice lives in the account.
  const [reminders, setReminders] = useState(true);
  const [remindersSaving, setRemindersSaving] = useState(false);
  useEffect(() => { setReminders(user?.user_metadata?.departure_reminders !== false); }, [user]);
  const updateReminders = async (v: boolean) => {
    setReminders(v);
    setRemindersSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { departure_reminders: v } });
    setRemindersSaving(false);
    if (error) { setReminders(!v); toast.error(t("settings.notif.reminders.error")); return; }
    toast.success(t("settings.notif.saved"));
  };

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
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Switch checked={prefs[key]} onCheckedChange={(v) => update({ [key]: v } as any)} />
    </div>
  );

  return (
    <div className="space-y-5">
      {(FEATURE_FLAGS.ENABLE_GAMIFICATION || FEATURE_FLAGS.ENABLE_LIVE_TRACKING) && <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.notif.inApp.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.notif.inApp.hint")}</p>
        <div className="space-y-2">
          {FEATURE_FLAGS.ENABLE_GAMIFICATION && row(<Sparkles className="w-4 h-4" />, t("settings.notif.badgesValidated.title"), t("settings.notif.badgesValidated.hint"), "badgesValidated")}
          {FEATURE_FLAGS.ENABLE_GAMIFICATION && row(<AlertTriangle className="w-4 h-4" />, t("settings.notif.badgesRejected.title"), t("settings.notif.badgesRejected.hint"), "badgesRejected")}
          {FEATURE_FLAGS.ENABLE_LIVE_TRACKING && row(<BellRing className="w-4 h-4" />, t("settings.notif.tripAlerts.title"), t("settings.notif.tripAlerts.hint"), "tripAlerts")}
        </div>
      </Card>}

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("settings.notif.email.title")}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.notif.email.hint")}</p>
        <div className="space-y-2">
          {FEATURE_FLAGS.ENABLE_GAMIFICATION && row(<Send className="w-4 h-4" />, t("settings.notif.weeklyDigest.title"), t("settings.notif.weeklyDigest.hint"), "weeklyDigest")}
          {user && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3">
              <div className="flex gap-3">
                <div className="mt-0.5 text-primary"><CalendarClock className="w-4 h-4" /></div>
                <div>
                  <Label htmlFor="notif-reminders" className="text-sm font-medium">{t("settings.notif.reminders.title")}</Label>
                  <p className="text-xs text-muted-foreground">{t("settings.notif.reminders.hint")}</p>
                </div>
              </div>
              <Switch id="notif-reminders" checked={reminders} disabled={remindersSaving} onCheckedChange={(v) => void updateReminders(v)} />
            </div>
          )}
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
