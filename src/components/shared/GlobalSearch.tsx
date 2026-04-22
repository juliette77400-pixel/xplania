// ============= NEW FILE — Global search palette (Cmd+K / Ctrl+K) =============
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Compass, Heart, Map, Activity, Briefcase, BookOpen, Wallet, FileText,
  LayoutDashboard, User as UserIcon, Award, Sparkles,
} from "lucide-react";

interface CmdEntry {
  to: string;
  labelKey: string;
  groupKey: string;
  icon: typeof Compass;
  keywords?: string;
}

// Routes searchable globally
const ENTRIES: CmdEntry[] = [
  { to: "/app", labelKey: "appNav.home", groupKey: "globalSearch.groupNav", icon: LayoutDashboard, keywords: "dashboard accueil home" },
  { to: "/discover", labelKey: "appNav.discover", groupKey: "globalSearch.groupExplore", icon: Compass, keywords: "places lieux découvrir" },
  { to: "/mood", labelKey: "appNav.mood", groupKey: "globalSearch.groupExplore", icon: Heart, keywords: "humeur mood emotion" },
  { to: "/explore", labelKey: "appNav.explore", groupKey: "globalSearch.groupExplore", icon: Map, keywords: "carte map travel" },
  { to: "/suivi", labelKey: "appNav.tracking", groupKey: "globalSearch.groupTrip", icon: Activity, keywords: "gps live tracking suivi" },
  { to: "/carnets", labelKey: "appNav.journal", groupKey: "globalSearch.groupTrip", icon: BookOpen, keywords: "journal carnet bord" },
  { to: "/guide-valise", labelKey: "appNav.suitcase", groupKey: "globalSearch.groupTools", icon: Briefcase, keywords: "valise bagage checklist" },
  { to: "/guide-budget", labelKey: "appNav.budget", groupKey: "globalSearch.groupTools", icon: Wallet, keywords: "argent budget dépenses" },
  { to: "/guide-visa", labelKey: "appNav.visa", groupKey: "globalSearch.groupTools", icon: FileText, keywords: "visa formalités passeport" },
  { to: "/gamification", labelKey: "appNav.badges", groupKey: "globalSearch.groupAccount", icon: Award, keywords: "badges progression xp" },
  { to: "/offres", labelKey: "appNav.premiumOffers", groupKey: "globalSearch.groupAccount", icon: Sparkles, keywords: "premium pricing offres" },
  { to: "/profil", labelKey: "appNav.profile", groupKey: "globalSearch.groupAccount", icon: UserIcon, keywords: "profil account compte" },
];

interface Props {
  variant?: "icon" | "bar";
}

const GlobalSearch = ({ variant = "icon" }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  // Group entries by group key
  const groups = ENTRIES.reduce<Record<string, CmdEntry[]>>((acc, e) => {
    (acc[e.groupKey] ||= []).push(e);
    return acc;
  }, {});

  return (
    <>
      {variant === "bar" ? (
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 transition-colors min-w-[200px]"
          aria-label={t("globalSearch.aria")}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">{t("globalSearch.placeholder")}</span>
          <kbd className="ml-auto rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border">⌘K</kbd>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("globalSearch.aria")}
          title={t("globalSearch.aria")}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("globalSearch.inputPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("globalSearch.empty")}</CommandEmpty>
          {Object.entries(groups).map(([groupKey, items], idx) => (
            <div key={groupKey}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={t(groupKey)}>
                {items.map((e) => {
                  const Icon = e.icon;
                  return (
                    <CommandItem
                      key={e.to}
                      value={`${t(e.labelKey)} ${e.keywords ?? ""}`}
                      onSelect={() => go(e.to)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{t(e.labelKey)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;
