import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Users } from "lucide-react";
import { toast } from "sonner";
import { useGamification, type GamVisibility } from "@/hooks/useGamification";

const VisibilitySettingCard = () => {
  const { t } = useTranslation();
  const { visibility, setVisibility } = useGamification();

  const handleChange = async (v: string) => {
    try {
      await setVisibility(v as GamVisibility);
      toast.success(t("gam.visibility.saved"));
    } catch {
      toast.error(t("gam.visibility.saveError"));
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        {t("gam.visibility.title")}
      </h2>
      <p className="text-xs text-muted-foreground">{t("gam.visibility.subtitle")}</p>

      <RadioGroup value={visibility} onValueChange={handleChange} className="space-y-2">
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors">
          <RadioGroupItem value="public" id="vis-public" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium"><Eye className="w-4 h-4" /> {t("gam.visibility.public")}</div>
            <p className="text-xs text-muted-foreground">{t("gam.visibility.publicDesc")}</p>
          </div>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors">
          <RadioGroupItem value="anonymized" id="vis-anon" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium"><Users className="w-4 h-4" /> {t("gam.visibility.anonymized")}</div>
            <p className="text-xs text-muted-foreground">{t("gam.visibility.anonymizedDesc")}</p>
          </div>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors">
          <RadioGroupItem value="private" id="vis-private" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm font-medium"><EyeOff className="w-4 h-4" /> {t("gam.visibility.private")}</div>
            <p className="text-xs text-muted-foreground">{t("gam.visibility.privateDesc")}</p>
          </div>
        </label>
      </RadioGroup>
    </Card>
  );
};

export default VisibilitySettingCard;
