import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plane, Home, Compass, Heart, Map, Activity, Briefcase, BookOpen,
  MoreHorizontal, Menu, X, LogOut, LogIn, Sparkles, User as UserIcon, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRemaining } from "@/lib/usage-quota";
import NotificationsBell from "@/components/shared/NotificationsBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof Home;
  premium?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: "/app", labelKey: "appNav.home", icon: Home },
  { to: "/discover", labelKey: "appNav.discover", icon: Compass },
  { to: "/mood", labelKey: "appNav.mood", icon: Heart, premium: true },
  { to: "/explore", labelKey: "appNav.explore", icon: Map, premium: true },
  { to: "/suivi", labelKey: "appNav.tracking", icon: Activity, premium: true },
  { to: "/guide-valise", labelKey: "appNav.suitcase", icon: Briefcase },
  { to: "/carnets", labelKey: "appNav.journal", icon: BookOpen, premium: true },
];

const MORE = [
  { to: "/guide-budget", labelKey: "appNav.budget" },
  { to: "/guide-visa", labelKey: "appNav.visa" },
  { to: "/gamification", labelKey: "appNav.badges" },
  { to: "/offres", labelKey: "appNav.premiumOffers" },
];

const AppNavbar = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
                <span>{t(it.labelKey)}</span>
                {it.premium && (
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                )}
              </Link>
            );
          })}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <MoreHorizontal className="w-3.5 h-3.5" /> {t("appNav.more")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {MORE.map((m) => (
                <DropdownMenuItem key={m.to} onClick={() => navigate(m.to)} className="cursor-pointer">
                  {t(m.labelKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSwitcher variant="minimal" />
          {user && <NotificationsBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center rounded-full hover:ring-2 hover:ring-primary/40 transition-all">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={(user.user_metadata as any)?.avatar_url} />
                  <AvatarFallback className="text-xs gradient-button text-primary-foreground">
                    {(user.email || "X").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app")} className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> {t("appNav.myAccount")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profil")} className="cursor-pointer">
                  <UserIcon className="w-4 h-4 mr-2" /> {t("appNav.profile")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> {t("appNav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogIn className="w-3.5 h-3.5" /> {t("appNav.login")}
            </Link>
          )}

          <Link
            to="/offres"
            className="hidden md:flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600"
            title={t("appNav.quotaTooltip")}
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
                      <span>{t(it.labelKey)}</span>
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
                      <LogOut className="w-4 h-4" /> {t("appNav.logout")}
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                    >
                      <LogIn className="w-4 h-4" /> {t("appNav.login")}
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

