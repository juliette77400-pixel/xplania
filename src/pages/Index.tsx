import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import AppNavbar from "@/components/shared/AppNavbar";
import HeroSection from "@/components/xplania/HeroSection";
import QuestionsSection from "@/components/xplania/QuestionsSection";
import ResultSection from "@/components/xplania/ResultSection";
import Testimonials from "@/components/xplania/Testimonials";
import FaqSection from "@/components/xplania/FaqSection";
import FinalCtaSection from "@/components/xplania/FinalCtaSection";
import Footer from "@/components/xplania/Footer";
import DialogSkeleton from "@/components/shared/DialogSkeleton";


// Dialogs are only mounted when the user opens them — keep them out of the entry bundle.
const TravelFormDialog = lazy(() => import("@/components/xplania/TravelFormDialog"));
const FeedbackDialog = lazy(() => import("@/components/xplania/FeedbackDialog"));
const QuotaReachedDialog = lazy(() => import("@/components/xplania/QuotaReachedDialog"));
import { useTravelContext } from "@/contexts/TravelContext";
import { hasReachedFreeQuota } from "@/stores/usePlanStore";
import { useActiveTrip } from "@/stores/useActiveTrip";
import { FEATURE_FLAGS, PREPARATION_HOME } from "@/config/featureFlags";

const Index = () => {
  const [travelFormOpen, setTravelFormOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const { tripData, setTripData, recommendations, setRecommendations, dashboardLoading, setDashboardLoading } = useTravelContext();
  const setActiveTrip = useActiveTrip((s) => s.setActiveTrip);

  const handleCreateTrip = (source = "other") => {
    // Beta: no AI itinerary — trips are created on the preparation dashboard.
    if (!FEATURE_FLAGS.ENABLE_AI_ITINERARY) {
      track("cta_click", { cta: "prepare_departure", location: source });
      // Signed in: the dashboard sends people without a trip to the questionnaire.
      navigate(user ? PREPARATION_HOME : "/preparation");
      return;
    }
    if (hasReachedFreeQuota()) {
      setQuotaOpen(true);
      return;
    }
    setTravelFormOpen(true);
  };

  // Hero country choice: open the questionnaire with this country already filled in.
  const handlePickCountry = (code: string) => {
    track("cta_click", { cta: "prepare_departure", location: "hero_country", country: code });
    navigate(`/preparation?pays=${encodeURIComponent(code)}`);
  };

  useEffect(() => {
    if (location.hash === "#create") handleCreateTrip();
  }, [location.hash]);

  const scrollToFeedback = () => {
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      {/* legacy hidden CTA — keep handlers wired via floating button below if needed */}
      <div className="hidden">
        <button onClick={() => handleCreateTrip()}>create</button>
        <button onClick={scrollToFeedback}>fb</button>
      </div>
      <main id="main-content" tabIndex={-1}>
        {/* Student's path: want to leave → my questions → what I get → proof → FAQ → start */}
        <HeroSection onCreateTrip={() => handleCreateTrip("hero")} onPickCountry={handlePickCountry} />
        <QuestionsSection />
        <ResultSection onStart={() => handleCreateTrip("example")} />
        <Testimonials />
        <FaqSection keys={["q1", "q7", "q2", "q3", "q6"]} />
        <FinalCtaSection onCreateTrip={() => handleCreateTrip("final")} onFeedback={() => setFeedbackOpen(true)} />
        <Footer onCreateTrip={() => handleCreateTrip("footer")} />
      </main>
      {travelFormOpen && (
        <Suspense fallback={<DialogSkeleton size="lg" />}>
          <TravelFormDialog
            open={travelFormOpen}
            onOpenChange={setTravelFormOpen}
            initialPreset={undefined}
            onTripGenerated={async (data, recs) => {
              setTripData(data);
              setRecommendations(recs);
              track("itinerary_generated", { destination: data.destination });
              if (user) {
                const { data: trip, error } = await supabase
                  .from("trips")
                  .insert({
                    user_id: user.id,
                    title: t("index.tripTitle", { destination: data.destination }),
                    destination: data.destination,
                    arrival_city: data.arrivalCity,
                    departure_location: data.departureLocation,
                    departure_date: data.departureDate || null,
                    return_date: data.returnDate || null,
                    duration: data.duration ? parseInt(data.duration) : null,
                    form_data: data as any,
                    recommendations: recs as any,
                  })
                  .select("id")
                  .single();
                if (error || !trip) throw new Error(t("travelForm.saveError"));
                if (trip) {
                  track("trip_created", { trip_id: trip.id });
                  // Refresh cached trips list so the new trip shows up elsewhere.
                  queryClient.invalidateQueries({ queryKey: ["trips"] });
                  setCurrentTripId(trip.id);
                  setActiveTrip({
                    tripId: trip.id,
                    destination: data.destination,
                    arrivalCity: data.arrivalCity,
                    departureDate: data.departureDate || null,
                    returnDate: data.returnDate || null,
                  });
                }
              }
            }}
            onGenerating={setDashboardLoading}
          />
        </Suspense>
      )}
      {currentTripId && (
        <a
          href={`/carnet/${currentTripId}`}
          className="fixed bottom-6 right-6 gradient-button px-5 py-3 rounded-full text-primary-foreground font-semibold shadow-lg hover:scale-105 transition flex items-center gap-2 z-40"
        >
          {t("index.openJournal")}
        </a>
      )}
      {feedbackOpen && (
        <Suspense fallback={<DialogSkeleton size="md" />}>
          <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
        </Suspense>
      )}
      {quotaOpen && (
        <Suspense fallback={<DialogSkeleton size="sm" compact />}>
          <QuotaReachedDialog open={quotaOpen} onOpenChange={setQuotaOpen} />
        </Suspense>
      )}

    </div>
  );
};

export default Index;
