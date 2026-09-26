import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sparkles, Check, X, ArrowRight, MessageCircle, Compass } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";
import { upsertJsonLd } from "@/lib/seo";

const ROW_KEYS = [
  "itineraire",
  "adn",
  "budget",
  "visa",
  "valise",
  "gps",
  "carnet",
  "humeur",
  "memoire",
  "alertes",
] as const;

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

const XplaniaVsChatgpt = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";
  const base = "https://xplania.app";

  useEffect(() => {
    document.title = t("vsChatgpt.metaTitle");
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("vsChatgpt.metaDescription"));

    upsertJsonLd("vs-chatgpt-faq", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_KEYS.map((k) => ({
        "@type": "Question",
        name: t(`vsChatgpt.faq.items.${k}.q`),
        acceptedAnswer: {
          "@type": "Answer",
          text: t(`vsChatgpt.faq.items.${k}.a`),
        },
      })),
    });

    upsertJsonLd("vs-chatgpt-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Xplania", item: `${base}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: t("vsChatgpt.h1"),
          item: `${base}/xplania-vs-chatgpt`,
        },
      ],
    });

    return () => {
      document.head.querySelector('script[data-id="vs-chatgpt-faq"]')?.remove();
      document.head.querySelector('script[data-id="vs-chatgpt-breadcrumb"]')?.remove();
    };
  }, [t, lang]);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
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
              {t("vsChatgpt.badge")}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {t("vsChatgpt.h1")}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {t("vsChatgpt.intro")}
            </p>
            <p className="text-xl font-semibold text-primary">{t("vsChatgpt.tagline")}</p>
          </motion.div>
        </div>
      </section>

      {/* TABLE */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center"
          >
            {t("vsChatgpt.tableTitle")}
          </motion.h2>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-secondary/30">
                  <th className="text-left p-4 font-semibold text-foreground w-1/3">
                    {t("vsChatgpt.table.feature")}
                  </th>
                  <th className="text-left p-4 font-semibold text-foreground w-1/3">
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      {t("vsChatgpt.table.chatgpt")}
                    </span>
                  </th>
                  <th className="text-left p-4 font-semibold text-primary w-1/3">
                    <span className="inline-flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      {t("vsChatgpt.table.xplania")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROW_KEYS.map((k, idx) => (
                  <tr
                    key={k}
                    className={idx % 2 === 0 ? "bg-background" : "bg-secondary/10"}
                  >
                    <td className="p-4 font-medium text-foreground align-top">
                      {t(`vsChatgpt.table.rows.${k}.label`)}
                    </td>
                    <td className="p-4 text-muted-foreground align-top">
                      <span className="flex items-start gap-2">
                        <X className="w-4 h-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                        {t(`vsChatgpt.table.rows.${k}.chatgpt`)}
                      </span>
                    </td>
                    <td className="p-4 text-foreground align-top">
                      <span className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {t(`vsChatgpt.table.rows.${k}.xplania`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WHEN TO USE */}
      <section className="py-12 md:py-16 bg-secondary/10">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center"
          >
            {t("vsChatgpt.when.title")}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{t("vsChatgpt.when.chatgptTitle")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("vsChatgpt.when.chatgptText")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{t("vsChatgpt.when.xplaniaTitle")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("vsChatgpt.when.xplaniaText")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center"
          >
            {t("vsChatgpt.faq.title")}
          </motion.h2>
          <div className="space-y-4">
            {FAQ_KEYS.map((k) => (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border p-5"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {t(`vsChatgpt.faq.items.${k}.q`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`vsChatgpt.faq.items.${k}.a`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-primary-foreground gradient-button transition-transform hover:scale-105"
          >
            {t("vsChatgpt.cta")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default XplaniaVsChatgpt;
