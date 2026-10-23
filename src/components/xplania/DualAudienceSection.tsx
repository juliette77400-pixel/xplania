import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Layers3, MapPin, Gauge } from "lucide-react";

const content = {
  fr: { tag: "Pourquoi Xplania", title: "Partir à l'étranger est excitant. Le préparer ne devrait pas être épuisant.", body: "Le visa sur un site officiel, le budget dans un tableur, la valise sur ton téléphone, les codes culturels dans des forums… Xplania réunit ces quatre préparatifs autour de ton voyage.", cards: [["Tout au même endroit", "Budget, visa, valise et culture partagent les infos de ton voyage : tu ne les ressaisis pas."], ["Adapté à ta destination", "Chaque conseil tient compte de ton pays d'arrivée, de tes dates et de ton type de séjour."], ["Tu sais où tu en es", "Une progression claire par outil, pour partir sans rien oublier."]] },
  en: { tag: "Why Xplania", title: "Going abroad is exciting. Preparing for it shouldn't be exhausting.", body: "The visa on an official website, the budget in a spreadsheet, the packing list on your phone, cultural codes in forums… Xplania brings these four preparations together around your trip.", cards: [["Everything in one place", "Budget, visa, packing and culture share your trip details: no need to type them again."], ["Adapted to your destination", "Every tip takes your destination, dates and type of stay into account."], ["You know where you stand", "Clear progress per tool, so you leave without forgetting anything."]] },
};

const DualAudienceSection = () => {
  const { i18n } = useTranslation(); const c = i18n.language.startsWith("fr") ? content.fr : content.en;
  const icons = [Layers3, MapPin, Gauge];
  return <section className="border-y border-border/60 bg-card/25 px-4 py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-end"><div><p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-primary">{c.tag}</p><h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c.title}</h2></div><p className="max-w-xl text-lg leading-8 text-muted-foreground lg:justify-self-end">{c.body}</p></div><div className="mt-14 grid gap-4 md:grid-cols-3">{c.cards.map(([title, body], i) => { const Icon = icons[i]; return <motion.article key={title} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}} className="rounded-2xl border border-border/70 bg-background/60 p-6 interactive-card"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></motion.article>})}</div></div></section>;
};
export default DualAudienceSection;
