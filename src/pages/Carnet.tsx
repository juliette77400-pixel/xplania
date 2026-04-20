import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import DayView from "@/components/journal/DayView";
import StoryGenerator from "@/components/journal/StoryGenerator";
import InsightsPanel from "@/components/journal/InsightsPanel";
import BadgesBar from "@/components/journal/BadgesBar";
import ShareExport from "@/components/journal/ShareExport";
import TripTracker from "@/components/tracking/TripTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickJump from "@/components/shared/QuickJump";
import { formatDayLabel } from "@/lib/journal-utils";

const Carnet = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const { journal, days, loading, refetch } = useJournal(tripId);
  const [activeIdx, setActiveIdx] = useState(0);
  const [destination, setDestination] = useState("");

  useEffect(() => {
    if (!tripId) return;
    supabase.from("trips").select("destination,arrival_city,departure_date,return_date").eq("id", tripId).maybeSingle()
      .then(({ data }) => {
        setDestination(data?.destination || "");
        if (data) {
          import("@/stores/useActiveTrip").then(({ useActiveTrip }) => {
            useActiveTrip.getState().setActiveTrip({
              tripId,
              destination: data.destination,
              arrivalCity: data.arrival_city,
              departureDate: data.departure_date,
              returnDate: data.return_date,
            });
          });
        }
      });
  }, [tripId]);

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!journal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carnet introuvable</p>
      </div>
    );
  }

  const activeDay = days[activeIdx];

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      <header className="relative border-b border-border backdrop-blur-md bg-background/60 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-foreground">{journal.title}</h1>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 max-w-6xl">
        {days.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Aucune journée créée. Vérifie les dates de ton voyage.</p>
          </div>
        ) : (
          <Tabs defaultValue="timeline">
            <TabsList className="grid grid-cols-5 max-w-3xl mx-auto mb-6">
              <TabsTrigger value="timeline">📅 Timeline</TabsTrigger>
              <TabsTrigger value="live">📡 Suivi live</TabsTrigger>
              <TabsTrigger value="story">✨ Récit IA</TabsTrigger>
              <TabsTrigger value="insights">📊 Insights</TabsTrigger>
              <TabsTrigger value="share">🔗 Partager</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <div className="grid lg:grid-cols-[280px_1fr] gap-6">
                {/* Timeline sidebar */}
                <div className="lg:sticky lg:top-24 lg:self-start space-y-1 max-h-[80vh] overflow-y-auto pr-2">
                  {days.map((d, i) => (
                    <button
                      key={d.id}
                      onClick={() => setActiveIdx(i)}
                      className={`w-full text-left p-3 rounded-xl transition relative ${
                        i === activeIdx ? "bg-primary/15 border border-primary/30" : "hover:bg-muted/50"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Jour {i + 1}</p>
                      <p className="text-sm font-medium text-foreground capitalize">{formatDayLabel(d.date)}</p>
                      {d.title && <p className="text-xs text-muted-foreground truncate mt-0.5">{d.title}</p>}
                      <div className="flex gap-1 mt-1">
                        {d.blocks.length > 0 && (
                          <span className="text-xs text-primary">{d.blocks.length} souvenir{d.blocks.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Day content */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                      disabled={activeIdx === 0}
                      className="p-2 rounded-lg disabled:opacity-30 hover:bg-muted/50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">{activeIdx + 1} / {days.length}</span>
                    <button
                      onClick={() => setActiveIdx(Math.min(days.length - 1, activeIdx + 1))}
                      disabled={activeIdx === days.length - 1}
                      className="p-2 rounded-lg disabled:opacity-30 hover:bg-muted/50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {activeDay && (
                      <motion.div
                        key={activeDay.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                      >
                        <DayView day={activeDay} journalId={journal.id} destination={destination} onChanged={refetch} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="live">
              {tripId && <TripTracker tripId={tripId} destination={destination} />}
            </TabsContent>

            <TabsContent value="story">
              <StoryGenerator
                journalId={journal.id}
                destination={destination}
                days={days}
                initialTone={journal.tone}
                onSaved={refetch}
              />
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid md:grid-cols-2 gap-6">
                <InsightsPanel days={days} />
                <BadgesBar journalId={journal.id} days={days} />
              </div>
            </TabsContent>

            <TabsContent value="share">
              <ShareExport journal={journal} days={days} destination={destination} onUpdated={refetch} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <QuickJump />
    </div>
  );
};

export default Carnet;
