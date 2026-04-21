import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

interface Props {
  variant?: "ghost" | "minimal";
}

const LanguageSwitcher = ({ variant = "ghost" }: Props) => {
  const { i18n, t } = useTranslation();
  const current = LANGS.find((l) => l.code === i18n.language.split("-")[0]) ?? LANGS[0];

  const change = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("lang.switch")}
        className={
          variant === "minimal"
            ? "flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
            : "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/30 text-foreground hover:bg-muted/60 hover:border-primary/40 text-sm font-medium transition-all"
        }
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase text-xs font-bold tracking-wide">{current.code}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => change(l.code)}
            className={i18n.language.startsWith(l.code) ? "bg-muted font-semibold" : ""}
          >
            <span className="mr-2">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
