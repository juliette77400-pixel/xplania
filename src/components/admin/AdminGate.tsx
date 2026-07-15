import { ShieldCheck } from "lucide-react";
import { useIsAdmin, useAdminFlag } from "@/hooks/useIsAdmin";

/**
 * Mounts inside the auth provider, fetches the current user's admin
 * status once, and renders a small floating badge when admin mode is on.
 *
 * The visual badge is purely informational — the actual bypass is
 * driven by `hasUnlimitedAccess()` and by the RLS-verified role.
 */
const AdminGate = () => {
  useIsAdmin();
  const isAdmin = useAdminFlag();
  if (!isAdmin) return null;
  return (
    <div
      className="fixed bottom-3 left-3 z-[9999] pointer-events-none select-none rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow-lg backdrop-blur-md flex items-center gap-1.5"
      aria-label="Mode Admin"
      title="Accès illimité — restrictions freemium désactivées"
    >
      <ShieldCheck className="h-3 w-3" />
      Mode Admin
    </div>
  );
};

export default AdminGate;
