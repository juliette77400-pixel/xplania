import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepInspirations = ({ data, update }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Label className="text-foreground font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> {t("travelForm.fields.inspirationsLabel")}
      </Label>
      <Textarea
        placeholder={t("travelForm.fields.inspirationsPh")}
        value={data.inspirations ?? ""}
        onChange={(e) => update({ inspirations: e.target.value })}
        className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-[120px]"
      />
      <p className="text-xs text-muted-foreground">{t("travelForm.fields.inspirationsHint")}</p>
    </div>
  );
};

export default StepInspirations;
