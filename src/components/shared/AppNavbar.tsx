import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plane, Home, Compass, Activity, BookOpen, Luggage,
  MoreHorizontal, Menu, X, LogOut, LogIn, Sparkles, User as UserIcon, LayoutDashboard, Zap, Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRemaining, isDevMode } from "@/lib/usage-quota";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationsBell from "@/components/shared/NotificationsBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import ThemeToggle from "@/components/shared/ThemeToggle";
// Added: global Cmd+K search & post-signup tour
import GlobalSearch from "@/components/shared/GlobalSearch";
import OnboardingTour from "@/components/shared/OnboardingTour";
// Added: global weekly missions banner
import MissionsBanner from "@/components/shared/MissionsBanner";

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof Home;
  premium?: boolean;
}

// The primary navigation follows the natural rhythm of a trip.
const PRIMARY: NavItem[] = [
  { to: "/app", labelKey: "appNav.home", icon: Home },
  { to: "/guide-budget", labelKey: "appNav.prepare", icon: Luggage },
  { to: "/discover", labelKey: "appNav.explorePhase", icon: Compass },
  { to: "/suivi", labelKey: "appNav.travelPhase", icon: Activity },
  { to: "/carnets", labelKey: "appNav.relive", icon: BookOpen },
];

const MORE = [
  { to: "/guide-budget", labelKey: "appNav.budget" },
  { to: "/guide-visa", labelKey: "appNav.visa" },
  { to: "/guide-valise", labelKey: "appNav.suitcase" },
  { to: "/mood", labelKey: "appNav.mood" },
  { to: "/discover", labelKey: "appNav.discover" },
  { to: "/explore", labelKey: "appNav.explore" },
  { to: "/suivi", labelKey: "appNav.tracking" },
  { to: "/carnets", labelKey: "appNav.journal" },
  { to: "/gamification", labelKey: "appNav.badges" },
  { to: "/offres", labelKey: "appNav.premiumOffers" },
  { to: "/about", labelKey: "appNav.about" },
];

import { useWeeklyMissionsRemaining } from "@/hooks/useWeeklyMissionsRemaining";

const AppNavbar = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { remaining: missionsRemaining } = useWeeklyMissionsRemaining();

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
            <DropdownMenuTrigger className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <MoreHorizontal className="w-3.5 h-3.5" /> {t("appNav.more")}
              {user && missionsRemaining > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                  {missionsRemaining}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {MORE.map((m) => (
                <DropdownMenuItem key={m.to} onClick={() => navigate(m.to)} className="cursor-pointer flex items-center justify-between gap-2">
                  <span>{t(m.labelKey)}</span>
                  {m.to === "/gamification" && user && missionsRemaining > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                      {missionsRemaining}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Added: global search bar (Cmd+K) — bar on desktop, icon on mobile */}
          <GlobalSearch variant="bar" />
          <div className="md:hidden">
            <GlobalSearch variant="icon" />
          </div>
          <LanguageSwitcher variant="minimal" />
          <ThemeToggle />
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
                <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer">
                  <SettingsIcon className="w-4 h-4 mr-2" /> {t("appNav.settings")}
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

          {(() => {
            const remVal = getRemaining("valise") + getRemaining("budget") + getRemaining("visa");
            const dev = isDevMode();
            const display = dev ? "∞" : remVal;
            return (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/offres"
                      className="hidden md:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 hover:bg-amber-500/15 transition-colors"
                      aria-label={t("appNav.quotaTooltip")}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{display}</span>
                      <span className="text-amber-600/70 font-normal">{t("appNav.creditsShort")}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                    <p className="font-semibold mb-1">{t("appNav.quotaTitle")}</p>
                    <p className="text-muted-foreground mb-2">{t("appNav.quotaTooltip")}</p>
                    {!dev && (
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between gap-3"><span>{t("appNav.suitcase")}</span><span className="font-mono">{getRemaining("valise")}</span></div>
                        <div className="flex justify-between gap-3"><span>{t("appNav.budget")}</span><span className="font-mono">{getRemaining("budget")}</span></div>
                        <div className="flex justify-between gap-3"><span>{t("appNav.visa")}</span><span className="font-mono">{getRemaining("visa")}</span></div>
                      </div>
                    )}
                    <p className="mt-2 text-primary font-medium">{t("appNav.viewPlans")} →</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })()}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger aria-label={t("appNav.openMenu")} className="lg:hidden p-2 rounded-lg hover:bg-muted">
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
      {/* Added: weekly missions awareness banner */}
      <MissionsBanner />
      {/* Added: post-signup guided tour (auto-opens once per user) */}
      <OnboardingTour />
    </nav>
  );
};

export default AppNavbar;
