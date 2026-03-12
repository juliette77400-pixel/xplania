import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet, FileText, Briefcase, ArrowLeft } from "lucide-react";

const modules = [
  { path: "/guide-budget", label: "Budget", icon: Wallet, emoji: "💰" },
  { path: "/guide-visa", label: "Visa & Préparatifs", icon: FileText, emoji: "📋" },
  { path: "/guide-valise", label: "Valise", icon: Briefcase, emoji: "🧳" },
];

const ModuleNavbar = () => {
  const { pathname } = useLocation();

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Back */}
          <Link
            to="/#create"
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>

          {/* Module tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {modules.map((m) => {
              const isActive = pathname === m.path;
              return (
                <Link key={m.path} to={m.path}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="module-tab"
                        className="absolute inset-0 rounded-xl gradient-button"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 hidden sm:inline">{m.emoji}</span>
                    <span className="relative z-10">{m.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Branding */}
          <div className="hidden sm:block text-xs text-muted-foreground">
            Propulsé par <span className="gradient-text font-bold">Xplania</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleNavbar;
