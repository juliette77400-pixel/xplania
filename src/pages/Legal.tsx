import { Link, useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

type LegalKey = "mentions" | "cgu" | "confidentialite";

const VALID: LegalKey[] = ["mentions", "cgu", "confidentialite"];

const Legal = () => {
  const { type } = useParams<{ type: string }>();
  const { t, i18n } = useTranslation();
  const isValid = !!type && VALID.includes(type as LegalKey);
  const key = (isValid ? type : "mentions") as LegalKey;

  useEffect(() => {
    document.title = `${t(`legal.${key}.title`)} — Xplania`;
  }, [key, t, i18n.language]);

  if (!isValid) {
    return <Navigate to="/legal/mentions" replace />;
  }

  const sections = (t(`legal.${key}.sections`, { returnObjects: true }) as Array<{ heading: string; body: string }>) || [];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("legal.backHome")}
        </Link>

        <div className="flex flex-wrap gap-2 mb-8">
          {VALID.map((k) => (
            <Link
              key={k}
              to={`/legal/${k}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                k === key
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`legal.${k}.title`)}
            </Link>
          ))}
        </div>

        <article className="glass-card rounded-2xl p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t(`legal.${key}.title`)}</h1>
          <p className="text-sm text-muted-foreground mb-8">
            {t("legal.lastUpdated")}: {t("legal.updateDate")}
          </p>

          <div className="space-y-6 text-sm text-foreground leading-relaxed">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-lg font-semibold text-foreground mb-2">{s.heading}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{s.body}</p>
              </section>
            ))}
          </div>

          <p className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
            {t("legal.contactNote")}{" "}
            <a href="mailto:juliettenoel.xplania@gmail.com" className="text-primary hover:underline">
              juliettenoel.xplania@gmail.com
            </a>
          </p>
        </article>
      </div>
    </div>
  );
};

export default Legal;
