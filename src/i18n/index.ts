import i18n from "i18next";
import { frArticle, frFor, frIn, frOf, frTo } from "@/lib/fr-place";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "xplania-lang",
      caches: ["localStorage"],
    },
  });

const syncHtmlLang = (lng?: string) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng?.startsWith("en") ? "en" : "fr";
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

// French place prepositions (« en Espagne », « au Japon », « pour l'Espagne »…); other languages keep the value.
const isFr = (lng: string | undefined) => !lng || lng.startsWith("fr");
const place = (fn: (v: string) => string) => (value: unknown, lng?: string) => (isFr(lng) ? fn(String(value ?? "")) : String(value ?? ""));
i18n.services.formatter?.add("pour", place(frFor));
i18n.services.formatter?.add("en", place(frIn));
i18n.services.formatter?.add("a", place(frTo));
i18n.services.formatter?.add("de", place(frOf));
i18n.services.formatter?.add("le", place(frArticle));

export default i18n;
