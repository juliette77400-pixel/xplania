import { useTranslation } from "react-i18next";
import { Sparkles, Star, RotateCcw } from "lucide-react";

export type SortBy = "near" | "rating" | "score";

export interface DiscoverFilters {
  distanceKm: number; // max distance
  hiddenOnly: boolean;
  minRating: number; // 0 = off
  sortBy: SortBy;
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_FILTERS: DiscoverFilters = {
  distanceKm: 10,
  hiddenOnly: false,
  minRating: 0,
  sortBy: "near",
};

const DISTANCE_PRESETS = [0.5, 1, 3, 5, 10];
const RATING_PRESETS = [0, 3, 4, 4.5];

interface Props {
  value: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
  resultCount: number;
}

const DiscoverFiltersBar = ({ value, onChange, resultCount }: Props) => {
  const { t } = useTranslation();
  const set = (patch: Partial<DiscoverFilters>) => onChange({ ...value, ...patch });
  const isDefault =
    value.distanceKm === DEFAULT_FILTERS.distanceKm &&
    value.hiddenOnly === DEFAULT_FILTERS.hiddenOnly &&
    value.minRating === DEFAULT_FILTERS.minRating &&
    value.sortBy === DEFAULT_FILTERS.sortBy;

  return (
    <div className="sticky top-[60px] z-20 -mx-4 border-y border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur md:rounded-2xl md:mx-0 md:border md:top-auto md:relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {/* Distance chips */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-muted-foreground mr-1">{t("discoverFilters.distance")}</span>
          {DISTANCE_PRESETS.map((d) => {
            const active = value.distanceKm === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => set({ distanceKm: d })}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 text-foreground hover:bg-card"
                }`}
              >
                {d < 1 ? `${d * 1000}m` : `${d}km`}
              </button>
            );
          })}
        </div>

        <span className="h-5 w-px shrink-0 bg-border" />

        {/* Hidden gems */}
        <button
          type="button"
          onClick={() => set({ hiddenOnly: !value.hiddenOnly })}
          className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
            value.hiddenOnly
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-card/60 hover:bg-card"
          }`}
        >
          <Sparkles className="h-3 w-3" /> {t("discoverFilters.hiddenOnly")}
        </button>

        {/* Min rating */}
        <div className="flex shrink-0 items-center gap-1">
          <Star className="h-3 w-3 text-muted-foreground" />
          {RATING_PRESETS.map((r) => {
            const active = value.minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => set({ minRating: r })}
                className={`rounded-full border px-2 py-1 text-xs transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                {r === 0 ? t("discoverFilters.any") : `≥${r}`}
              </button>
            );
          })}
        </div>

        <span className="h-5 w-px shrink-0 bg-border" />

        {/* Sort */}
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[11px] text-muted-foreground mr-1">{t("discoverFilters.sort")}</span>
          {(["near", "rating", "score"] as SortBy[]).map((s) => {
            const active = value.sortBy === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => set({ sortBy: s })}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card/60 hover:bg-card"
                }`}
              >
                {t(`discoverFilters.sort_${s}`)}
              </button>
            );
          })}
        </div>

        {!isDefault && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-border bg-card/60 px-2.5 py-1 text-xs text-muted-foreground hover:bg-card"
          >
            <RotateCcw className="h-3 w-3" /> {t("discoverFilters.reset")}
          </button>
        )}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {t("discoverFilters.results", { count: resultCount })}
      </p>
    </div>
  );
};

export default DiscoverFiltersBar;
