import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
}

const CATEGORIES = ["weather", "security", "events", "activities", "transport"] as const;

const Schema = z.object({
  email: z.string().trim().email({ message: "invalid_email" }).max(254).optional().or(z.literal("")),
  channels: z.array(z.string()).min(1),
  categories: z.array(z.string()).min(1),
  min_severity: z.enum(["info", "warning", "critical"]),
});

const AlertSubscriptionDialog = ({ open, onOpenChange, tripId }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [channels, setChannels] = useState<string[]>(["in_app"]);
  const [categories, setCategories] = useState<string[]>(["weather", "security", "events"]);
  const [minSeverity, setMinSeverity] = useState<"info" | "warning" | "critical">("warning");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setEmail(user.email || "");
    supabase
      .from("alert_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("trip_id", tripId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setChannels(data.channels || ["in_app"]);
          setCategories(data.categories || []);
          setMinSeverity((data.min_severity as any) || "warning");
          if (data.email) setEmail(data.email);
        }
      });
  }, [open, user, tripId]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  };

  const save = async () => {
    if (!user) return;
    const parsed = Schema.safeParse({ email, channels, categories, min_severity: minSeverity });
    if (!parsed.success) {
      toast.error(t("suiviAlerts.sub.invalidEmail"));
      return;
    }
    if (channels.includes("email") && !email) {
      toast.error(t("suiviAlerts.sub.emailRequired"));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("alert_subscriptions")
      .upsert(
        {
          user_id: user.id,
          trip_id: tripId,
          channels,
          categories,
          email: channels.includes("email") ? email : null,
          min_severity: minSeverity,
        },
        { onConflict: "user_id,trip_id" }
      );
    setSaving(false);
    if (error) {
      toast.error(t("suiviAlerts.sub.saveError"));
      return;
    }
    toast.success(t("suiviAlerts.sub.saved"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("suiviAlerts.sub.title")}</DialogTitle>
          <DialogDescription>{t("suiviAlerts.sub.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide">
              {t("suiviAlerts.sub.channels")}
            </Label>
            <div className="flex gap-4 mt-2">
              {["in_app", "email"].map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={channels.includes(c)}
                    onCheckedChange={() => toggle(channels, setChannels, c)}
                  />
                  {t(`suiviAlerts.sub.channel.${c}`)}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{t("suiviAlerts.sub.transactionalNote")}</p>
          </div>

          {channels.includes("email") && (
            <div>
              <Label htmlFor="alert-email" className="text-xs font-semibold uppercase tracking-wide">
                {t("suiviAlerts.sub.email")}
              </Label>
              <Input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide">
              {t("suiviAlerts.sub.categories")}
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={categories.includes(c)}
                    onCheckedChange={() => toggle(categories, setCategories, c)}
                  />
                  {t(`suiviAlerts.category.${c}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide">
              {t("suiviAlerts.sub.minSeverity")}
            </Label>
            <Select value={minSeverity} onValueChange={(v) => setMinSeverity(v as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">{t("suiviAlerts.severity.info")}</SelectItem>
                <SelectItem value="warning">{t("suiviAlerts.severity.warning")}</SelectItem>
                <SelectItem value="critical">{t("suiviAlerts.severity.critical")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertSubscriptionDialog;
