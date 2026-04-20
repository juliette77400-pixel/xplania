import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import QuickJump from "@/components/shared/QuickJump";
import { ArrowLeft, Compass, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useExplore } from "@/hooks/useExplore";
import { useTrips } from "@/hooks/useTrips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ProgressHeader from "@/components/explore/ProgressHeader";
import BadgesShowcase from "@/components/explore/BadgesShowcase";
import ExploreMap from "@/components/explore/ExploreMap";
import NodeDetailDrawer from "@/components/explore/NodeDetailDrawer";
import AddNodeDialog from "@/components/explore/AddNodeDialog";
import ReplayMode from "@/components/explore/ReplayMode";
import SuggestionsPanel from "@/components/explore/SuggestionsPanel";
import ShareGameCard from "@/components/explore/ShareGameCard";
import TripSummary from "@/components/explore/TripSummary";
import { useActiveTrip } from "@/stores/useActiveTrip";

const ExploreTrip = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { trips } = useTrips();
  const explore = useExplore(tripId);
  const [selected, setSelected] = useState<string | null>(null);

  const trip = trips.find((t) => t.id === tripId);
  const cityNode = useMemo(() => explore.nodes.find((n) => n.level === 1) || null, [explore.nodes]);
  const selectedNode = explore.nodes.find((n) => n.id === selected) || null;
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);

  useEffect(() => {
    if (tripId && trip) {
      setActiveTrip({
        tripId,
        destination: trip.destination,
        arrivalCity: trip.arrival_city,
        departureDate: trip.departure_date,
        returnDate: trip.return_date,
      });
    }
  }, [tripId, trip, setActiveTrip]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <header className="relative border-b border-border backdrop-blur-md bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Accueil
          </Link>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Travel Map</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-6 max-w-7xl space-y-5">
        {explore.loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : explore.nodes.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <Compass className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Génère ta carte de voyage</h2>
            <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
              On va créer automatiquement les points d'intérêt à partir des recommandations IA, ton carnet et ton suivi live.
            </p>
            <Button onClick={explore.seed} disabled={explore.seeding} size="lg">
              {explore.seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Générer la carte
            </Button>
            {trip?.destination && <p className="text-xs text-muted-foreground mt-3">Destination : {trip.destination}</p>}
          </div>
        ) : (
          <>
            <ProgressHeader progress={explore.progress} cityName={cityNode?.name || trip?.destination} />
            <BadgesShowcase badges={explore.badges} nodes={explore.nodes} mediaCount={explore.media.length} />

            <div className="grid lg:grid-cols-[1fr_320px] gap-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-foreground">Carte d'exploration</h2>
                  <div className="flex gap-2">
                    <AddNodeDialog cityId={cityNode?.id || null} onAdd={(p) => explore.addNode(p)} />
                    <Button size="sm" variant="ghost" onClick={explore.seed} disabled={explore.seeding}>
                      {explore.seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Régénérer
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="map">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="map">🗺️ Carte</TabsTrigger>
                    <TabsTrigger value="replay">🚇 Replay</TabsTrigger>
                    <TabsTrigger value="summary">📖 Résumé</TabsTrigger>
                  </TabsList>
                  <TabsContent value="map" className="mt-4">
                    <ExploreMap nodes={explore.nodes} edges={explore.edges} onSelect={setSelected} />
                  </TabsContent>
                  <TabsContent value="replay" className="mt-4">
                    <ReplayMode nodes={explore.nodes} />
                  </TabsContent>
                  <TabsContent value="summary" className="mt-4">
                    {tripId && <TripSummary tripId={tripId} />}
                  </TabsContent>
                </Tabs>
              </div>

              <aside className="space-y-4">
                {tripId && <SuggestionsPanel tripId={tripId} cityNode={cityNode} onAdd={explore.addNode} />}
                <ShareGameCard
                  destination={trip?.destination || cityNode?.name}
                  progress={explore.progress}
                  badges={explore.badges}
                  nodes={explore.nodes}
                />
              </aside>
            </div>
          </>
        )}

        <NodeDetailDrawer
          node={selectedNode}
          open={!!selected}
          onClose={() => setSelected(null)}
          allNodes={explore.nodes}
          edges={explore.edges}
          media={explore.media}
          onVisit={explore.visitNode}
          onDelete={explore.deleteNode}
          onAddMedia={explore.addMedia}
          onSelectNode={setSelected}
        />
      </main>
      <QuickJump />
    </div>
  );
};

export default ExploreTrip;
