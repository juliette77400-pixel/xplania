import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { JournalDay } from "@/hooks/useJournal";
import { formatDayLabel } from "@/lib/journal-utils";

interface Props {
  day: JournalDay;
  destination?: string;
}

const PagePdfExportButton = ({ day, destination }: Props) => {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 15;
      const pageW = 210;
      let y = 20;
      doc.setFontSize(11).setTextColor(120).text((destination || "").toUpperCase(), margin, y);
      y += 8;
      doc.setFontSize(20).setTextColor(20).text(day.title || formatDayLabel(day.date), margin, y);
      y += 8;
      doc.setFontSize(10).setTextColor(140).text(day.date, margin, y);
      y += 10;
      doc.setDrawColor(220).line(margin, y, pageW - margin, y);
      y += 8;
      doc.setFontSize(11).setTextColor(40);

      for (const b of day.blocks) {
        if (y > 270) { doc.addPage(); y = 20; }
        const c: any = b.content || {};
        let line = "";
        if (b.type === "note") line = c.text || "";
        else if (b.type === "highlight") line = `★ ${c.text || ""}`;
        else if (b.type === "location") line = `📍 ${c.name || ""}`;
        else if (b.type === "mood") line = `${c.emoji || ""}  ${c.score ?? ""}/5`;
        else if (b.type === "photo") line = `📷 ${c.caption || ""}`;
        else if (b.type === "audio") line = `🎤 ${c.caption || "(audio)"}`;
        if (line) {
          const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 5 + 4;
        }
        if (b.type === "photo" && c.url) {
          try {
            const img = await new Promise<HTMLImageElement>((res, rej) => {
              const i = new Image();
              i.crossOrigin = "anonymous";
              i.onload = () => res(i);
              i.onerror = rej;
              i.src = c.url;
            });
            if (y > 230) { doc.addPage(); y = 20; }
            const w = pageW - margin * 2;
            const h = (img.height / img.width) * w;
            doc.addImage(img, "JPEG", margin, y, w, Math.min(h, 100));
            y += Math.min(h, 100) + 6;
          } catch { /* skip */ }
        }
      }
      doc.save(`${destination || "carnet"}-${day.date}.pdf`);
      toast.success(t("pageExport.done"));
    } catch (e) {
      toast.error(t("pageExport.failed"));
    } finally { setBusy(false); }
  };

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={busy}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {t("pageExport.btn")}
    </Button>
  );
};

export default PagePdfExportButton;
