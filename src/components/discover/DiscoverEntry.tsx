import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, MessageCircle, Footprints, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type DiscoverEntrySlug =
  | "gastronomie"
  | "nature"
  | "culture"
  | "vie_nocturne"
  | "shopping"
  | "sport"
  | "bien_etre"
  | "pepites"
  | "tout";

export interface DiscoverSelection {
  /** Spec slugs picked by the user (1..n) */
  slugs: DiscoverEntrySlug[];
  /** Mode used to enter the results view */
  mode: "category_grid" | "chatbot" | "solo_shortcut";
}

interface Props {
  onSubmit: (selection: DiscoverSelection) => void;
  onOpenPip: () => void;
}

const CATEGORIES: { slug: DiscoverEntrySlug; emoji: string; tint: string }[] = [
  { slug: "gastronomie", emoji: "🍽️", tint: "hsl(20 90% 55%)" },
  { slug: "nature", emoji: "🌳", tint: "hsl(155 70% 45%)" },
  { slug: "culture", emoji: "🏛️", tint: "hsl(45 90% 55%)" },
  { slug: "vie_nocturne", emoji: "🌙", tint: "hsl(290 85% 60%)" },
  { slug: "shopping", emoji: "🛍️", tint: "hsl(330 80% 60%)" },
  { slug: "sport", emoji: "🏃", tint: "hsl(200 90% 55%)" },
  { slug: "bien_etre", emoji: "🧘", tint: "hsl(170 60% 50%)" },
  { slug: "pepites", emoji: "💎", tint: "hsl(265 85% 65%)" },
  { slug: "tout", emoji: "🔍", tint: "hsl(210 15% 55%)" },
];

const DiscoverEntry = ({ onSubmit, onOpenPip }: Props) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<DiscoverEntrySlug[]>([]);

  const toggle = (slug: DiscoverEntrySlug) => {
    setSelected((prev) => {
      // Tap simple sur "tout" → bypass multi-sélection
      if (slug === "tout") return prev.includes("tout") ? [] : ["tout"];
      const next = prev.filter((s) => s !== "tout");
      return next.includes(slug) ? next.filter((s) => s !== slug) : [...next, slug];
    });
  };

  const quickPick = (slug: DiscoverEntrySlug) => {
    onSubmit({ slugs: [slug], mode: "category_grid" });
  };

  const validate = () => {
    if (selected.length === 0) return;
    onSubmit({ slugs: selected, mode: "category_grid" });
  };

  return (
    <section className="space-y-8" aria-label={t("discoverEntry.title")}>
      <header className="space-y-2 text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("discoverEntry.kicker")}
        </p>
        <h1 className="font-display text-2xl md:text-3xl">{t("discoverEntry.title")}</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          {t("discoverEntry.subtitle")}
        </p>
      </header>

      {/* Option A — Category grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("discoverEntry.optionACategory")}
        </h2>
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={t("discoverEntry.optionACategory")}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {CATEGORIES.map((c) => {
            const isSelected = selected.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(c.slug)}
                onDoubleClick={() => quickPick(c.slug)}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border bg-card/60 p-4 text-center backdrop-blur transition hover:-translate-y-0.5 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary ${
                  isSelected ? "border-primary ring-1 ring-primary/40" : "border-border/60"
                }`}
                style={{ boxShadow: isSelected ? `0 0 0 1px ${c.tint}55` : undefined }}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                )}
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                  style={{ background: `${c.tint}22`, color: c.tint }}
                  aria-hidden
                >
                  {c.emoji}
                </span>
                <span className="text-sm font-medium leading-tight">
                  {t(`discoverEntry.cat.${c.slug}`)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selected.length > 0
              ? t("discoverEntry.selectedCount", { count: selected.length })
              : t("discoverEntry.tapHint")}
          </p>
          <Button
            onClick={validate}
            disabled={selected.length === 0}
            className="rounded-full"
          >
            {t("discoverEntry.seePlaces")}
          </Button>
        </div>
      </div>

      {/* Option B — Pip */}
      <div className="space-y-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("discoverEntry.optionBPip")}
        </h2>
        <p className="text-sm text-foreground/80">{t("discoverEntry.pipDescription")}</p>
        <Button onClick={onOpenPip} variant="secondary" className="gap-2 rounded-full">
          <MessageCircle className="h-4 w-4" />
          {t("discoverEntry.askPip")}
        </Button>
      </div>

      {/* Solo shortcut */}
      <button
        type="button"
        onClick={() => onSubmit({ slugs: ["pepites", "tout"], mode: "solo_shortcut" })}
        className="mx-auto flex items-center gap-2 rounded-full border border-border/60 bg-background/40 px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Footprints className="h-3.5 w-3.5" aria-hidden />
        {t("discoverEntry.soloShortcut")}
      </button>
    </section>
  );
};

export default DiscoverEntry;
