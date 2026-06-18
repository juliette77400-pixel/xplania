import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, BookOpen, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDayLabel } from "@/lib/journal-utils";
import { setShareMeta, clearShareMeta } from "@/lib/seo";

const PublicCarnet = () => {
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
      const rawDesc = (s?.content || firstNoteText || "Découvre ce carnet de voyage immersif sur Xplania.").toString();
      const description = rawDesc.replace(/\s+/g, " ").trim().slice(0, 155);

      let author: string | undefined;
      if (j.user_id) {
        const { data: name } = await supabase.rpc("get_public_display_name", { _user_id: j.user_id });
        author = (name as string | null) || undefined;
      }

      setShareMeta({
        title: j.title || "Carnet de voyage",
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
  if (!journal) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carnet introuvable ou privé</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border backdrop-blur-md bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Xplania</Link>
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /><h1 className="font-bold">{journal.title}</h1></div>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl space-y-10">
        {story && (
          <section className="glass-card rounded-2xl p-8">
            <h2 className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">Le récit</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed font-serif">{story}</p>
          </section>
        )}

        {days.map((d, i) => (
          <section key={d.id} className="space-y-3">
            <div>
              <p className="text-xs text-primary uppercase tracking-wider font-semibold">Jour {i + 1} · {formatDayLabel(d.date)}</p>
              {d.title && <h2 className="text-2xl font-bold text-foreground">{d.title}</h2>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {d.blocks.map((b: any) => {
                const c = b.content || {};
                return (
                  <div key={b.id} className="glass-card rounded-xl p-4">
                    {b.type === "note" && <p className="text-sm text-foreground whitespace-pre-wrap">{c.text}</p>}
                    {b.type === "highlight" && <p className="text-sm font-medium text-foreground">⭐ {c.text}</p>}
                    {b.type === "location" && <p className="text-sm text-foreground">📍 {c.name}</p>}
                    {b.type === "mood" && <p className="text-3xl">{c.emoji}</p>}
                    {b.type === "photo" && c.url && (
                      <div className="space-y-1">
                        <img src={c.url} alt={c.caption || ""} className="rounded-lg w-full" />
                        {c.caption && <p className="text-xs text-muted-foreground italic">{c.caption}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default PublicCarnet;
