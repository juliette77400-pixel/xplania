// ✨ NEW (Tâche 3) — Export PDF "all-in-one" du voyage (résumé + itinéraire + budget + valise + visa + journal)
// jspdf loaded lazily inside exportTripAllInOnePDF.
import { supabase } from "@/integrations/supabase/client";

type TripData = {
  id: string;
  title: string | null;
  destination: string | null;
  arrival_city: string | null;
  departure_location: string | null;
  departure_date: string | null;
  return_date: string | null;
  duration: number | null;
  recommendations: any;
  form_data: any;
};

const MARGIN = 15;
const PAGE_W = 210;
const PAGE_H = 297;

function ensureSpace(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function section(doc: jsPDF, title: string, y: number): number {
  y = ensureSpace(doc, y, 15);
  doc.setFillColor(99, 102, 241);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN + 3, y + 5.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  return y + 12;
}

function paragraph(doc: jsPDF, text: string, y: number, fontSize = 10): number {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
  for (const line of lines) {
    y = ensureSpace(doc, y, 6);
    doc.text(line, MARGIN, y);
    y += fontSize * 0.45 + 1;
  }
  return y + 2;
}

function bullet(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 7);
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(`• ${text}`, PAGE_W - MARGIN * 2 - 4);
  for (const l of lines) {
    y = ensureSpace(doc, y, 5);
    doc.text(l, MARGIN + 2, y);
    y += 5;
  }
  return y + 1;
}

function safeStr(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return ""; }
}

export async function exportTripAllInOnePDF(tripId: string): Promise<void> {
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id,title,destination,arrival_city,departure_location,departure_date,return_date,duration,recommendations,form_data")
    .eq("id", tripId)
    .maybeSingle();

  if (error || !trip) throw new Error("Voyage introuvable");

  const t = trip as TripData;
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dest = t.destination || t.arrival_city || "Voyage";

  // ===== Cover =====
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Xplania", PAGE_W / 2, 60, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 200, 230);
  doc.text("Carnet de voyage complet", PAGE_W / 2, 70, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(t.title || dest, PAGE_W - 40);
  doc.text(titleLines, PAGE_W / 2, 130, { align: "center" });

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 255);
  doc.text(dest, PAGE_W / 2, 150, { align: "center" });

  if (t.departure_date || t.return_date) {
    const dates = [t.departure_date, t.return_date].filter(Boolean).join("  →  ");
    doc.text(dates, PAGE_W / 2, 160, { align: "center" });
  }
  if (t.duration) {
    doc.text(`${t.duration} jour${t.duration > 1 ? "s" : ""}`, PAGE_W / 2, 168, { align: "center" });
  }

  doc.setFontSize(9);
  doc.setTextColor(150, 170, 200);
  doc.text(`Généré le ${new Date().toLocaleDateString()}`, PAGE_W / 2, PAGE_H - 20, { align: "center" });

  // ===== Page 2+ : contenu =====
  doc.addPage();
  doc.setTextColor(0, 0, 0);
  let y = MARGIN;

  // Résumé
  y = section(doc, "Résumé du voyage", y);
  if (t.departure_location) y = paragraph(doc, `Départ : ${t.departure_location}`, y);
  if (dest) y = paragraph(doc, `Destination : ${dest}`, y);
  if (t.departure_date) y = paragraph(doc, `Du : ${t.departure_date}`, y);
  if (t.return_date) y = paragraph(doc, `Au : ${t.return_date}`, y);
  if (t.duration) y = paragraph(doc, `Durée : ${t.duration} jour(s)`, y);

  const reco = t.recommendations || {};
  const fd = t.form_data || {};

  // Itinéraire
  if (reco.itinerary || reco.itineraire || reco.days) {
    y = section(doc, "Itinéraire", y);
    const items = reco.itinerary || reco.itineraire || reco.days || [];
    if (Array.isArray(items)) {
      items.forEach((item: any, i: number) => {
        const dayTitle = item.title || item.day || `Jour ${i + 1}`;
        y = ensureSpace(doc, y, 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(safeStr(dayTitle), MARGIN, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const desc = item.description || item.activities || item.summary;
        if (Array.isArray(desc)) {
          desc.forEach((a) => { y = bullet(doc, safeStr(a), y); });
        } else if (desc) {
          y = paragraph(doc, safeStr(desc), y);
        }
      });
    } else {
      y = paragraph(doc, safeStr(items), y);
    }
  }

  // Budget
  if (reco.budget || fd.budget) {
    y = section(doc, "Budget", y);
    const b = reco.budget || fd.budget;
    if (typeof b === "object" && b !== null) {
      Object.entries(b).forEach(([k, v]) => {
        y = bullet(doc, `${k} : ${safeStr(v)}`, y);
      });
    } else {
      y = paragraph(doc, safeStr(b), y);
    }
  }

  // Valise / Checklist
  if (reco.checklist || reco.valise || reco.packing) {
    y = section(doc, "Valise & Checklist", y);
    const items = reco.checklist || reco.valise || reco.packing;
    if (Array.isArray(items)) {
      items.forEach((it: any) => { y = bullet(doc, safeStr(it.label || it.name || it), y); });
    } else if (typeof items === "object") {
      Object.entries(items).forEach(([cat, list]: any) => {
        y = ensureSpace(doc, y, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(cat, MARGIN, y); y += 5;
        doc.setFont("helvetica", "normal");
        if (Array.isArray(list)) list.forEach((it: any) => { y = bullet(doc, safeStr(it.label || it.name || it), y); });
      });
    }
  }

  // Visa / Formalités
  if (reco.visa || reco.formalities) {
    y = section(doc, "Visa & Formalités", y);
    const v = reco.visa || reco.formalities;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      Object.entries(v).forEach(([k, val]) => { y = paragraph(doc, `${k} : ${safeStr(val)}`, y); });
    } else if (Array.isArray(v)) {
      v.forEach((item: any) => { y = bullet(doc, safeStr(item), y); });
    } else {
      y = paragraph(doc, safeStr(v), y);
    }
  }

  // Journal
  const { data: journal } = await supabase
    .from("journals").select("id,title").eq("trip_id", tripId).maybeSingle();
  if (journal) {
    const { data: jdays } = await supabase
      .from("journal_days").select("id,date,title,summary,position").eq("journal_id", journal.id).order("position");
    if (jdays && jdays.length > 0) {
      y = section(doc, "Journal de voyage", y);
      for (const d of jdays) {
        y = ensureSpace(doc, y, 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${d.date}${d.title ? " — " + d.title : ""}`, MARGIN, y); y += 6;
        doc.setFont("helvetica", "normal");
        if (d.summary) y = paragraph(doc, d.summary, y);
      }
    }
  }

  // Footer pages
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Xplania · ${dest} · p.${i - 1}/${total - 1}`, PAGE_W / 2, PAGE_H - 8, { align: "center" });
  }

  const safeName = (t.title || dest).replace(/[^a-z0-9-_]/gi, "_").slice(0, 40);
  doc.save(`xplania-${safeName}.pdf`);
}
