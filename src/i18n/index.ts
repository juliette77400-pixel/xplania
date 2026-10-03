import i18n from "i18next";
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

// « pour le Japon », « pour la France », « pour l'Espagne », « pour les États-Unis » ; villes inchangées.
const MASC = ["Japon","Brésil","Mexique","Canada","Portugal","Maroc","Pérou","Chili","Vietnam","Cambodge","Danemark","Royaume-Uni","Luxembourg","Sénégal","Liban","Kenya","Népal","Laos","Pakistan","Qatar","Costa Rica","Cameroun","Gabon","Togo","Bénin","Mali","Niger","Tchad","Congo"];
const PLUR = ["États-Unis","Pays-Bas","Philippines","Émirats arabes unis","Maldives","Seychelles"];
const FEM = ["France","Suisse","Pologne","Allemagne","Belgique","Italie","Grèce","Chine","Corée du Sud","Thaïlande","Australie","Argentine","Colombie","Tunisie","Algérie","Turquie","Russie","Norvège","Suède","Finlande","Croatie","Hongrie","Roumanie","Bulgarie","Indonésie","Malaisie","Nouvelle-Zélande","Jordanie","Égypte","Tanzanie","Afrique du Sud","Islande","Irlande","Écosse","Inde"];
const withArticle = (v: string) => {
  const n = (v || "").trim();
  if (PLUR.includes(n)) return `les ${n}`;
  if (/^[AEIOUYÉÈÊÎ]/i.test(n) && (FEM.includes(n) || MASC.includes(n))) return `l'${n}`;
  if (FEM.includes(n)) return `la ${n}`;
  if (MASC.includes(n)) return `le ${n}`;
  return n;
};
i18n.services.formatter?.add("pour", (value: string) => {
  const a = withArticle(value);
  return a.startsWith("le ") ? `pour ${a}` : a.startsWith("les ") ? `pour ${a}` : `pour ${a}`;
});

export default i18n;
