import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toPng } from "html-to-image";
import { Share2, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
        text: `${m?.emoji ?? "🎭"} ${m?.label ?? ""} — Xplania`,
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

  const StoryCard = (
    <div
      ref={storyRef}
      style={{ width: 360, height: 640 }}
      className="rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl"
    >
      <div
        className="absolute inset-0 -z-10 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, hsl(255 70% 25%) 0%, hsl(200 80% 30%) 50%, hsl(280 70% 35%) 100%)",
        }}
      />
      <div className="relative h-full flex flex-col justify-between rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(135deg, hsl(255 70% 25%) 0%, hsl(200 80% 30%) 50%, hsl(280 70% 35%) 100%)",
          width: 360 - 0, height: 640 - 0
        }}
      >
        <div>
          <div className="text-xs uppercase tracking-widest opacity-75">Xplania · Mood Explorer</div>
          {city && <div className="text-sm mt-1 opacity-90">{city}</div>}
        </div>
        <div className="text-center space-y-3">
          <div className="text-7xl">{m?.emoji ?? "🎭"}</div>
          <div className="text-3xl font-bold">{m?.label ?? "Mon moment"}</div>
          <div className="text-base opacity-90">{m?.description}</div>
        </div>
        <div className="space-y-2">
          {topPlaceName && (
            <div className="text-sm opacity-90 line-clamp-2">📍 {topPlaceName}</div>
          )}
          <div className="text-xs opacity-75">
            {placesCount} {t("moodComp.share.placesFound")}
          </div>
          <div className="pt-2 text-[11px] opacity-70">xplania.lovable.app</div>
        </div>
      </div>
    </div>
  );

  const SquareCard = (
    <div
      ref={squareRef}
      style={{ width: 480, height: 480 }}
      className="rounded-2xl text-white shadow-xl overflow-hidden"
    >
      <div
        className="w-full h-full p-8 flex flex-col justify-between"
        style={{
          background:
            "linear-gradient(135deg, hsl(255 70% 25%) 0%, hsl(200 80% 30%) 50%, hsl(280 70% 35%) 100%)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-75">Xplania</div>
            <div className="text-sm opacity-90">Mood Explorer</div>
          </div>
          {city && <div className="text-xs opacity-80 text-right">{city}</div>}
        </div>
        <div className="text-center space-y-2">
          <div className="text-6xl">{m?.emoji ?? "🎭"}</div>
          <div className="text-3xl font-bold">{m?.label ?? "Mon moment"}</div>
          <div className="text-sm opacity-90">{m?.description}</div>
        </div>
        <div className="space-y-1">
          {topPlaceName && <div className="text-sm opacity-90 line-clamp-1">📍 {topPlaceName}</div>}
          <div className="text-xs opacity-70">{placesCount} {t("moodComp.share.placesFound")} · xplania.lovable.app</div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" /> {t("moodComp.share.title")}
          </DialogTitle>
        </DialogHeader>

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
