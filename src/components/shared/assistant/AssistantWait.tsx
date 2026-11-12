import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLongWait } from "@/hooks/useLongWait";

export default function AssistantWait({ pending, label }: { pending: boolean; label: string }) {
  const { t } = useTranslation();
  const long = useLongWait(pending);
  if (!pending) return null;
  return <p role="status" className="flex items-start gap-2 p-2 text-xs text-muted-foreground">
    <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
    <span>{long ? t("common.aiStillWorking") : label}</span>
  </p>;
}