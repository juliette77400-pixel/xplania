import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (rating: number, note: string) => void | Promise<void>;
}

const EMOJI = ["😞", "😕", "😐", "🙂", "😍"];

const MoodRatingDialog = ({ open, onOpenChange, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!rating) return;
    setSaving(true);
    try {
      await onSubmit(rating, note.trim());
      onOpenChange(false);
      setRating(null);
      setNote("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("moodComp.rating.title")}</DialogTitle>
          <DialogDescription>{t("moodComp.rating.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex justify-between gap-1">
            {EMOJI.map((e, i) => {
              const v = i + 1;
              const active = rating === v;
              return (
                <button
                  key={v}
                  onClick={() => setRating(v)}
                  className={`flex-1 aspect-square text-2xl md:text-3xl rounded-xl border transition-all ${
                    active
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-border bg-card/40 hover:border-primary/40"
                  }`}
                  aria-label={`${v}/5`}
                >
                  {e}
                </button>
              );
            })}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("moodComp.rating.notePh")}
            rows={3}
            className="w-full text-sm px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/50 focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("moodComp.rating.skip")}
            </Button>
            <Button onClick={handleSave} disabled={!rating || saving}>
              {t("moodComp.rating.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoodRatingDialog;
