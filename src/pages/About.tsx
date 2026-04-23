import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Plane, Heart, Sparkles, Compass, Users, Target, Lightbulb, Shield, ArrowRight, Mail,
} from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";

const About = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("about.metaTitle");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("about.metaDescription"));
  }, [t]);

  const values = [
    { icon: Heart, key: "human" },
    { icon: Lightbulb, key: "smart" },
    { icon: Shield, key: "trust" },
    { icon: Compass, key: "freedom" },
  ];

  const milestones = (t("about.timeline.items", { returnObjects: true }) as Array<{
    year: string; title: string; desc: string;
  }>) || [];

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
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

      {/* Founder story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 md:p-12 border border-border"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center shrink-0">
                <Plane className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t("about.story.title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{t("about.story.signature")}</p>
              </div>
            </div>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>{t("about.story.p1")}</p>
              <p>{t("about.story.p2")}</p>
              <p>{t("about.story.p3")}</p>
              <p className="text-primary font-medium italic">{t("about.story.quote")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  {t("about.mission.label")}
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t("about.mission.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("about.mission.body")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: Users, k: "stat1" },
                { icon: Compass, k: "stat2" },
                { icon: Heart, k: "stat3" },
                { icon: Sparkles, k: "stat4" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.k} className="glass-card rounded-xl p-4 border border-border">
                    <Icon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      {t(`about.mission.${s.k}.value`)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(`about.mission.${s.k}.label`)}
                    </p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("about.values.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("about.values.subtitle")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-2xl p-6 border border-border hover:border-primary/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">
                    {t(`about.values.items.${v.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`about.values.items.${v.key}.desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      {milestones.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-6 max-w-3xl">
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
                  <h3 className="font-semibold text-foreground mb-1">{m.title}</h3>
                  <p className="text-sm text-muted-foreground">{m.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
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
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/"
                  className="gradient-button px-6 py-3 rounded-full text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  {t("about.cta.primary")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="mailto:juliettenoel.xplania@gmail.com"
                  className="px-6 py-3 rounded-full border border-border bg-background/50 text-foreground font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted/50 transition"
                >
                  <Mail className="w-4 h-4" />
                  {t("about.cta.secondary")}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
