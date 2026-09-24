import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categoryByKey } from "@/lib/discover";
import { Button } from "@/components/ui/button";

interface P { id: string; name: string; category: string; lat: number; lng: number; description: string | null; address: string | null; image_url: string | null; }

const PublicList = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [list, setList] = useState<{ id: string; name: string; emoji: string | null } | null>(null);
  const [places, setPlaces] = useState<P[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    (async () => {
      const { data: l } = await supabase.from("place_lists").select("id,name,emoji").eq("share_slug", slug!).eq("is_public", true).maybeSingle();
      if (!l) return setState("missing");
      setList(l);
      const { data: it } = await supabase.from("place_list_items").select("place_id").eq("list_id", l.id);
      const ids = (it || []).map((i) => i.place_id);
      if (ids.length) {
        const { data: ps } = await supabase.from("places").select("id,name,category,lat,lng,description,address,image_url").in("id", ids);
        setPlaces((ps as P[]) || []);
      }
      setState("ok");
    })();
  }, [slug]);

  if (state === "loading") return <div className="min-h-screen grid place-items-center text-muted-foreground">{t("gmaps.public.loading")}</div>;
  if (state === "missing") return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div className="space-y-3"><p>{t("gmaps.public.missing")}</p><Button asChild><Link to="/">{t("gmaps.public.discover")}</Link></Button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("gmaps.public.kicker")}</p>
        <h1 className="text-3xl font-bold">{list?.emoji} {list?.name}</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {places.map((p) => {
            const c = categoryByKey(p.category);
            return (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-border bg-card/40">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-36 w-full object-cover" loading="lazy" />}
                <div className="space-y-1.5 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c?.emoji} {t(`gmaps.categories.${p.category}`, { defaultValue: c?.label ?? p.category })}</p>
                  <h2 className="font-semibold">{p.name}</h2>
                  {p.address && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{p.address}</p>}
                  {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  <a className="inline-flex items-center gap-1 text-xs text-primary hover:underline" target="_blank" rel="noopener noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}>
                    <Navigation className="h-3 w-3" />{t("gmaps.info.openInMaps")}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center space-y-2">
          <p className="text-sm">{t("gmaps.public.cta")}</p>
          <Button asChild><Link to="/">{t("gmaps.public.discover")}</Link></Button>
        </div>
      </div>
    </div>
  );
};

export default PublicList;
