import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Download, Globe, Lock, Copy, Check, Mail, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import jsPDF from "jspdf";
import { toast } from "sonner";
import type { Journal, JournalDay } from "@/hooks/useJournal";
import { formatDayLabel } from "@/lib/journal-utils";

interface Props {
  journal: Journal;
  days: JournalDay[];
  destination: string;
  onUpdated: () => void;
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

const ShareExport = ({ journal, days, destination, onUpdated }: Props) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(true);
  const publicUrl = journal.public_slug ? `${window.location.origin}/carnet/public/${journal.public_slug}` : "";

  const togglePublic = async (val: boolean) => {
    const slug = val && !journal.public_slug ? crypto.randomUUID().slice(0, 8) : journal.public_slug;
    await supabase.from("journals").update({ is_public: val, public_slug: slug }).eq("id", journal.id);
    onUpdated();
    toast.success(val ? t("j2.publishedToast") : t("j2.privateToast"));
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success(t("j2.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Mon carnet de voyage — ${destination || journal.title}`);
    const body = encodeURIComponent(
      `Salut !\n\nJ'ai envie de partager avec toi mon carnet de voyage${destination ? ` à ${destination}` : ""}.\n\nDécouvre-le ici : ${publicUrl || "(lien à activer)"}\n\nÀ très vite !`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareNative = async () => {
    if (!publicUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: journal.title, text: `Mon carnet de voyage à ${destination}`, url: publicUrl });
      } catch {/* cancelled */}
    } else {
      copyLink();
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = 20;

      // Cover
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 80, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.text(journal.title, margin, 40);
      doc.setFontSize(13);
      doc.setTextColor(180, 200, 220);
      doc.text(`Voyage à ${destination || ""}`, margin, 50);
      doc.setFontSize(10);
      doc.text(`${days.length} jour${days.length > 1 ? "s" : ""} de souvenirs`, margin, 58);
      y = 100;
      doc.setTextColor(20, 20, 20);

      for (const d of days) {
        if (y > pageH - 30) { doc.addPage(); y = 20; }

        // Day header
        doc.setFillColor(238, 244, 255);
        doc.rect(margin - 2, y - 6, contentW + 4, 12, "F");
        doc.setFontSize(13);
        doc.setTextColor(30, 64, 175);
        doc.text(formatDayLabel(d.date), margin, y + 2);
        y += 10;
        if (d.title) {
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);
          doc.text(d.title, margin, y);
          y += 6;
        }
        doc.setTextColor(40, 40, 40);

        for (const b of d.blocks) {
          const c: any = b.content || {};

          // Photo block (with image)
          if (b.type === "photo" && includePhotos && c.url) {
            try {
              const img = await loadImage(c.url);
              const imgW = Math.min(contentW, 120);
              const imgH = Math.min((img.height / img.width) * imgW, 80);
              if (y + imgH > pageH - 20) { doc.addPage(); y = 20; }
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              canvas.getContext("2d")?.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
              doc.addImage(dataUrl, "JPEG", margin, y, imgW, imgH);
              y += imgH + 2;
              if (c.caption) {
                doc.setFontSize(9);
                doc.setTextColor(120, 120, 120);
                doc.text(c.caption, margin, y);
                y += 5;
                doc.setTextColor(40, 40, 40);
              }
              y += 4;
              continue;
            } catch {
              // fallback to text
            }
          }

          // Text-based blocks
          let line = "";
          if (b.type === "note") line = c.text || "";
          else if (b.type === "highlight") line = `★ ${c.text || ""}`;
          else if (b.type === "location") line = `📍 ${c.name || ""}`;
          else if (b.type === "mood") line = `Humeur: ${c.emoji || ""} ${c.score ?? ""}/5`;
          else if (b.type === "photo") line = `📸 ${c.caption || "(photo)"}`;
          if (line) {
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(line, contentW);
            if (y + lines.length * 5 > pageH - 20) { doc.addPage(); y = 20; }
            doc.text(lines, margin, y);
            y += lines.length * 5 + 2;
          }
        }
        y += 8;
      }

      // Footer last page
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`Carnet généré avec Xplania · ${new Date().toLocaleDateString("fr-FR")}`, margin, pageH - 10);

      doc.save(`carnet-${(destination || "voyage").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      toast.success(t("j2.pdfReady"));
    } catch (e: any) {
      toast.error(t("j2.pdfError"));
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">{t("j2.shareTitle")}</h3>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2">
            {journal.is_public ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="text-sm text-foreground font-medium">{journal.is_public ? t("j2.carnetPublic") : t("j2.carnetPrivate")}</p>
              <p className="text-xs text-muted-foreground">{journal.is_public ? t("j2.publicHint") : t("j2.privateHint")}</p>
            </div>
          </div>
          <Switch checked={journal.is_public} onCheckedChange={togglePublic} />
        </div>

        {journal.is_public && publicUrl && (
          <>
            <div className="flex gap-2">
              <input value={publicUrl} readOnly className="flex-1 px-3 py-2 rounded-lg bg-muted/30 text-xs text-foreground border border-border" />
              <Button variant="outline" size="icon" onClick={copyLink} title={t("j2.linkCopy")}>
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={shareEmail}>
                <Mail className="w-4 h-4" /> {t("j2.sendEmail")}
              </Button>
              <Button variant="outline" onClick={shareNative}>
                <Share2 className="w-4 h-4" /> {t("j2.shareDots")}
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Exporter en PDF</h3>
        </div>
        <p className="text-sm text-muted-foreground">Crée un livre souvenir de ton voyage, prêt à imprimer ou à archiver.</p>

        <label className="flex items-center justify-between p-3 rounded-xl bg-muted/30 cursor-pointer">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm text-foreground font-medium">{t("j2.includePhotos")}</p>
              <p className="text-xs text-muted-foreground">{t("j2.photosHint")}</p>
            </div>
          </div>
          <Switch checked={includePhotos} onCheckedChange={setIncludePhotos} />
        </label>

        <Button className="w-full" onClick={exportPdf} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? t("j2.generating") : t("j2.downloadPdf")}
        </Button>
      </div>
    </div>
  );
};

export default ShareExport;
