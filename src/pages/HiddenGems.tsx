import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/shared/AppNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Gem, Search, MapPin, Sparkles } from "lucide-react";

interface HiddenGemRow {
  id: string;
  destination_id: string | null;
  name: string;
  kind: string;
  summary_fr: string | null;
  summary_en: string | null;
  best_season: string | null;
  originality_score: number;
  tags: string[] | null;
  lat: number | null;
  lng: number | null;
  destinations?: { name: string; country: string; slug: string } | null;
}

export default function HiddenGems() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [destFilter, setDestFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["hidden-gems-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hidden_gems")
        .select("*, destinations(name, country, slug)")
        .order("originality_score", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as HiddenGemRow[];
    },
  });

  const destinationsInList = useMemo(() => {
    const map = new Map<string, string>();
    (data ?? []).forEach((g) => {
      if (g.destinations?.slug) map.set(g.destinations.slug, g.destinations.name);
    });
    return Array.from(map.entries());
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((g) => {
      if (destFilter !== "all" && g.destinations?.slug !== destFilter) return false;
      if (!q) return true;
      const summary = g.summary_fr ?? g.summary_en ?? "";
      const hay = `${g.name} ${summary} ${(g.tags ?? []).join(" ")} ${g.destinations?.name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, destFilter]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gem className="h-8 w-8 text-primary" /> Hidden Gems Xplania
          </h1>
          <p className="text-muted-foreground mt-2">
            Pépites confidentielles, ateliers d'artisans, lieux évités par les guides.
            Curatés par la communauté Xplania et notés selon leur originalité.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (nom, quartier, tag…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={destFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDestFilter("all")}
            >
              Toutes
            </Button>
            {destinationsInList.map(([slug, name]) => (
              <Button
                key={slug}
                variant={destFilter === slug ? "default" : "outline"}
                size="sm"
                onClick={() => setDestFilter(slug)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune pépite ne correspond à ta recherche.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <Card key={g.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {g.photo_url && (
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                  <img src={g.photo_url} alt={g.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{g.name}</CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    <Gem className="h-3 w-3 mr-1" />{g.originality_score}
                  </Badge>
                </div>
                {g.destinations && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {g.destinations.name}, {g.destinations.country}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {g.summary && <p className="text-sm text-muted-foreground">{g.summary}</p>}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs capitalize">{g.kind}</Badge>
                  {g.best_season && (
                    <Badge variant="secondary" className="text-xs">{g.best_season}</Badge>
                  )}
                  {(g.tags ?? []).slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
