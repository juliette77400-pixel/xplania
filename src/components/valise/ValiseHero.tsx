import { motion } from "framer-motion";
import { ArrowRight, Calendar, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { useDestinationImage } from "@/hooks/useDestinationImage";
import { useTranslation } from "react-i18next";

interface Props { destination:string; days:number; onGenerate:()=>void; isGenerating:boolean; checkedItems:number; totalItems:number; }

const ValiseHero = ({ destination, days, onGenerate, isGenerating, checkedItems, totalItems }: Props) => {
  const { t } = useTranslation(); const heroSrc=useDestinationImage(destination,1200,800); const pct=totalItems?Math.round((checkedItems/totalItems)*100):0;
  return <motion.header initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="overflow-hidden rounded-[2rem] border border-primary/15 bg-card/50">
    <div className="grid md:grid-cols-[1.15fr_.85fr]">
      <div className="flex flex-col justify-center p-6 sm:p-9"><p className="mb-4 inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[.17em] text-primary"><Sparkles className="h-4 w-4" />{t("valise.heroBadge")}</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl"><span className="gradient-text">{t("valise.heroTitleA")}</span><br />{t("valise.heroTitleB",{destination})}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{t("valise.heroDesc")}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold"><span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2"><MapPin className="h-3.5 w-3.5 text-primary" />{destination}</span><span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-2"><Calendar className="h-3.5 w-3.5 text-primary" />{t("valise.heroDays",{count:days})}</span></div>
        {!isGenerating&&<button onClick={onGenerate} className="gradient-button mt-7 inline-flex w-fit items-center gap-2 rounded-xl px-6 py-3 font-bold text-primary-foreground transition hover:-translate-y-0.5">{t("valise.heroCta")}<ArrowRight className="h-4 w-4" /></button>}
      </div>
      <div className="relative min-h-[250px] overflow-hidden md:min-h-[390px]"><img src={heroSrc} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" /><div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-background/85 p-4 backdrop-blur"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-sm font-bold">{t("valise.progressLabel")}</span></div><span className="text-sm font-extrabold text-primary">{pct}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full gradient-button transition-all duration-500" style={{width:`${pct}%`}} /></div><p className="mt-2 text-xs text-muted-foreground">{t("guideValise.itemsSelected",{checked:checkedItems,total:totalItems})}</p></div></div>
    </div>
  </motion.header>;
};
export default ValiseHero;
