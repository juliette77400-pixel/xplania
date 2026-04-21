import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setGoogleTranslateLang, getGoogleTranslateLang } from "@/lib/google-translate";

// Native i18n languages (full UI translation, no Google needed)
const NATIVE = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

// Google Translate fallback for everything else
const GOOGLE = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "id", label: "Bahasa", flag: "🇮🇩" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
];

interface Props {
  variant?: "ghost" | "minimal";
}

const LanguageSwitcher = ({ variant = "ghost" }: Props) => {
  const { i18n, t } = useTranslation();
  const native = NATIVE.find((l) => l.code === i18n.language.split("-")[0]);
  const googleActive = getGoogleTranslateLang();
  const activeGoogle = googleActive ? GOOGLE.find((l) => l.code === googleActive) : null;
  const current = activeGoogle ?? native ?? NATIVE[0];

  const changeNative = (code: string) => {
    setGoogleTranslateLang(null); // turn off Google
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
  };

  const changeGoogle = (code: string) => {
    // Use FR as the source for Google (more reliable detection)
    if (i18n.language !== "fr") i18n.changeLanguage("fr");
    setGoogleTranslateLang(code);
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
        <span className="uppercase text-xs font-bold tracking-wide">
          {current.code.split("-")[0]}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          ✨ Native
        </DropdownMenuLabel>
        {NATIVE.map((l) => {
          const isActive = !googleActive && i18n.language.startsWith(l.code);
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => changeNative(l.code)}
              className={isActive ? "bg-muted font-semibold" : ""}
            >
              <span className="mr-2">{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          🌍 Google Translate
        </DropdownMenuLabel>
        {GOOGLE.map((l) => {
          const isActive = googleActive === l.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => changeGoogle(l.code)}
              className={isActive ? "bg-muted font-semibold" : ""}
            >
              <span className="mr-2">{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
