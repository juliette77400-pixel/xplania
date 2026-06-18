import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ValiseHeaderProps {
  checkedItems: number;
  totalItems: number;
  userName?: string;
}

function getProgressKey(pct: number): string {
  if (pct === 0) return "valise.progress.empty";
  if (pct < 31) return "valise.progress.early";
  if (pct < 61) return "valise.progress.mid";
  if (pct < 90) return "valise.progress.late";
  if (pct < 100) return "valise.progress.almost";
  return "valise.progress.done";
}

const ValiseHeader = ({ checkedItems, totalItems, userName }: ValiseHeaderProps) => {
  const { t } = useTranslation();
  const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const remaining = Math.max(totalItems - checkedItems, 0);
  const message = t(getProgressKey(pct), {
    checked: checkedItems,
    total: totalItems,
    remaining,
    name: userName || "",
  });

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center gap-4">
        <Link to="/#create" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground">{t("valise.headerTitle")}</h1>
          <p className="text-xs text-muted-foreground truncate" aria-live="polite">{message}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{checkedItems}/{totalItems}</p>
          <p className="text-[10px] text-muted-foreground">{t("valise.headerSelected")}</p>
        </div>
      </div>
    </div>
  );
};

export default ValiseHeader;
