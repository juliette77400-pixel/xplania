import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, Filter, Trophy, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useGamification, type BadgeWithClaim } from "@/hooks/useGamification";
import BadgeMedal from "./BadgeMedal";
import BadgeClaimDialog from "./BadgeClaimDialog";

type Status = "unlocked" | "in_progress" | "all";

const PAGE_SIZE = 12;

const BadgeCard = ({
  b,
  onClick,
  dim,
  isFr,
}: {
  b: BadgeWithClaim;
  onClick: () => void;
  dim?: boolean;
  isFr: boolean;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      "group flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-card/40 transition-colors text-center min-w-0",
      dim && "opacity-60 hover:opacity-90",
    )}
  >
    <BadgeMedal badge={b} size="md" />
    <span className="text-[11px] font-medium line-clamp-2 leading-tight mt-1">
      {isFr ? b.name_fr : b.name_en}
    </span>
    <span className="text-[10px] text-muted-foreground">{b.points} pts</span>
  </motion.button>
);

const GamCatalog = () => {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language?.startsWith("fr");
  const { loading, badges, categories, prefs, points } = useGamification();
  const [tab, setTab] = useState<Status>("unlocked");
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithClaim | null>(null);
  // pagination per category id (only relevant inside accordions)
  const [pageByCat, setPageByCat] = useState<Record<string, number>>({});

  const validated = useMemo(() => badges.filter((b) => b.status === "validated"), [badges]);
  const inProgress = useMemo(
    () => badges.filter((b) => b.status === "submitted" || b.status === "in_progress"),
    [badges],
  );
  const locked = useMemo(
    () => badges.filter((b) => b.status === "locked" || b.status === "rejected"),
    [badges],
  );

  const totalUnlocked = validated.length;
  const totalAll = badges.length;
  const pct = totalAll ? Math.round((totalUnlocked / totalAll) * 100) : 0;

  // Group locked badges by category
  const lockedByCat = useMemo(() => {
    const map = new Map<string, BadgeWithClaim[]>();
    for (const b of locked) {
      const arr = map.get(b.category_id) || [];
      arr.push(b);
      map.set(b.category_id, arr);
    }
    return map;
  }, [locked]);

  const renderGrid = (list: BadgeWithClaim[], dim = false) => (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
      {list.map((b) => (
        <BadgeCard key={b.id} b={b} onClick={() => setSelectedBadge(b)} dim={dim} isFr={isFr} />
      ))}
    </div>
  );

  return (
    <section className="space-y-5">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">{t("gam.catalog.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t("gam.catalog.subtitle")}</p>

        {/* Global progress */}
        <div className="rounded-xl border border-border bg-card/40 p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {t("gam.catalog.progressLabel", {
                unlocked: totalUnlocked,
                total: totalAll,
              })}
            </span>
            <span className="text-muted-foreground text-xs">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">
              {t("gam.catalog.points", { n: points })}
            </span>
            {inProgress.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
                {t("gam.catalog.pending", { n: inProgress.length })}
              </span>
            )}
          </div>
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

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
          <TabsList className="grid grid-cols-3 w-full sm:w-auto sm:inline-grid">
            <TabsTrigger value="unlocked" className="text-xs sm:text-sm">
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              {t("gam.catalog.tabUnlocked")} ({validated.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
              <Hourglass className="w-3.5 h-3.5 mr-1.5" />
              {t("gam.catalog.tabInProgress")} ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              {t("gam.catalog.tabAll")} ({totalAll})
            </TabsTrigger>
          </TabsList>

          {/* UNLOCKED */}
          <TabsContent value="unlocked" className="mt-4">
            {validated.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("gam.catalog.emptyUnlocked")}
              </p>
            ) : (
              renderGrid(validated)
            )}
          </TabsContent>

          {/* IN PROGRESS */}
          <TabsContent value="in_progress" className="mt-4">
            {inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("gam.catalog.emptyInProgress")}
              </p>
            ) : (
              renderGrid(inProgress)
            )}
          </TabsContent>

          {/* ALL — unlocked at top, then locked grouped by category */}
          <TabsContent value="all" className="mt-4 space-y-6">
            {validated.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  {t("gam.catalog.sectionUnlocked")} · {validated.length}
                </h3>
                {renderGrid(validated)}
              </div>
            )}

            {inProgress.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Hourglass className="w-4 h-4 text-amber-500" />
                  {t("gam.catalog.sectionInProgress")} · {inProgress.length}
                </h3>
                {renderGrid(inProgress)}
              </div>
            )}

            {locked.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("gam.catalog.sectionLocked")} · {locked.length}
                </h3>
                <Accordion type="multiple" className="space-y-2">
                  {categories
                    .filter((c) => prefs.length === 0 || prefs.includes(c.id))
                    .map((c) => {
                      const catLocked = lockedByCat.get(c.id) || [];
                      if (catLocked.length === 0) return null;
                      const catTotal = badges.filter((b) => b.category_id === c.id).length;
                      const catUnlocked = validated.filter((b) => b.category_id === c.id).length;
                      const catPct = catTotal
                        ? Math.round((catUnlocked / catTotal) * 100)
                        : 0;
                      const page = pageByCat[c.id] || 1;
                      const visible = catLocked.slice(0, page * PAGE_SIZE);
                      const hasMore = visible.length < catLocked.length;
                      return (
                        <AccordionItem
                          key={c.id}
                          value={c.id}
                          className="border border-border rounded-xl bg-card/30 px-3 sm:px-4"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 w-full pr-2">
                              <span className="text-xl">{c.icon}</span>
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {isFr ? c.name_fr : c.name_en}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {t("gam.catalog.catProgress", {
                                    unlocked: catUnlocked,
                                    total: catTotal,
                                  })}
                                </p>
                              </div>
                              <div className="hidden sm:block w-24">
                                <Progress value={catPct} className="h-1.5" />
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="sm:hidden mb-3">
                              <Progress value={catPct} className="h-1.5" />
                            </div>
                            {renderGrid(visible, true)}
                            {hasMore && (
                              <div className="flex justify-center mt-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setPageByCat((p) => ({ ...p, [c.id]: page + 1 }))
                                  }
                                >
                                  {t("gam.catalog.showMore", {
                                    remaining: catLocked.length - visible.length,
                                  })}
                                </Button>
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                </Accordion>
              </div>
            )}

            {totalAll === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("gam.catalog.empty")}
              </p>
            )}
          </TabsContent>
        </Tabs>
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
