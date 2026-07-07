import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Brain, Clock3, Layers3 } from "lucide-react";

const content = {
  fr: { tag: "Pourquoi Xplania", title: "Le voyage est une aventure. Sa préparation ne devrait pas être une épreuve.", body: "Trop d’onglets, d’informations contradictoires et de décisions à prendre. Xplania réunit le contexte de votre voyage pour vous donner la bonne réponse, au bon moment.", cards: [["Moins de charge mentale", "Les recherches dispersées deviennent des décisions simples."], ["Une IA qui vous connaît", "Vos goûts, votre rythme et vos contraintes nourrissent chaque conseil."], ["Une continuité totale", "Votre préparation, votre séjour et vos souvenirs restent enfin connectés."]] },
  en: { tag: "Why Xplania", title: "Travel is an adventure. Planning it shouldn't feel like a chore.", body: "Too many tabs, conflicting information and decisions to make. Xplania brings your trip context together to give you the right answer at the right time.", cards: [["Less mental load", "Scattered research becomes a few clear decisions."], ["AI that knows you", "Your tastes, pace and constraints shape every suggestion."], ["One continuous journey", "Your planning, trip and memories finally stay connected."]] },
};

const DualAudienceSection = () => {
  const { i18n } = useTranslation(); const c = i18n.language.startsWith("fr") ? content.fr : content.en;
  const icons = [Clock3, Brain, Layers3];
  return <section className="border-y border-border/60 bg-card/25 px-4 py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-primary">{c.tag}</p><h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c.title}</h2></div><p className="max-w-xl text-lg leading-8 text-muted-foreground lg:justify-self-end">{c.body}</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{c.cards.map(([title, body], i) => { const Icon = icons[i]; return <motion.article key={title} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}} className="rounded-2xl border border-border/70 bg-background/60 p-6"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></motion.article>})}</div></div></section>;
};
export default DualAudienceSection;
