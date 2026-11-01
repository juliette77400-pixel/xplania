// Shown above AI results saved with the trip when the trip or the language
// changed since they were made. Nothing is regenerated on its own: the
// student decides, and the button says it uses one try.
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onUpdate: () => void;
  busy?: boolean;
  className?: string;
}

const AiOutdatedNote = ({ onUpdate, busy, className }: Props) => {
  const { t } = useTranslation();
  return (
    <div role="status" className={cn("flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between", className)}>
      <p>{t("aiSaved.outdated")}</p>
      <button
        type="button"
        onClick={onUpdate}
        disabled={busy}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 sm:self-auto"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} aria-hidden />
        {t("aiSaved.update")}
      </button>
    </div>
  );
};

export default AiOutdatedNote;
