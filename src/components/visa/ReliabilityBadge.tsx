// Small label telling how reliable an answer is.
import { useTranslation } from "react-i18next";
import { BadgeCheck, Info, AlertTriangle, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type Reliability = "verified" | "indicative" | "to_verify" | "unavailable";

const STYLE: Record<Reliability, { cls: string; Icon: typeof Info }> = {
  verified: { cls: "border-success/30 bg-success/10 text-success", Icon: BadgeCheck },
  indicative: { cls: "border-primary/30 bg-primary/10 text-primary", Icon: Info },
  to_verify: { cls: "border-warning/30 bg-warning/10 text-warning", Icon: AlertTriangle },
  unavailable: { cls: "border-border bg-muted/40 text-muted-foreground", Icon: CloudOff },
};

const ReliabilityBadge = ({ level, className }: { level: Reliability; className?: string }) => {
  const { t } = useTranslation();
  const { cls, Icon } = STYLE[level];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", cls, className)}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(`visa2.reliability.${level}`)}
    </span>
  );
};

export default ReliabilityBadge;
