import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import AppNavbar from "@/components/shared/AppNavbar";
import Footer from "@/components/xplania/Footer";
import { Button } from "@/components/ui/button";

const STEPS = [
  { key: "s1", to: "/" },
  { key: "s2", to: "/dashboard" },
  { key: "s3", to: "/guide-budget" },
  { key: "s4", to: "/guide-visa" },
  { key: "s5", to: "/guide-valise" },
  { key: "s6", to: "/discover" },
];

export default function GuidePlanTrip() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppNavbar />
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-3xl px-4 py-16">
        <article>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("planGuide.h1")}</h1>
          <p className="text-lg text-muted-foreground mb-10">{t("planGuide.intro")}</p>

          <h2 className="text-2xl font-semibold mb-3">{t("planGuide.whyTitle")}</h2>
          <p className="text-muted-foreground mb-10">{t("planGuide.whyText")}</p>

          <h2 className="text-2xl font-semibold mb-6">{t("planGuide.stepsTitle")}</h2>
          <ol className="space-y-6 mb-12">
            {STEPS.map((s, i) => (
              <li key={s.key} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-lg font-semibold mb-2">
                  {i + 1}. {t(`planGuide.${s.key}.title`)}
                </h3>
                <p className="text-muted-foreground mb-3">{t(`planGuide.${s.key}.text`)}</p>
                <Link to={s.to} className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                  {t(`planGuide.${s.key}.cta`)} <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ol>

          <h2 className="text-2xl font-semibold mb-3">{t("planGuide.tipsTitle")}</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-12">
            {["t1", "t2", "t3", "t4"].map((k) => <li key={k}>{t(`planGuide.${k}`)}</li>)}
          </ul>

          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-lg font-semibold mb-4">{t("planGuide.ctaText")}</p>
            <Button asChild><Link to="/">{t("planGuide.ctaButton")}</Link></Button>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
