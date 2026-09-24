import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, SearchCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Missing { item: string; reason: string }

interface Props {
  destination: string;
  days: number;
  tripTypes?: string[];
  activities?: string[];
  luggage: string;
  transport: string;
  departureDate?: string;
  currentItems: string[];
  onAdd: (item: string) => void;
}

const MissingItemsCheck = ({ destination, days, tripTypes, activities, luggage, transport, departureDate, currentItems, onAdd }: Props) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ essential: Missing[]; secondary: Missing[] } | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("valise-missing", {
        body: {
          destination, days, tripTypes: tripTypes || [], activities: activities || [], luggage, transport, departureDate,
          items: currentItems, locale: i18n.language.startsWith("en") ? "en" : "fr",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ essential: data?.essential || [], secondary: data?.secondary || [] });
      setAdded(new Set());
    } catch (e) {
      console.error("valise-missing failed", e);
      toast.error(t("valise.missing.error"));
    } finally {
      setLoading(false);
    }
  };

  const add = (name: string) => {
    onAdd(name);
    setAdded((p) => new Set(p).add(name));
  };

  const renderGroup = (title: string, list: Missing[]) =>
    list.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h4>
        {list.map((m) => {
          const done = added.has(m.item);
          return (
            <div key={m.item} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-semibold text-foreground">{m.item}</p>
                <p className="text-xs text-muted-foreground">{m.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => add(m.item)}
                disabled={done}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 disabled:opacity-60"
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {done ? t("valise.missing.added") : t("valise.missing.add")}
              </button>
            </div>
          );
        })}
      </div>
    );

  return (
    <section className="glass-card rounded-2xl p-6 space-y-4" aria-labelledby="missing-title">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 id="missing-title" className="text-base font-bold text-foreground flex items-center gap-2">
            <SearchCheck className="w-5 h-5 text-primary" />
            {t("valise.missing.title")}
          </h3>
          <p className="text-xs text-muted-foreground">{t("valise.missing.subtitle", { destination })}</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="gradient-button inline-flex items-center gap-2 px-4 py-2 rounded-xl text-primary-foreground text-sm font-semibold disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {result ? t("valise.missing.recheck") : t("valise.missing.check")}
        </button>
      </div>
      {result && result.essential.length === 0 && result.secondary.length === 0 && (
        <p className="text-sm text-foreground">{t("valise.missing.nothing")}</p>
      )}
      {result && renderGroup(t("valise.missing.essential"), result.essential)}
      {result && renderGroup(t("valise.missing.secondary"), result.secondary)}
    </section>
  );
};

export default MissingItemsCheck;
