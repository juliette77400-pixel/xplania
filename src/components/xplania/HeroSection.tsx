import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, CheckCircle2, Circle, Plane } from "lucide-react";
import { track } from "@/lib/analytics";
import heroStudent from "@/assets/landing/hero-student.jpg";

interface Props {
  onCreateTrip: () => void;
  /** Opens the questionnaire with this country (ISO code) already chosen. */
  onPickCountry: (code: string) => void;
}

// Popular student destinations offered as one-tap choices in the hero.
export const HERO_COUNTRIES = ["ES", "IT", "DE", "PT", "GB", "CA"] as const;

const flagOf = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

// Hero: make the student want to leave first, then start the questionnaire in one tap.
const HeroSection = ({ onCreateTrip, onPickCountry }: Props) => {
  const { t, i18n } = useTranslation();
  let names: Intl.DisplayNames | null = null;
  try { names = new Intl.DisplayNames([i18n.language.startsWith("en") ? "en" : "fr"], { type: "region" }); } catch { names = null; }

  const scrollToExample = () => {
    track("cta_click", { cta: "see_example", location: "hero" });
    document.getElementById("comment-ca-marche")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--secondary)/.14),transparent_35%),radial-gradient(circle_at_85%_30%,hsl(var(--primary)/.12),transparent_32%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-primary">
            <Plane className="h-3.5 w-3.5" aria-hidden /> {t("landing2.hero.badge")}
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-.03em] sm:text-5xl xl:text-[4rem]">
            {t("landing2.hero.titleStart")} <span className="gradient-text">{t("landing2.hero.titleAccent")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">{t("landing2.hero.subtitle")}</p>

          <div className="mt-8 max-w-xl rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm sm:p-5">
            <p className="text-sm font-bold text-foreground">{t("landing2.hero.where")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {HERO_COUNTRIES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onPickCountry(code)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3.5 py-2 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10"
                >
                  <span aria-hidden>{flagOf(code)}</span>{names?.of(code) ?? code}
                </button>
              ))}
              <button
                type="button"
                onClick={onCreateTrip}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3.5 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                {t("landing2.hero.other")}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={onCreateTrip} className="gradient-button group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-bold text-primary-foreground shadow-[0_16px_50px_hsl(var(--primary)/.18)] transition hover:-translate-y-0.5">
              {t("prepLanding.cta")}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
            <button onClick={scrollToExample} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 font-semibold text-foreground underline-offset-4 transition hover:text-primary hover:underline">
              {t("landing2.hero.secondary")}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Check className="h-4 w-4 text-primary" aria-hidden />{t("prepLanding.reassurance")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .97, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .7, delay: .1 }} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-secondary/25 to-primary/25 blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-border/60 shadow-2xl">
            <img
              src={heroStudent}
              alt={t("landing2.hero.photoAlt")}
              width={1200}
              height={1440}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover lg:aspect-[5/6]"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .6 }}
            className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-[-1rem] sm:w-72 lg:-left-10 lg:right-auto"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">{t("landing2.hero.cardTitle")}</p>
              <span className="rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{t("landing2.hero.cardLabel")}</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />{t("landing2.hero.card1")}</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />{t("landing2.hero.card2")}</li>
              <li className="flex items-center gap-2 text-muted-foreground"><Circle className="h-4 w-4 shrink-0" aria-hidden />{t("landing2.hero.card3")}</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
