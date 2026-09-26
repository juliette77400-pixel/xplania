import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsAdmin, useAdminFlag } from "@/hooks/useIsAdmin";

/**
 * Mounts inside the auth provider, fetches the current user's admin
 * status once, and renders a small floating badge when admin mode is on.
 *
 * The visual badge is purely informational — the actual bypass is
 * driven by `hasUnlimitedAccess()` and by the RLS-verified role.
 */
const AdminGate = () => {
  const { t } = useTranslation();
  useIsAdmin();
  const isAdmin = useAdminFlag();
  if (!isAdmin) return null;
  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] pointer-events-none select-none rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-lg backdrop-blur-md flex items-center gap-1.5"
      aria-label={t("ui2.AdminGate.ariaLabel")}
      title={t("ui2.AdminGate.title")}
    >
      <ShieldCheck className="h-3 w-3" />
      {t("ui2.AdminGate.badge")}
    </div>
  );
};

export default AdminGate;
