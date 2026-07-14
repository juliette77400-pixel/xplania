import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, X, MapPin, Sparkles, Info, ChevronDown, Loader2, Compass, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useDestinationSuggestions, type DestinationSuggestion } from "@/hooks/useDestinationSuggestions";
import { trackReaction } from "@/lib/user-memory";

export default function Destinations() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const { data: destinations, isLoading, refetch } = useDestinationSuggestions({ limit: 8, originalityBoost: 0.4 });
  const [reacting, setReacting] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const react = async (dest: DestinationSuggestion, liked: boolean) => {
    setReacting((s) => ({ ...s, [dest.slug]: true }));
    try {
      await trackReaction({
        itemKey: dest.slug,
        itemType: "destination",
        source: "destinations-page",
        liked,
        tags: dest.tags ?? [],
        context: { name: dest.name, country: dest.country, match_score: dest.match_score },
      });
      setDismissed((prev) => new Set(prev).add(dest.slug));
      toast.success(liked ? `${dest.name} sauvegardée ❤️` : `${dest.name} écartée`);
      // Invalidate to refresh suggestions with updated history
      qc.invalidateQueries({ queryKey: ["xplania-destinations"] });
    } catch (e) {
      toast.error("Impossible d'enregistrer");
    } finally {
      setReacting((s) => ({ ...s, [dest.slug]: false }));
    }
  };

  const visible = (destinations ?? []).filter((d) => !dismissed.has(d.slug));

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Compass className="h-8 w-8 text-primary" /> Destinations pour toi
          </h1>
          <p className="text-muted-foreground mt-2">
            Suggestions calculées à partir de ton profil voyageur et de l'ADN de chaque destination.
            Like ❤️ ou écarte ✕ — Xplania apprend en direct.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && visible.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Plus rien à te proposer pour l'instant.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setDismissed(new Set()); refetch(); }}>
                Recharger
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {visible.map((dest) => (
            <DestinationCard
              key={dest.slug}
              dest={dest}
              onLike={() => react(dest, true)}
              onReject={() => react(dest, false)}
              disabled={!!reacting[dest.slug]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DestinationCard({
  dest,
  onLike,
  onReject,
  disabled,
}: {
  dest: DestinationSuggestion;
  onLike: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      {dest.hero_image_url && (
        <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
          <img src={dest.hero_image_url} alt={dest.name} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{dest.name}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {dest.country}
              {dest.region ? ` · ${dest.region}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{dest.match_score}</div>
            <div className="text-xs text-muted-foreground">match score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dest.summary && <p className="text-sm">{dest.summary}</p>}

        <div className="flex flex-wrap gap-1.5">
          {dest.tags.slice(0, 6).map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            Originalité {dest.originality_score}/100
          </Badge>
        </div>

        {/* Why this recommendation */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" /> Pourquoi cette recommandation ?
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <MatchBar label="Correspondance profil" value={dest.match_reason.profile_match} />
              <MatchBar label="Score d'originalité" value={dest.match_reason.originality} />
            </div>
            {dest.curated_notes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Sources Xplania (RAG)
                </p>
                <ul className="space-y-2">
                  {dest.curated_notes.map((note, i) => (
                    <li key={i} className="text-xs bg-muted/50 rounded p-3">
                      <div className="font-semibold mb-1">{note.title}</div>
                      <div className="text-muted-foreground line-clamp-3">{note.content}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dest.hidden_gems.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Hidden gems associés
                </p>
                <ul className="space-y-1.5">
                  {dest.hidden_gems.slice(0, 3).map((gem, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-semibold">{gem.name}</span>
                      {gem.summary && <span className="text-muted-foreground"> — {gem.summary}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReject}
            disabled={disabled}
          >
            <X className="mr-2 h-4 w-4" /> Pas pour moi
          </Button>
          <Button className="flex-1" onClick={onLike} disabled={disabled}>
            <Heart className="mr-2 h-4 w-4 fill-current" /> J'adore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}
