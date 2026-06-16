import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Sparkles, Heart, MapPin, BookOpen, Layers, Users, Brain,
  ArrowRight, Mail, GraduationCap, Award, PenTool, Globe2, Quote, Compass,
} from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";
import pipMascot from "@/assets/pip-mascot.png.asset.json";

const About = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("about.metaTitle");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("about.metaDescription"));
  }, [t]);

  const milestones = (t("about.timeline.items", { returnObjects: true }) as Array<{
    year: string; title: string; desc: string;
  }>) || [];

  const steps = [
    { icon: Heart, k: "s1" },
    { icon: MapPin, k: "s2" },
    { icon: BookOpen, k: "s3" },
  ];

  const stats = [
    { icon: Layers, k: "stat1" },
    { icon: Users, k: "stat2" },
    { icon: Brain, k: "stat3" },
  ];

  const founderBullets = [
    { icon: GraduationCap, k: "bullet1" },
    { icon: Award, k: "bullet2" },
    { icon: PenTool, k: "bullet3" },
    { icon: Globe2, k: "bullet4" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      {/* 1. HERO */}
      <section className="relative overflow-hidden pt-20 pb-20 md:pt-28 md:pb-28">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary/30 bg-primary/5 mb-6">
              <Sparkles className="w-3 h-3" />
              {t("about.badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {t("about.heroTitle")}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("about.heroSubtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. STORYTELLING */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12 border border-border"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
              {t("about.story.title")}
            </h2>
            <div className="space-y-5 text-foreground/90 leading-relaxed text-lg">
              <p>{t("about.story.p1")}</p>
              <p>{t("about.story.p2")}</p>
              <p className="font-medium">{t("about.story.p3")}</p>
              <p className="text-primary font-semibold text-xl pt-2">
                {t("about.story.quote")}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. TIMELINE */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
            {t("about.timeline.title")}
          </h2>
          <div className="relative pl-6 border-l-2 border-primary/30 space-y-8">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full gradient-button border-2 border-background" />
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                  {m.year}
                </p>
                <h3 className="font-semibold text-foreground text-lg mb-1">{m.title}</h3>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITION */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              {t("about.value.tag")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5 leading-tight">
              {t("about.value.title")}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("about.value.body")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 5. EXPERIENCE — 3 STEPS */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("about.experience.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("about.experience.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-2xl p-6 border border-border hover:border-primary/40 transition-colors relative"
                >
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-button flex items-center justify-center text-primary-foreground font-bold text-sm border-2 border-background">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">
                    {t(`about.experience.steps.${s.k}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`about.experience.steps.${s.k}.desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. KEY NUMBERS */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
            {t("about.stats.title")}
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.k}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-2xl p-6 border border-border text-center"
                >
                  <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {t(`about.stats.${s.k}.value`)}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`about.stats.${s.k}.label`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOUNDER */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-12 border border-border"
          >
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              {t("about.founder.tag")}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              {t("about.founder.title")}
            </h2>
            <ul className="space-y-3 mb-6">
              {founderBullets.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.k} className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground/90 leading-relaxed">
                      {t(`about.founder.${b.k}`)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-muted-foreground leading-relaxed border-t border-border pt-6">
              {t("about.founder.body")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 8. CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-border p-10 md:p-14 text-center"
            style={{ background: "var(--gradient-primary)" }}
          >
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("about.cta.title")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("about.cta.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
                <Link
                  to="/"
                  className="gradient-button px-6 py-3 rounded-full text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  {t("about.cta.primary")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={`mailto:${t("about.cta.email")}`}
                  className="px-6 py-3 rounded-full border border-border bg-background/50 text-foreground font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 transition"
                >
                  <Mail className="w-4 h-4" />
                  {t("about.cta.secondary")}
                </a>
              </div>
              <a
                href={`mailto:${t("about.cta.email")}`}
                className="text-sm text-primary hover:underline"
              >
                {t("about.cta.email")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
