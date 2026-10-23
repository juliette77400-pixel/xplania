import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, FileCheck, Globe2, Luggage, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { isPathEnabled } from "@/config/featureFlags";

// The four preparation tools of the beta. Each card links to its tool.
const copy = {
  fr: {
    tag: "4 outils, un seul objectif",
    title: "Tout ce qu'il faut préparer avant le départ, au même endroit.",
    subtitle: "Tu renseignes ton voyage une fois. Chaque outil s'adapte à ta destination, à tes dates et à ton type de séjour.",
    tools: [
      ["/guide-budget", "Budget", "Sache combien prévoir.", "Une estimation réaliste selon ta destination et la durée du séjour, puis le suivi de tes dépenses prévues.", "Préparer mon budget", ["Estimation par poste", "Scénarios éco, réaliste, confort", "Conseils pour économiser"]],
      ["/guide-visa", "Visa & formalités", "Ne rate aucun document.", "Visa, passeport, vaccins et démarches selon ta nationalité et ton pays d'arrivée, avec une checklist à cocher.", "Vérifier mes formalités", ["Visa selon ta nationalité", "Santé et sécurité", "Checklist des documents"]],
      ["/guide-valise", "Valise", "N'oublie rien d'important.", "Une liste adaptée au climat, à la durée et au type de séjour, que tu coches au fur et à mesure.", "Préparer ma valise", ["Liste selon la météo", "Tenues adaptées", "Éléments oubliés repérés"]],
      ["/guide-culture", "Guide culturel", "Arrive à l'aise.", "Les codes culturels du pays : tenue, gastronomie et usages à table, gestes, salutations, avec mises en situation et mini-quiz.", "Lire le guide culturel", ["Codes et usages du pays", "Mises en situation", "Mini-quiz"]],
    ],
  },
  en: {
    tag: "4 tools, one goal",
    title: "Everything to prepare before you leave, in one place.",
    subtitle: "Enter your trip once. Each tool adapts to your destination, dates and type of stay.",
    tools: [
      ["/guide-budget", "Budget", "Know how much to plan.", "A realistic estimate based on your destination and length of stay, then tracking of your planned expenses.", "Plan my budget", ["Estimate per category", "Economy, realistic, comfort scenarios", "Money-saving tips"]],
      ["/guide-visa", "Visa & paperwork", "Miss no document.", "Visa, passport, vaccines and formalities based on your nationality and destination, with a checklist to tick.", "Check my paperwork", ["Visa for your nationality", "Health and safety", "Document checklist"]],
      ["/guide-valise", "Packing", "Forget nothing important.", "A list adapted to the climate, length and type of stay, ticked off as you go.", "Pack my suitcase", ["List based on the weather", "Suitable outfits", "Forgotten items spotted"]],
      ["/guide-culture", "Culture guide", "Arrive at ease.", "The country's cultural codes: dress, food and table manners, gestures, greetings, with real-life situations and a mini-quiz.", "Read the culture guide", ["Local codes and customs", "Real-life situations", "Mini-quiz"]],
    ],
  },
};

const ICONS = [Wallet, FileCheck, Luggage, Globe2];

const FeaturesSection = () => {
  const { i18n } = useTranslation();
  const c = i18n.language.startsWith("fr") ? copy.fr : copy.en;
  const tools = c.tools
    .map((tool, i) => ({ tool, Icon: ICONS[i] }))
    .filter(({ tool }) => isPathEnabled(tool[0] as string));
  return (
    <section id="features" className="border-y border-border/60 bg-card/20 px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-primary">{c.tag}</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">{c.title}</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{c.subtitle}</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {tools.map(({ tool, Icon }, i) => {
            const [to, name, title, body, cta, items] = tool as [string, string, string, string, string, string[]];
            return (
              <motion.article key={to} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="flex flex-col rounded-[1.75rem] border border-border/70 bg-background/60 p-7 interactive-card">
                <div className="flex items-center gap-3">
                  <div className="gradient-button flex h-11 w-11 items-center justify-center rounded-xl"><Icon className="h-5 w-5 text-primary-foreground" /></div>
                  <p className="text-sm font-bold uppercase tracking-[.14em] text-primary">{name}</p>
                </div>
                <h3 className="mt-5 text-2xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {items.map((it) => <li key={it} className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium">{it}</li>)}
                </ul>
                <Link to={to} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-primary hover:underline">
                  {cta}<ArrowRight className="h-4 w-4" />
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
