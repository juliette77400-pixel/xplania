import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";

const CategoryPickerCard = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const { categories, prefs, setPrefs, loading } = useGamification();
  const [draft, setDraft] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(prefs); }, [prefs]);

  const toggle = (id: string) => {
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  const dirty = JSON.stringify([...draft].sort()) !== JSON.stringify([...prefs].sort());

  const save = async () => {
    setSaving(true);
    try {
      await setPrefs(draft);
      toast.success(t("gam.prefs.saved"));
    } catch {
      toast.error(t("gam.prefs.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-sm font-bold flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary" />
        {t("gam.prefs.title")}
      </h2>
      <p className="text-xs text-muted-foreground">{t("gam.prefs.subtitle")}</p>

      {loading ? (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = draft.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  "text-sm px-3 py-2 rounded-full border-2 transition-all flex items-center gap-2 font-medium",
                  active
                    ? "border-transparent text-white shadow-md"
                    : "border-border bg-card/40 text-muted-foreground hover:border-primary/40",
                )}
                style={active ? { background: `linear-gradient(135deg, ${c.gradient_from}, ${c.gradient_to})` } : undefined}
              >
                <span>{c.icon}</span> {isFr ? c.name_fr : c.name_en}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">{t("gam.prefs.selected", { n: draft.length })}</p>
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {t("common.save")}
        </Button>
      </div>
    </Card>
  );
};

export default CategoryPickerCard;
