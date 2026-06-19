import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGamification, type BadgeWithClaim } from "@/hooks/useGamification";
import BadgeMedal from "./BadgeMedal";
import BadgeClaimDialog from "./BadgeClaimDialog";

const GamCatalog = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const { loading, badges, categories, prefs, points } = useGamification();
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithClaim | null>(null);

  const filtered = useMemo(() => {
    if (activeCat === "all") return badges;
    return badges.filter((b) => b.category_id === activeCat);
  }, [badges, activeCat]);

  const validatedCount = badges.filter((b) => b.status === "validated").length;
  const pendingCount = badges.filter((b) => b.status === "submitted").length;

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{t("gam.catalog.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("gam.catalog.subtitle")}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
            {t("gam.catalog.points", { n: points })}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold">
            {t("gam.catalog.validated", { n: validatedCount })}
          </span>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
              {t("gam.catalog.pending", { n: pendingCount })}
            </span>
          )}
        </div>
      </header>

      {prefs.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm flex items-start gap-3">
          <Filter className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{t("gam.catalog.noPrefsTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("gam.catalog.noPrefsDesc")}</p>
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCat("all")}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-colors font-medium",
            activeCat === "all"
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border bg-card/40 text-muted-foreground hover:border-border/80",
          )}
        >
          {t("gam.catalog.all")} · {badges.length}
        </button>
        {categories
          .filter((c) => prefs.length === 0 || prefs.includes(c.id))
          .map((c) => {
            const count = badges.filter((b) => b.category_id === c.id).length;
            if (count === 0) return null;
            const active = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 font-medium",
                  active
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:border-border/80",
                )}
                style={active ? { boxShadow: `0 0 0 1px ${c.gradient_from}` } : undefined}
              >
                <span>{c.icon}</span> {isFr ? c.name_fr : c.name_en} · {count}
              </button>
            );
          })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("gam.catalog.empty")}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
          {filtered.map((b, i) => (
            <motion.button
              key={b.id}
              type="button"
              onClick={() => setSelectedBadge(b)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              className="group flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-card/40 transition-colors text-center"
            >
              <BadgeMedal badge={b} size="md" />
              <span className="text-[11px] font-medium line-clamp-2 leading-tight mt-1">
                {isFr ? b.name_fr : b.name_en}
              </span>
              <span className="text-[10px] text-muted-foreground">{b.points} pts</span>
            </motion.button>
          ))}
        </div>
      )}

      <BadgeClaimDialog
        badge={selectedBadge}
        open={!!selectedBadge}
        onOpenChange={(o) => !o && setSelectedBadge(null)}
      />
    </section>
  );
};

export default GamCatalog;
