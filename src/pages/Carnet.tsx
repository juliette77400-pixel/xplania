import { useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Loader2, Share2, RefreshCw, Sparkles, ImageDown } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import DayView from "@/components/journal/DayView";
import StoryGenerator from "@/components/journal/StoryGenerator";
import InsightsPanel from "@/components/journal/InsightsPanel";
import BadgesBar from "@/components/journal/BadgesBar";
import ShareExport from "@/components/journal/ShareExport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickJump from "@/components/shared/QuickJump";
import DeleteTripButton from "@/components/shared/DeleteTripButton";
import TripDocumentsManager from "@/components/shared/TripDocumentsManager";
import ExportTripButton from "@/components/shared/ExportTripButton";
import TripUtilitiesPanel from "@/components/shared/TripUtilitiesPanel";
import TripEndRecap from "@/components/shared/TripEndRecap";
import ShareCarnetDialog from "@/components/shared/ShareCarnetDialog";
import SocialShareDialog from "@/components/journal/SocialShareDialog";
import PagePdfExportButton from "@/components/journal/PagePdfExportButton";
import { useJournalCover } from "@/hooks/useJournalCover";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon } from "lucide-react";
import { formatDayLabel } from "@/lib/journal-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import CarnetOnboardingChat from "@/components/journal/CarnetOnboardingChat";

type CarnetSection = "timeline" | "story" | "insights" | "docs" | "share";

const Carnet = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const { journal, days, loading, refetch } = useJournal(tripId);
  const [activeIdx, setActiveIdx] = useState(0);
  const [destination, setDestination] = useState("");
  // ✨ NEW (Tâche 4) — dates pour utilities + détection fin de voyage
  const [tripMeta, setTripMeta] = useState<{ departure_date: string | null; return_date: string | null } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CarnetSection>("timeline");
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { regenerate: regenerateCover } = useJournalCover(tripId || "", destination);

  const handleRegenCover = async (mode: "unsplash" | "ai") => {
    if (!destination || regenLoading) return;
    setRegenLoading(true);
    try {
      await regenerateCover(mode);
      toast.success(t("cover.regenerated"));
    } catch {
      toast.error(t("cover.regenFail"));
    } finally {
      setRegenLoading(false);
    }
  };

  useEffect(() => {
    if (!tripId) return;
    supabase.from("trips").select("destination,arrival_city,departure_date,return_date").eq("id", tripId).maybeSingle()
      .then(({ data }) => {
        setDestination(data?.destination || "");
        setTripMeta({ departure_date: data?.departure_date || null, return_date: data?.return_date || null });
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

  // ✨ NEW (Tâche 4) — voyage terminé ?
  const isTripEnded = !!(tripMeta?.return_date && new Date(tripMeta.return_date) < new Date());

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-background" aria-busy="true" aria-label={t("common.loading")}>
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-48 sm:h-64 w-full rounded-2xl" />
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!journal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("carnet.notFound")}</p>
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
            <ArrowLeft className="w-4 h-4" /> {t("carnet.back")}
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-foreground">{journal.title}</h1>
          </div>
          {/* ✨ MODIFIED (Tâche 4) — bouton Partage + export PDF + suppression */}
          <div className="flex items-center justify-end gap-1">
            {journal && (
              <Button variant="ghost" size="sm" onClick={() => setShareOpen(true)} title={t("shareDialog.title")}>
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            {destination && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" title={t("cover.regenerate")} disabled={regenLoading}>
                    {regenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRegenCover("unsplash")}>
                    <RefreshCw className="w-4 h-4 mr-2" /> {t("cover.regenUnsplash")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRegenCover("ai")}>
                    <Sparkles className="w-4 h-4 mr-2" /> {t("cover.regenAi")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {tripId && <ExportTripButton tripId={tripId} variant="ghost" size="sm" />}
            {tripId && (
              <DeleteTripButton
                tripId={tripId}
                tripLabel={destination || journal.title}
                variant="icon"
                onDeleted={() => navigate("/carnets", { replace: true })}
              />
            )}
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-6 sm:py-8 max-w-6xl space-y-6">
        {/* ✨ NEW (Tâche 4) — Utilities (countdown / météo / devise) si voyage à venir ou en cours */}
        {!isTripEnded && tripMeta?.departure_date && (
          <TripUtilitiesPanel
            destination={destination}
            departureDate={tripMeta.departure_date}
            returnDate={tripMeta.return_date}
          />
        )}

        {/* ✨ NEW (Tâche 4) — Récap de fin de voyage */}
        {isTripEnded && (
          <TripEndRecap
            trip={{
              id: tripId!,
              title: journal.title,
              destination,
              arrival_city: null,
              departure_date: tripMeta?.departure_date || null,
              return_date: tripMeta?.return_date || null,
              duration: days.length,
              form_data: null,
              recommendations: null,
              created_at: "",
            }}
            onShare={() => setShareOpen(true)}
          />
        )}

        {days.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t("carnet.noDays")}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CarnetSection)}>
            <TabsList className="grid grid-cols-3 sm:grid-cols-5 max-w-3xl mx-auto mb-6">
              <TabsTrigger value="timeline">📖 {t("carnet.tabPages")}</TabsTrigger>
              <TabsTrigger value="story">✨ {t("carnet.tabStory")}</TabsTrigger>
              <TabsTrigger value="insights">📊 {t("carnet.tabInsights")}</TabsTrigger>
              <TabsTrigger value="docs">📎 {t("carnet.tabDocs", "Docs")}</TabsTrigger>
              <TabsTrigger value="share">🔗 {t("carnet.tabShare")}</TabsTrigger>
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
                      <p className="text-xs text-muted-foreground">{t("carnet.day", { n: i + 1 })}</p>
                      <p className="text-sm font-medium text-foreground capitalize">{formatDayLabel(d.date)}</p>
                      {d.title && <p className="text-xs text-muted-foreground truncate mt-0.5">{d.title}</p>}
                      <div className="flex gap-1 mt-1">
                        {d.blocks.length > 0 && (
                          <span className="text-xs text-primary">{d.blocks.length > 1 ? t("carnet.memoryMany", { n: d.blocks.length }) : t("carnet.memoryOne", { n: d.blocks.length })}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Day content */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
                      disabled={activeIdx === 0}
                      className="p-2 rounded-lg disabled:opacity-30 hover:bg-muted/50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">{activeIdx + 1} / {days.length}</span>
                    <div className="flex items-center gap-2">
                      {activeDay && <PagePdfExportButton day={activeDay} destination={destination} />}
                      <Button size="sm" variant="outline" onClick={() => setSocialOpen(true)}>
                        <ImageIcon className="w-4 h-4" /> {t("social.btnShort")}
                      </Button>
                      <button
                        onClick={() => setActiveIdx(Math.min(days.length - 1, activeIdx + 1))}
                        disabled={activeIdx === days.length - 1}
                        className="p-2 rounded-lg disabled:opacity-30 hover:bg-muted/50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
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
                        <DayView day={activeDay} journalId={journal.id} destination={destination} tripId={tripId} allDays={days} onChanged={refetch} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
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

            {/* ✨ NEW (Tâche 3) — Onglet Documents */}
            <TabsContent value="docs">
              {tripId && <TripDocumentsManager tripId={tripId} days={days} />}
            </TabsContent>

            <TabsContent value="share">
              <ShareExport journal={journal} days={days} destination={destination} onUpdated={refetch} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      {/* ✨ NEW (Tâche 4) — Dialog de partage avec QR + OG */}
      {journal && (
        <ShareCarnetDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          journalId={journal.id}
          isPublic={journal.is_public}
          publicSlug={journal.public_slug}
          title={journal.title}
          destination={destination}
          onUpdated={refetch}
        />
      )}
      <SocialShareDialogWrapper
        open={socialOpen}
        onOpenChange={setSocialOpen}
        tripId={tripId!}
        destination={destination}
        title={journal.title}
        day={activeDay}
      />
      <CarnetOnboardingChat
        tripId={tripId!}
        journalId={journal.id}
        journalTitle={journal.title}
        destination={destination}
        days={days}
        activeSection={activeTab}
        activeDay={activeDay}
        hasStory={false}
        isPublic={!!journal?.is_public}
        tripEnded={isTripEnded}
        departureDate={tripMeta?.departure_date || null}
        returnDate={tripMeta?.return_date || null}
        onSuggestFocus={(s) => setActiveTab(s)}
        onChanged={refetch}
      />
      <QuickJump />
    </div>
  );
};

export default Carnet;

// Small wrapper to inject the journal cover into SocialShareDialog without prop drilling above
const SocialShareDialogWrapper = ({ open, onOpenChange, tripId, destination, title, day }: any) => {
  const { cover } = useJournalCover(tripId, destination);
  return (
    <SocialShareDialog
      open={open}
      onOpenChange={onOpenChange}
      destination={destination}
      title={title}
      cover={cover}
      day={day}
    />
  );
};
