import { useState } from "react";
import { Share2, Download, Globe, Lock, Copy, Check } from "lucide-react";
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

const ShareExport = ({ journal, days, destination, onUpdated }: Props) => {
  const [copied, setCopied] = useState(false);
  const publicUrl = journal.public_slug ? `${window.location.origin}/carnet/public/${journal.public_slug}` : "";

  const togglePublic = async (val: boolean) => {
    const slug = val && !journal.public_slug ? crypto.randomUUID().slice(0, 8) : journal.public_slug;
    await supabase.from("journals").update({ is_public: val, public_slug: slug }).eq("id", journal.id);
    onUpdated();
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    doc.setFontSize(22);
    doc.text(journal.title, margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(120);
    doc.text(`Voyage à ${destination}`, margin, y);
    y += 14;

    days.forEach((d) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setTextColor(20);
      doc.text(formatDayLabel(d.date), margin, y);
      y += 6;
      if (d.title) {
        doc.setFontSize(11);
        doc.setTextColor(80);
        doc.text(d.title, margin, y);
        y += 6;
      }
      doc.setFontSize(10);
      doc.setTextColor(40);
      d.blocks.forEach((b) => {
        const c = b.content || {};
        let line = "";
        if (b.type === "note") line = `• ${c.text || ""}`;
        else if (b.type === "highlight") line = `★ ${c.text || ""}`;
        else if (b.type === "location") line = `📍 ${c.name || ""}`;
        else if (b.type === "mood") line = `Humeur: ${c.emoji || ""} ${c.score ?? ""}/5`;
        else if (b.type === "photo") line = `📸 ${c.caption || "(photo)"}`;
        if (line) {
          const lines = doc.splitTextToSize(line, 180);
          if (y + lines.length * 5 > 280) { doc.addPage(); y = 20; }
          doc.text(lines, margin, y);
          y += lines.length * 5 + 1;
        }
      });
      y += 6;
    });

    doc.save(`carnet-${destination || "voyage"}.pdf`);
    toast.success("PDF généré ✅");
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Partager & exporter</h3>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2">
          {journal.is_public ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
          <span className="text-sm text-foreground">Carnet {journal.is_public ? "public" : "privé"}</span>
        </div>
        <Switch checked={journal.is_public} onCheckedChange={togglePublic} />
      </div>

      {journal.is_public && publicUrl && (
        <div className="flex gap-2">
          <input value={publicUrl} readOnly className="flex-1 px-3 py-2 rounded-lg bg-muted/30 text-xs text-foreground border border-border" />
          <Button variant="outline" size="icon" onClick={copyLink}>
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={exportPdf}>
        <Download className="w-4 h-4" /> Télécharger en PDF
      </Button>
    </div>
  );
};

export default ShareExport;
