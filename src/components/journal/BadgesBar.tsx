import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BADGES } from "@/lib/journal-utils";
import type { JournalDay } from "@/hooks/useJournal";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  journalId: string;
  days: JournalDay[];
}

const BadgesBar = ({ journalId, days }: Props) => {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("journal_badges").select("code").eq("user_id", user.id).eq("journal_id", journalId).then(({ data }) => {
      setUnlocked((data || []).map((b: any) => b.code));
    });
  }, [user, journalId]);

  useEffect(() => {
    if (!user) return;
    const counts = { note: 0, photo: 0, location: 0, mood: 0, highlight: 0 } as Record<string, number>;
    for (const d of days) for (const b of d.blocks) counts[b.type] = (counts[b.type] || 0) + 1;

    const checks: { code: string; label: string; ok: boolean }[] = [
      { code: "explorer", label: BADGES.explorer.label, ok: counts.location >= 3 },
      { code: "storyteller", label: BADGES.storyteller.label, ok: counts.note >= 5 },
      { code: "photographer", label: BADGES.photographer.label, ok: counts.photo >= 10 },
      { code: "emotional", label: BADGES.emotional.label, ok: counts.mood >= 5 },
      { code: "highlight", label: BADGES.highlight.label, ok: counts.highlight >= 3 },
    ];

    for (const c of checks) {
      if (c.ok && !unlocked.includes(c.code)) {
        supabase.from("journal_badges").insert({ user_id: user.id, journal_id: journalId, code: c.code, label: c.label }).then(({ error }) => {
          if (!error) {
            setUnlocked((u) => [...u, c.code]);
            toast.success(`Badge débloqué : ${c.label}`);
          }
        });
      }
    }
  }, [days, user, journalId, unlocked]);

  const all = Object.values(BADGES);
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Badges</h3>
        <span className="text-xs text-muted-foreground">({unlocked.length}/{all.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {all.map((b) => {
          const isUnlocked = unlocked.includes(b.code);
          return (
            <motion.div
              key={b.code}
              initial={isUnlocked ? { scale: 0.8 } : false}
              animate={{ scale: 1 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${isUnlocked ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground opacity-50"}`}
              title={b.trigger}
            >
              {b.label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesBar;
