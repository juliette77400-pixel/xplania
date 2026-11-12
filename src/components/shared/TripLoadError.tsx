import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TripLoadError({ retry, pending = false }: { retry: () => void; pending?: boolean }) {
  const { t } = useTranslation();
  return (
    <section role="alert" className="mx-auto max-w-xl space-y-4 px-4 py-12">
      <h1 className="text-xl font-bold">{t("common.tripLoadError")}</h1>
      <p className="text-sm text-muted-foreground">{t("common.tripLoadKept")}</p>
      <Button variant="outline" onClick={retry} disabled={pending}>
        <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} aria-hidden />
        {t("common.retry")}
      </Button>
    </section>
  );
}