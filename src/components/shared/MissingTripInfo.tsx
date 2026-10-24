// Tells the student when a guide lacks an answer from the questionnaire
// (budget, dates) and links back to the dashboard to complete the stay.
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { useTravelStore } from "@/stores/useTravelStore";

interface Props {
  needs: Array<"budget" | "dates">;
}

const MissingTripInfo = ({ needs }: Props) => {
  const { t } = useTranslation();
  const tripData = useTravelStore((s) => s.tripData);
  if (!tripData?.destination) return null;
  const missing: string[] = [];
  if (needs.includes("budget") && !(tripData.totalBudget > 0)) missing.push(t("prepDashboard.missing.budget"));
  if (needs.includes("dates") && !tripData.duration && !(tripData.departureDate && tripData.returnDate)) missing.push(t("prepDashboard.missing.dates"));
  if (missing.length === 0) return null;
  return (
    <div role="status" className="mx-auto mt-4 flex max-w-3xl flex-col gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-semibold">{t("prepDashboard.missing.title")}</p>
          {missing.map((m) => <p key={m} className="text-muted-foreground">{m}</p>)}
        </div>
      </div>
      <Link to="/app" className="shrink-0 font-semibold text-primary underline">{t("prepDashboard.missing.cta")}</Link>
    </div>
  );
};

export default MissingTripInfo;
