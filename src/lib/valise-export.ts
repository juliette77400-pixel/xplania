// jspdf loaded lazily inside the exported function.
import type { ChecklistItem } from "@/components/valise/ChecklistSection";
import type { LuggageMode } from "@/components/valise/LuggageModes";
import type { TransportMode } from "@/components/valise/TransportSelector";

interface ValisePdfOptions {
  destination: string;
  days: number;
  mode: LuggageMode;
  transport: TransportMode;
  categories: Record<string, ChecklistItem[]>;
}

const transportEmoji: Record<TransportMode, string> = {
  avion: "Avion",
  train: "Train",
  voiture: "Voiture",
  bateau: "Bateau",
};

export async function exportValisePdf(opts: ValisePdfOptions) {
  const { destination, days, mode, transport, categories } = opts;
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // Cover header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 50, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Ma Valise Xplania", margin, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${destination} • ${days} jour${days > 1 ? "s" : ""}`, margin, 32);
  doc.setFontSize(9);
  doc.text(`Mode : ${mode}  |  Transport : ${transportEmoji[transport]}`, margin, 40);

  y = 60;
  doc.setTextColor(30, 41, 59);

  const total = Object.values(categories).flat().length;
  const checked = Object.values(categories).flat().filter((i) => i.checked).length;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Progression : ${checked}/${total} objets (${total ? Math.round((checked / total) * 100) : 0}%)`, margin, y);
  y += 10;

  Object.entries(categories).forEach(([cat, items]) => {
    if (y > pageH - 30) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 5, pageW - margin * 2, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(cat, margin + 2, y + 1);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    items.forEach((it) => {
      if (y > pageH - 20) {
        doc.addPage();
        y = margin;
      }
      const box = it.checked ? "[x]" : "[ ]";
      doc.setTextColor(it.checked ? 22 : 71, it.checked ? 163 : 85, it.checked ? 74 : 105);
      doc.text(`${box} ${it.name}`, margin + 4, y);
      if (it.description) {
        y += 4;
        doc.setTextColor(120, 120, 130);
        doc.setFontSize(8);
        doc.text(`    ${it.description}`, margin + 4, y);
        doc.setFontSize(10);
      }
      y += 6;
    });
    y += 3;
  });

  // Footer
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 160);
    doc.text(`Xplania • ${new Date().toLocaleDateString("fr-FR")}`, margin, pageH - 8);
    doc.text(`${i} / ${pages}`, pageW - margin - 10, pageH - 8);
  }

  doc.save(`valise-${destination.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
