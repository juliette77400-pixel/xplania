import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { ArrowLeft, ShieldCheck, Lock, Database, Mail, Users, Server, Eye, AlertTriangle } from "lucide-react";
import { getLegalPath } from "@/lib/legal-routes";

const Trust = () => {
  const { t, i18n } = useTranslation();
  const isFr = !i18n.language || i18n.language.toLowerCase().startsWith("fr");

  useEffect(() => {
    document.title = `${isFr ? "Sécurité & Confiance" : "Trust & Security"} — Xplania`;
  }, [isFr]);

  const sections = isFr
    ? [
        {
          icon: Lock,
          title: "Authentification",
          body: "Connexion par e-mail/mot de passe ou Google. Les mots de passe ne sont jamais stockés en clair par Xplania — l'authentification est gérée par notre prestataire (Supabase). La déconnexion et la réinitialisation du mot de passe sont disponibles depuis votre profil.",
        },
        {
          icon: ShieldCheck,
          title: "Contrôle d'accès aux données",
          body: "Vos voyages, carnets, dépenses, positions GPS, favoris et préférences sont strictement liés à votre compte. Les règles d'accès appliquées en base de données limitent la lecture et la modification au propriétaire, sauf lorsque vous activez explicitement un partage.",
        },
        {
          icon: Eye,
          title: "Partage public, opt-in uniquement",
          body: "Le partage public d'un carnet ou d'un suivi de voyage en direct n'est jamais activé par défaut. Vous devez le déclencher manuellement, et un lien secret (slug aléatoire) est généré. Vous pouvez révoquer le partage à tout moment depuis l'écran concerné. Lorsqu'un suivi live est partagé, votre position GPS récente devient visible par toute personne disposant du lien — un message d'avertissement vous le rappelle au moment de l'activation.",
        },
        {
          icon: Database,
          title: "Données collectées",
          body: "Nous collectons uniquement les données nécessaires au fonctionnement de l'app : votre e-mail, vos informations de profil (nom d'affichage, avatar), vos voyages, carnets et préférences. La géolocalisation n'est utilisée que lorsque vous l'activez (Suivi de voyage, Mood Explorer, Discover) et n'est pas partagée avec des tiers à des fins publicitaires.",
        },
        {
          icon: Server,
          title: "Hébergement & sous-traitants",
          body: "Xplania s'appuie sur Supabase (base de données, authentification, stockage, edge functions) et sur des fournisseurs d'IA via la passerelle Lovable AI Gateway pour générer les recommandations. Les services de cartographie (OpenStreetMap, Overpass), de météo (OpenWeatherMap) et d'images (Unsplash) sont appelés uniquement en fonction des écrans que vous ouvrez.",
        },
        {
          icon: Users,
          title: "Vos droits",
          body: "Vous pouvez modifier vos informations de profil, supprimer vos voyages, désactiver un partage public ou demander la suppression complète de votre compte en nous écrivant. Les utilisateurs européens disposent de l'ensemble des droits prévus par le RGPD.",
        },
        {
          icon: AlertTriangle,
          title: "Signaler un problème de sécurité",
          body: "Si vous pensez avoir identifié une vulnérabilité, écrivez-nous à juliettenoel.xplania@gmail.com avec un maximum de détails (étapes de reproduction, impact estimé). Nous nous engageons à étudier chaque signalement et à corriger les problèmes vérifiés dans les meilleurs délais.",
        },
      ]
    : [
        {
          icon: Lock,
          title: "Authentication",
          body: "Sign-in via email/password or Google. Xplania never stores passwords in plain text — authentication is handled by our managed provider (Supabase). Sign-out and password reset are available from your profile.",
        },
        {
          icon: ShieldCheck,
          title: "Data access control",
          body: "Your trips, journals, expenses, GPS positions, favorites and preferences are scoped to your account. Database-level access rules restrict reads and writes to the owner, except when you explicitly opt into sharing.",
        },
        {
          icon: Eye,
          title: "Public sharing, opt-in only",
          body: "Public sharing of a journal or a live trip tracker is never enabled by default. You must trigger it manually, and a secret random URL slug is generated. You can revoke sharing at any time from the same screen. When a live trip is shared, your recent GPS position becomes visible to anyone who has the link — an in-app warning makes this clear before you enable it.",
        },
        {
          icon: Database,
          title: "Data we collect",
          body: "We collect only what we need to run the app: your email, profile information (display name, avatar), your trips, journals and preferences. Geolocation is used only when you turn it on (live trip tracker, Mood Explorer, Discover) and is never shared with third parties for advertising.",
        },
        {
          icon: Server,
          title: "Hosting & subprocessors",
          body: "Xplania relies on Supabase (database, authentication, storage, edge functions) and on AI providers reached through the Lovable AI Gateway for recommendations. Maps (OpenStreetMap, Overpass), weather (OpenWeatherMap) and images (Unsplash) are called only on the screens that need them.",
        },
        {
          icon: Users,
          title: "Your rights",
          body: "You can update your profile, delete your trips, disable public sharing, or request full account deletion by emailing us. Users in the EU have the full set of rights granted by GDPR.",
        },
        {
          icon: AlertTriangle,
          title: "Report a security issue",
          body: "If you believe you have found a vulnerability, email juliettenoel.xplania@gmail.com with as much detail as possible (reproduction steps, expected impact). We will review every report and address verified issues as quickly as we can.",
        },
      ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {isFr ? "Retour à l'accueil" : "Back to home"}
        </Link>

        <article className="glass-card rounded-2xl p-6 sm:p-10 space-y-6">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isFr ? "Sécurité & Confiance" : "Trust & Security"}
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {isFr ? "Comment Xplania protège vos données" : "How Xplania protects your data"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isFr
                ? "Cette page est maintenue par l'équipe Xplania pour répondre aux questions courantes sur la sécurité et la confidentialité de l'application. Elle décrit les contrôles activés dans l'app — ce n'est pas une certification indépendante."
                : "This page is maintained by the Xplania team to answer common security and privacy questions about the app. It describes the controls enabled in-app — it is not an independent certification."}
            </p>
          </header>

          <div className="space-y-5">
            {sections.map((s, i) => {
              const Icon = s.icon;
              return (
                <section key={i} className="rounded-xl border border-border bg-card/40 p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-foreground mb-1.5">{s.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {s.body}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
              <span className="text-muted-foreground">{isFr ? "Voir aussi" : "See also"}:</span>
              <Link to={getLegalPath("confidentialite", i18n.language)} className="text-primary hover:underline">
                {isFr ? "Politique de confidentialité" : "Privacy policy"}
              </Link>
              <Link to={getLegalPath("cgu", i18n.language)} className="text-primary hover:underline">
                {isFr ? "Conditions d'utilisation" : "Terms of use"}
              </Link>
              <Link to={getLegalPath("mentions", i18n.language)} className="text-primary hover:underline">
                {isFr ? "Mentions légales" : "Legal notice"}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              <a href="mailto:juliettenoel.xplania@gmail.com" className="text-primary hover:underline">
                juliettenoel.xplania@gmail.com
              </a>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default Trust;
