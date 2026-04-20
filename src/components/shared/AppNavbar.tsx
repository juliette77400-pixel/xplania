import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plane, Home, Compass, Heart, Map, Activity, Briefcase, BookOpen,
  MoreHorizontal, Menu, X, LogOut, LogIn, Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getRemaining } from "@/lib/usage-quota";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  premium?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/mood", label: "Mood", icon: Heart },
  { to: "/explore", label: "Travel Map", icon: Map, premium: true },
  { to: "/suivi", label: "Suivi de voyage", icon: Activity, premium: true },
  { to: "/guide-valise", label: "Valise", icon: Briefcase },
  { to: "/carnets", label: "Carnet", icon: BookOpen, premium: true },
];

const MORE: NavItem[] = [
  { to: "/guide-budget", label: "Budget" },
  { to: "/guide-visa", label: "Visa & Préparatifs" },
  { to: "/gamification", label: "Badges & Progression" },
  { to: "/offres", label: "Offres Premium" },
] as any;

const AppNavbar = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-3 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold gradient-text hidden sm:inline">Xplania</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center max-w-3xl">
          {PRIMARY.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{it.label}</span>
                {it.premium && (
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                )}
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <MoreHorizontal className="w-3.5 h-3.5" /> More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {MORE.map((m) => (
                <DropdownMenuItem key={m.to} onClick={() => navigate(m.to)} className="cursor-pointer">
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user ? (
            <button
              onClick={signOut}
              className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-3.5 h-3.5" /> Connexion
            </Link>
          )}

          <Link
            to="/offres"
            className="hidden md:flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600"
            title="Quotas gratuits restants — Valise/Budget/Visa: 3 chacun"
          >
            <Sparkles className="w-3 h-3" />
            V{getRemaining("valise")}·B{getRemaining("budget")}·Vi{getRemaining("visa")}
          </Link>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden p-2 rounded-lg hover:bg-muted">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="flex items-center justify-between border-b border-border p-4">
                <span className="font-bold gradient-text">Xplania</span>
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                {[...PRIMARY, ...MORE].map((it: any) => {
                  const Icon = it.icon || Compass;
                  const active = isActive(it.to);
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        active ? "bg-primary/15 text-primary font-semibold" : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{it.label}</span>
                      {it.premium && <Sparkles className="ml-auto w-3 h-3 text-amber-500" />}
                    </Link>
                  );
                })}
                <div className="mt-3 border-t border-border pt-3">
                  {user ? (
                    <button
                      onClick={() => { signOut(); setOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                      <LogOut className="w-4 h-4" /> Se déconnecter
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <LogIn className="w-4 h-4" /> Connexion
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
