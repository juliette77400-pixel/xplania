import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, MapPin, Sparkles, WandSparkles } from "lucide-react";
import pip from "@/assets/pip-mascot.png.asset.json";

interface Props {
  onCreateTrip: () => void;
}

const copy = {
  fr: {
    eyebrow: "Erasmus, stage, échange : ton copilote de mobilité",
    title: "Pars serein·e.",
    accent: "Reviens transformé·e.",
    subtitle: "Visa, budget serré, logement, arrivée seul·e… Xplania t'accompagne avant, pendant et après ta mobilité. Moins gérer. Plus explorer.",
    primary: "Préparer ma mobilité",
    proof: ["Pensé pour les étudiant·es", "10 essais gratuits / mois", "FR · EN"],
    pains: ["Convention de stage", "Visa & formalités", "Budget étudiant", "Vie sur place", "Badges & défis"],
    ping: "Moi c'est Ping ! Plus tu voyages, plus je te connais.",
    cardLabel: "Ping prépare ton semestre",
    destination: "Erasmus à Lisbonne · 5 mois",
    insight: "Un plan d'arrivée adapté à ton budget étudiant et à ton profil ADN Voyageur.",
    ready: "Ta mobilité est prête",
    items: ["Budget mensuel ajusté", "Formalités vérifiées", "Valise adaptée au climat"],
  },
  en: {
    eyebrow: "Erasmus, internship, exchange: your mobility copilot",
    title: "Leave with confidence.",
    accent: "Come back transformed.",
    subtitle: "Visa, tight budget, housing, arriving alone… Xplania stays with you before, during and after your time abroad. Less managing. More exploring.",
    primary: "Prepare my mobility",
    proof: ["Built for students", "10 free tries / month", "FR · EN"],
    pains: ["Internship agreement", "Visa & paperwork", "Student budget", "Life abroad", "Badges & challenges"],
    ping: "I'm Ping! The more you travel, the better I know you.",
    cardLabel: "Ping is preparing your semester",
    destination: "Erasmus in Lisbon · 5 months",
    insight: "An arrival plan tailored to your student budget and your Traveler DNA profile.",
    ready: "Your mobility is ready",
    items: ["Monthly budget optimized", "Paperwork checked", "Climate-ready packing list"],
  },
};

const HeroSection = ({ onCreateTrip }: Props) => {
  const { t, i18n } = useTranslation();
  const c = i18n.language.startsWith("fr") ? copy.fr : copy.en;

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:pt-28 lg:pb-32 lg:pt-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,hsl(var(--secondary)/.16),transparent_32%),radial-gradient(circle_at_80%_35%,hsl(var(--primary)/.14),transparent_30%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> {c.eyebrow}
          </div>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-.04em] sm:text-6xl lg:text-7xl">
            {c.title}<br /><span className="gradient-text">{c.accent}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{c.subtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={onCreateTrip} className="gradient-button group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 font-bold text-primary-foreground shadow-[0_16px_50px_hsl(var(--primary)/.16)] transition hover:-translate-y-0.5">
              {c.primary}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            {c.proof.map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>)}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {c.pains.map((p) => <span key={p} className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium">{p}</span>)}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <img src={pip.url} alt="Ping" className="h-12 w-12 object-contain" loading="lazy" />
            <p className="text-sm font-medium text-foreground/90">{c.ping}</p>
          </div>
          <p className="mt-5 text-sm font-semibold italic text-primary/80">{t("home.differentiation.tagline")}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: .96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .7, delay: .12 }} className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-secondary/20 to-primary/20 blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-3 shadow-2xl backdrop-blur-xl">
            <div className="rounded-[1.45rem] border border-border/70 bg-background/80 p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-border/60 pb-5">
                <div className="flex items-center gap-3"><div className="gradient-button flex h-10 w-10 items-center justify-center rounded-xl"><WandSparkles className="h-5 w-5 text-primary-foreground" /></div><div><p className="text-xs text-muted-foreground">{c.cardLabel}</p><p className="font-bold">{c.destination}</p></div></div>
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_15px_#34d399]" />
              </div>
              <div className="py-6"><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary"><MapPin className="h-3.5 w-3.5" />{c.ready}</div><p className="text-lg font-semibold leading-7">{c.insight}</p></div>
              <div className="grid gap-2.5">
                {c.items.map((item, i) => <motion.div key={item} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .55 + i * .12 }} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="h-3.5 w-3.5" /></span>{item}</motion.div>)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
