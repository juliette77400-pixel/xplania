import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import type { JournalDay } from "@/hooks/useJournal";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  destination: string;
  title: string;
  cover: string | null;
  day?: JournalDay;
}

const extractText = (day?: JournalDay) => {
  if (!day) return "";
  for (const b of day.blocks) {
    const c: any = b.content || {};
    if ((b.type === "note" || b.type === "highlight") && c.text) return c.text.slice(0, 220);
  }
  return "";
};

const extractPhoto = (day?: JournalDay) => {
  if (!day) return null;
  const p = day.blocks.find((b) => b.type === "photo" && (b.content as any)?.url);
  return (p?.content as any)?.url || null;
};

const SocialShareDialog = ({ open, onOpenChange, destination, title, cover, day }: Props) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const txt = extractText(day);
  const photo = extractPhoto(day) || cover;

  const generate = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const canvas = await html2canvas(cardRef.current, { useCORS: true, backgroundColor: null, scale: 2 });
    return await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
  };

  const download = async () => {
    setBusy(true);
    try {
      const blob = await generate();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xplania-${destination || "carnet"}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("social.downloaded"));
    } catch (e) {
      toast.error(t("social.failed"));
    } finally { setBusy(false); }
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await generate();
      if (!blob) return;
      const file = new File([blob], "xplania.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: destination });
      } else {
        await download();
      }
    } catch (e) {
      // ignore cancel
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("social.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <div
            ref={cardRef}
            style={{ width: 270, height: 480 }}
            className="relative overflow-hidden rounded-2xl text-white shadow-xl"
          >
            {photo ? (
              <img src={photo} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary/60" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/85" />
            <div className="relative h-full flex flex-col justify-between p-5">
              <div className="text-[10px] tracking-[0.25em] uppercase opacity-90">Xplania · Carnet</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold leading-tight drop-shadow">{destination || title}</h2>
                {txt && <p className="text-xs leading-relaxed opacity-95 line-clamp-6 font-serif italic">"{txt}"</p>}
                <div className="text-[10px] opacity-70 pt-2">xplania.app</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t("social.download")}
          </Button>
          <Button onClick={share} disabled={busy}>
            <Share2 className="w-4 h-4" /> {t("social.share")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialShareDialog;
