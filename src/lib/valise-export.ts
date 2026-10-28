// jspdf loaded lazily inside the exported function. Texts follow the interface language.
import i18n from "@/i18n";
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

const TRANSPORT: Record<"fr" | "en", Record<TransportMode, string>> = {
  fr: { avion: "Avion", train: "Train", voiture: "Voiture", bateau: "Bateau", velo: "Vélo" },
  en: { avion: "Plane", train: "Train", voiture: "Car", bateau: "Boat", velo: "Bike" },
};

export async function exportValisePdf(opts: ValisePdfOptions) {
  const { destination, days, mode, transport, categories } = opts;
  const en = i18n.language?.startsWith("en");
  const L = en
    ? { title: "My Xplania packing list", days: (n: number) => `${n} day${n > 1 ? "s" : ""}`, mode: "Mode", transport: "Transport", progress: (c: number, t: number, p: number) => `Progress: ${c}/${t} items (${p}%)`, file: "packing" }
    : { title: "Ma Valise Xplania", days: (n: number) => `${n} jour${n > 1 ? "s" : ""}`, mode: "Mode", transport: "Transport", progress: (c: number, t: number, p: number) => `Progression : ${c}/${t} objets (${p} %)`, file: "valise" };
  const transportLabel = TRANSPORT[en ? "en" : "fr"][transport];
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
  doc.text(L.title, margin, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${destination} • ${L.days(days)}`, margin, 32);
  doc.setFontSize(9);
  doc.text(`${L.mode} : ${mode}  |  ${L.transport} : ${transportLabel}`, margin, 40);

  y = 60;
  doc.setTextColor(30, 41, 59);

  const total = Object.values(categories).flat().length;
  const checked = Object.values(categories).flat().filter((i) => i.checked).length;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(L.progress(checked, total, total ? Math.round((checked / total) * 100) : 0), margin, y);
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
    doc.text(`Xplania • ${new Date().toLocaleDateString(en ? "en-GB" : "fr-FR")}`, margin, pageH - 8);
    doc.text(`${i} / ${pages}`, pageW - margin - 10, pageH - 8);
  }

  doc.save(`${L.file}-${destination.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
