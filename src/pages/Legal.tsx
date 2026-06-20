import { Link, useParams, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { ALL_LEGAL_KEYS, getLegalPath, LegalKey } from "@/lib/legal-routes";

interface Props {
  legalKey?: LegalKey;
}

const Legal = ({ legalKey }: Props) => {
  const { type } = useParams<{ type: string }>();
  const { t, i18n } = useTranslation();

  // Resolve key: explicit prop wins (new dedicated routes), else legacy /legal/:type param
  const resolved: LegalKey | null = legalKey
    ? legalKey
    : type && (ALL_LEGAL_KEYS as string[]).includes(type)
      ? (type as LegalKey)
      : null;

  useEffect(() => {
    if (resolved) {
      document.title = `${t(`legal.${resolved}.title`)} — Xplania`;
    }
  }, [resolved, t, i18n.language]);

  if (!resolved) {
    return <Navigate to={getLegalPath("mentions", i18n.language)} replace />;
  }

  const sections =
    (t(`legal.${resolved}.sections`, { returnObjects: true }) as Array<{
      heading: string;
      body: string;
    }>) || [];

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
          {ALL_LEGAL_KEYS.map((k) => (
            <Link
              key={k}
              to={getLegalPath(k, i18n.language)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                k === resolved
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`legal.${k}.title`)}
            </Link>
          ))}
        </div>

        <article className="glass-card rounded-2xl p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t(`legal.${resolved}.title`)}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {t("legal.lastUpdated")}: {t("legal.updateDate")}
          </p>

          <div className="space-y-6 text-sm text-foreground leading-relaxed">
            {sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-lg font-semibold text-foreground mb-2">{s.heading}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{renderBody(s.body)}</p>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-border space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <span className="text-muted-foreground">{t("legal.seeAlso")}:</span>
              {ALL_LEGAL_KEYS.filter((k) => k !== resolved).map((k) => (
                <Link
                  key={k}
                  to={getLegalPath(k, i18n.language)}
                  className="text-primary hover:underline"
                >
                  {t(`legal.${k}.title`)}
                </Link>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("legal.contactNote")}{" "}
              <a
                href="mailto:juliettenoel.xplania@gmail.com"
                className="text-primary hover:underline"
              >
                juliettenoel.xplania@gmail.com
              </a>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default Legal;
