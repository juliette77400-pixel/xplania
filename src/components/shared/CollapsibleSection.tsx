import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Lightweight collapsible wrapper.
 *
 * - Default closed.
 * - Listens to a global `xpl:open-section` window event with detail `{ id }`
 *   so external scroll-to-section logic can force-open before scrolling.
 * - Pure presentation: no behavior change for the children inside.
 */
interface CollapsibleSectionProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  sectionId?: string;
  children: ReactNode;
}

const CollapsibleSection = ({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  sectionId,
  children,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!sectionId) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ id?: string }>).detail;
      if (detail?.id === sectionId) setOpen(true);
    };
    window.addEventListener("xpl:open-section", handler as EventListener);
    return () => window.removeEventListener("xpl:open-section", handler as EventListener);
  }, [sectionId]);

  return (
    <section className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="shrink-0 text-primary">{icon}</div>}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CollapsibleSection;
