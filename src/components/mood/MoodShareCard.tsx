import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { Share2, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { moodByKey } from "@/lib/moods";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mood: string | null;
  placesCount: number;
  topPlaceName?: string | null;
  city?: string | null;
}

/**
 * Generates story (9:16) and square (1:1) shareable images from the current
 * mood + recommendation. Uses Web Share API when available, falls back to download.
 */
const MoodShareCard = ({ open, onOpenChange, mood, placesCount, topPlaceName, city }: Props) => {
  const { t } = useTranslation();
  const storyRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState<"story" | "square">("story");
  const m = mood ? moodByKey(mood) : null;
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<"cosmos" | "aurora" | "sunset">("cosmos");

  const exportNode = async (node: HTMLDivElement | null): Promise<Blob | null> => {
    if (!node) return null;
    const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const node = format === "story" ? storyRef.current : squareRef.current;
      const blob = await exportNode(node);
      if (!blob) throw new Error("export_failed");
      const file = new File([blob], `mood-${mood ?? "moment"}-${format}.png`, { type: "image/png" });
      const shareData: ShareData = {
        title: t("moodComp.share.title"),
        text: `${m?.emoji ?? "🎭"} ${message.trim() || m?.label || ""} — https://xplania.app`,
        files: [file],
      };
      if (typeof navigator !== "undefined" && (navigator as any).canShare?.({ files: [file] })) {
        await (navigator as any).share(shareData);
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("moodComp.share.downloaded"));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error(t("moodComp.share.error"));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const node = format === "story" ? storyRef.current : squareRef.current;
      const blob = await exportNode(node);
      if (!blob) throw new Error("export_failed");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mood-${mood ?? "moment"}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("moodComp.share.downloaded"));
    } catch (e) {
      console.error(e);
      toast.error(t("moodComp.share.error"));
    } finally {
      setBusy(false);
    }
  };

  const THEMES = {
    cosmos: "linear-gradient(160deg, hsl(230 60% 12%) 0%, hsl(265 70% 30%) 55%, hsl(190 85% 40%) 100%)",
    aurora: "linear-gradient(160deg, hsl(190 90% 35%) 0%, hsl(220 70% 25%) 60%, hsl(280 70% 35%) 100%)",
    sunset: "linear-gradient(160deg, hsl(330 70% 40%) 0%, hsl(275 65% 30%) 60%, hsl(230 60% 15%) 100%)",
  } as const;
  const renderCard = (ref: React.RefObject<HTMLDivElement>, w: number, h: number, big: boolean) => (
    <div ref={ref} style={{ width: w, height: h, background: THEMES[theme], fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="relative overflow-hidden rounded-2xl text-white shadow-xl">
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(1px 1px at 20% 30%, #fff8, transparent), radial-gradient(1px 1px at 70% 15%, #fff9, transparent), radial-gradient(1.5px 1.5px at 85% 60%, #fff7, transparent), radial-gradient(1px 1px at 35% 80%, #fff8, transparent)" }} />
      <div className="relative flex h-full flex-col justify-between p-7">
        <div className="flex items-start justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">Xplania · Mood</div>
          {city && <div className="rounded-full bg-white/15 px-3 py-1 text-xs">📍 {city}</div>}
        </div>
        <div className="space-y-3 text-center">
          <div className={big ? "text-8xl" : "text-6xl"}>{m?.emoji ?? "🎭"}</div>
          <div className="text-3xl font-extrabold">{m?.label ?? t("moodComp.share.title")}</div>
          {message.trim() ? (
            <div className="mx-auto max-w-[90%] text-lg italic leading-snug">« {message.trim()} »</div>
          ) : (
            <div className="text-base opacity-90">{m?.description}</div>
          )}
        </div>
        <div className="space-y-2 rounded-xl bg-black/25 p-3 backdrop-blur">
          {topPlaceName && <div className="line-clamp-2 text-sm font-medium">✨ {topPlaceName}</div>}
          <div className="flex items-center justify-between text-xs opacity-80">
            <span>{placesCount} {t("moodComp.share.placesFound")}</span>
            <span className="font-semibold">xplania.app</span>
          </div>
        </div>
      </div>
    </div>
  );
  const StoryCard = renderCard(storyRef, 360, 640, true);
  const SquareCard = renderCard(squareRef, 480, 480, false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> {t("moodComp.share.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Input value={message} maxLength={80} onChange={(e) => setMessage(e.target.value)}
            placeholder={t("moodComp.share.messagePh")} aria-label={t("moodComp.share.messagePh")} />
          <div className="flex gap-2">
            {(["cosmos", "aurora", "sunset"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTheme(k)} aria-label={k}
                className={`h-8 w-8 rounded-full border-2 ${theme === k ? "border-primary" : "border-transparent"}`}
                style={{ background: THEMES[k] }} />
            ))}
          </div>
        </div>

        <Tabs value={format} onValueChange={(v) => setFormat(v as "story" | "square")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="story">{t("moodComp.share.story")} (9:16)</TabsTrigger>
            <TabsTrigger value="square">{t("moodComp.share.square")} (1:1)</TabsTrigger>
          </TabsList>

          <TabsContent value="story" className="flex justify-center pt-4">
            <div className="origin-top scale-[0.6] sm:scale-75">{StoryCard}</div>
          </TabsContent>
          <TabsContent value="square" className="flex justify-center pt-4">
            <div className="origin-top scale-[0.6] sm:scale-75">{SquareCard}</div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={handleShare} disabled={busy} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" /> {t("moodComp.share.shareBtn")}
          </Button>
          <Button onClick={handleDownload} disabled={busy} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" /> {t("moodComp.share.downloadBtn")}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="ghost" size="icon" aria-label="close">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoodShareCard;
