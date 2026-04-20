import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildDateRange } from "@/lib/journal-utils";

export interface JournalDay {
  id: string;
  date: string;
  title: string | null;
  summary: string | null;
  weather: any;
  position: number;
  blocks: JournalBlock[];
}

export interface JournalBlock {
  id: string;
  day_id: string;
  type: string;
  content: any;
  position: number;
}

export interface Journal {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  cover_url: string | null;
  tone: string;
  is_public: boolean;
  public_slug: string | null;
}

interface UseJournalResult {
  journal: Journal | null;
  days: JournalDay[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useJournal = (tripId: string | undefined): UseJournalResult => {
  const { user } = useAuth();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [days, setDays] = useState<JournalDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJournal = useCallback(async () => {
    if (!tripId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch trip to know dates
    const { data: trip } = await supabase
      .from("trips")
      .select("departure_date, return_date, destination")
      .eq("id", tripId)
      .maybeSingle();

    // Find or create journal
    let { data: j } = await supabase
      .from("journals")
      .select("*")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!j) {
      const { data: created } = await supabase
        .from("journals")
        .insert({
          trip_id: tripId,
          user_id: user.id,
          title: trip?.destination ? `Carnet — ${trip.destination}` : "Mon carnet",
        })
        .select("*")
        .single();
      j = created;
    }

    if (!j) {
      setLoading(false);
      return;
    }
    setJournal(j as Journal);

    // Auto-create days from trip dates if missing
    const { data: existingDays } = await supabase
      .from("journal_days")
      .select("*")
      .eq("journal_id", j.id)
      .order("date", { ascending: true });

    let allDays = existingDays || [];

    if (allDays.length === 0 && trip?.departure_date) {
      const range = buildDateRange(trip.departure_date, trip.return_date);
      if (range.length) {
        const inserts = range.map((date, i) => ({
          journal_id: j!.id,
          user_id: user.id,
          date,
          position: i,
        }));
        const { data: newDays } = await supabase.from("journal_days").insert(inserts).select("*");
        allDays = newDays || [];
      }
    }

    // Fetch blocks for all days
    const dayIds = allDays.map((d) => d.id);
    const { data: blocks } = dayIds.length
      ? await supabase
          .from("journal_blocks")
          .select("*")
          .in("day_id", dayIds)
          .order("position", { ascending: true })
      : { data: [] };

    const merged: JournalDay[] = allDays.map((d) => ({
      id: d.id,
      date: d.date,
      title: d.title,
      summary: d.summary,
      weather: d.weather,
      position: d.position,
      blocks: (blocks || []).filter((b) => b.day_id === d.id) as JournalBlock[],
    }));

    setDays(merged);
    setLoading(false);
  }, [tripId, user]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  return { journal, days, loading, refetch: fetchJournal };
};
