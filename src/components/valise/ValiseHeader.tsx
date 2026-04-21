import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ValiseHeaderProps {
  checkedItems: number;
  totalItems: number;
}

const ValiseHeader = ({ checkedItems, totalItems }: ValiseHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center gap-4">
        <Link to="/#create" className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{t("valise.headerTitle")}</h1>
          <p className="text-xs text-muted-foreground">{t("valise.headerSubtitle")}</p>
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
