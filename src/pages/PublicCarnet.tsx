import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, BookOpen, ArrowLeft, Flag } from "lucide-react";
import { SUPPORT_EMAIL } from "@/components/shared/HelpButton";
import { supabase } from "@/integrations/supabase/client";
import { setShareMeta, clearShareMeta } from "@/lib/seo";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import SouvenirAlbum from "@/components/journal/SouvenirAlbum";

const PublicCarnet = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [journal, setJournal] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [story, setStory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: j } = await supabase.from("journals").select("*").eq("public_slug", slug).eq("is_public", true).maybeSingle();
      if (!j) { setLoading(false); return; }
      setJournal(j);

      const { data: d } = await supabase.from("journal_days").select("*").eq("journal_id", j.id).order("date");
      const { data: blocks } = await supabase.from("journal_blocks").select("*").eq("journal_id", j.id).order("position");
      const merged = (d || []).map((day: any) => ({ ...day, blocks: (blocks || []).filter((b: any) => b.day_id === day.id) }));
      setDays(merged);

      const { data: s } = await supabase.from("journal_stories").select("content").eq("journal_id", j.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (s) setStory(s.content);

      const firstNote = (blocks || []).find((b: any) => b.type === "note");
      const firstNoteText = (firstNote?.content as any)?.text || "";
      const rawDesc = (s?.content || firstNoteText || i18n.t("ui2.PublicCarnet.shareDescriptionFallback")).toString();
      const description = rawDesc.replace(/\s+/g, " ").trim().slice(0, 155);

      let author: string | undefined;
      if (j.user_id) {
        const { data: name } = await supabase.rpc("get_public_display_name", { _user_id: j.user_id });
        author = (name as string | null) || undefined;
      }

      setShareMeta({
        title: j.title || i18n.t("ui2.PublicCarnet.titleFallback"),
        description,
        ogKind: "carnet",
        slug: slug!,
        imageUrl: j.cover_url || undefined,
        author,
        publishedAt: j.created_at || undefined,
      });

      setLoading(false);
    })();
    return () => { clearShareMeta(); };
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!journal) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">{t("ui2.PublicCarnet.notFound")}</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border backdrop-blur-md bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> {t("ui2.PublicCarnet.backHome")}</Link>
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><h1 className="font-bold">{journal.title}</h1></div>
          <div className="w-16" />
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-12 max-w-3xl space-y-10">
        {story && (
          <section className="glass-card rounded-2xl p-8">
            <h2 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">{t("ui2.PublicCarnet.story")}</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed font-serif">{story}</p>
          </section>
        )}

        <SouvenirAlbum readOnly title={journal.title} destination="" cover={journal.cover_url} days={days} />
        <div className="flex justify-center">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("report.subject"))}&body=${encodeURIComponent(t("report.body", { page: `https://xplania.app/carnet/public/${slug}`, title: journal.title }))}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive min-h-[44px]"
          >
            <Flag className="w-4 h-4" aria-hidden="true" /> {t("report.cta")}
          </a>
        </div>
      </main>
    </div>
  );
};

export default PublicCarnet;
