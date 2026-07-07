import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, MapPin, Play, Sparkles, WandSparkles } from "lucide-react";

interface Props {
  onCreateTrip: () => void;
  onDemoTrip?: () => void;
}

const copy = {
  fr: {
    eyebrow: "Votre copilote de voyage, propulsé par l’IA",
    title: "Un seul copilote pour",
    accent: "tout votre voyage.",
    subtitle: "Xplania apprend vos envies, prépare chaque détail et reste à vos côtés avant, pendant et après le départ.",
    primary: "Planifier mon voyage",
    demo: "Voir un voyage à Lisbonne",
    proof: ["Personnalisé à vos préférences", "Essai gratuit", "FR · EN"],
    cardLabel: "Pip analyse votre voyage",
    destination: "Lisbonne · 4 jours",
    insight: "Un itinéraire culturel et gourmand, adapté à votre rythme et à votre budget.",
    ready: "Votre voyage est prêt",
    items: ["Budget ajusté", "Formalités vérifiées", "Valise adaptée à la météo"],
  },
  en: {
    eyebrow: "Your AI-powered travel copilot",
    title: "One copilot for",
    accent: "your entire journey.",
    subtitle: "Xplania learns what you like, prepares every detail and stays with you before, during and after your trip.",
    primary: "Plan my trip",
    demo: "See a Lisbon trip",
    proof: ["Tailored to your preferences", "Free to try", "FR · EN"],
    cardLabel: "Pip is analyzing your trip",
    destination: "Lisbon · 4 days",
    insight: "A cultural and foodie itinerary, tailored to your pace and budget.",
    ready: "Your trip is ready",
    items: ["Budget optimized", "Paperwork checked", "Weather-ready packing list"],
  },
};

const HeroSection = ({ onCreateTrip, onDemoTrip }: Props) => {
  const { i18n } = useTranslation();
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
            {onDemoTrip && <button onClick={onDemoTrip} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/70 px-7 py-4 font-semibold transition hover:border-primary/35 hover:bg-card"><Play className="h-4 w-4 fill-current text-primary" />{c.demo}</button>}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
            {c.proof.map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" />{item}</span>)}
          </div>
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
