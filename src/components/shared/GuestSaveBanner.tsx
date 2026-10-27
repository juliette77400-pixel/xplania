import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, CloudOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { hasCompleteGuestDraft, PREP_RESUME_PATH } from "@/lib/prep-quiz";

/** Open tools, visitor with finished answers: remind that nothing is saved yet and offer the free account. */
const GuestSaveBanner = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  if (loading || user || !hasCompleteGuestDraft()) return null;
  return (
    <div role="note" className="mx-auto mt-4 flex max-w-5xl flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
      <CloudOff className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <p className="min-w-[12rem] flex-1 text-sm text-foreground">{t("guestSave.text")}</p>
      <Link
        to={`/auth?mode=signup&next=${encodeURIComponent(PREP_RESUME_PATH)}`}
        className="gradient-button inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        {t("guestSave.cta")}<ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
};

export default GuestSaveBanner;
