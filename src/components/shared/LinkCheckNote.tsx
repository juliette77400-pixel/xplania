// "Links tested automatically on …" + "content re-read by hand on …", kept apart on purpose:
// a link that opens does not prove the rules on the page are still the same.
import { useTranslation } from "react-i18next";
import { AlertTriangle, BadgeCheck, Link2 } from "lucide-react";
import { formatDay, formatDayTime } from "@/lib/format-date";
import { linkState, summarizeLinks, useLinkChecks } from "@/lib/link-checks";
import { cn } from "@/lib/utils";

/** Summary for a group of links shown on one page. */
export function LinkCheckNote({ urls, contentCheckedOn, className }: { urls: string[]; contentCheckedOn?: string; className?: string }) {
  const { t, i18n } = useTranslation();
  const { data } = useLinkChecks();
  const s = summarizeLinks(urls, data);
  return (
    <div className={cn("space-y-1 text-xs text-muted-foreground", className)}>
      {s.allOkSince && (
        <p className="flex items-start gap-1.5"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />{t("linkCheck.allOk", { date: formatDayTime(s.allOkSince, i18n.language) })}</p>
      )}
      {s.recheck.length > 0 && (
        <p className="flex items-start gap-1.5 text-warning"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{t("linkCheck.someRecheck", { count: s.recheck.length })}</p>
      )}
      {s.manual.length > 0 && (
        <p className="flex items-start gap-1.5"><Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{t("linkCheck.someManual", { count: s.manual.length })}</p>
      )}
      {contentCheckedOn && (
        <p className="flex items-start gap-1.5"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />{t("linkCheck.content", { date: formatDay(contentCheckedOn, i18n.language) })}</p>
      )}
      <p>{t("linkCheck.caveat")}</p>
    </div>
  );
}

/** Small label for one link card. */
export function LinkCheckBadge({ url }: { url: string }) {
  const { t, i18n } = useTranslation();
  const { data } = useLinkChecks();
  const s = linkState(data?.[url]);
  if (s.state === "unknown") return null;
  if (s.state === "ok") {
    return <span className="text-[11px] text-muted-foreground">{t("linkCheck.oneOk", { date: formatDay(s.checkedAt, i18n.language) })}</span>;
  }
  if (s.state === "manual") {
    return <span className="text-[11px] text-muted-foreground">{t("linkCheck.oneManual")}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning" title={s.lastSuccessAt ? t("linkCheck.lastOk", { date: formatDay(s.lastSuccessAt, i18n.language) }) : undefined}>
      <AlertTriangle className="h-3 w-3" aria-hidden />{t("linkCheck.oneRecheck")}
      {s.lastSuccessAt && <span className="font-normal text-muted-foreground">· {t("linkCheck.lastOk", { date: formatDay(s.lastSuccessAt, i18n.language) })}</span>}
    </span>
  );
}
