// jspdf loaded lazily inside exportListToPDF.
import type { Place } from "@/hooks/useDiscover";

interface ListExport {
  name: string;
  emoji?: string | null;
  places: Place[];
}

export async function exportListToPDF(list: ListExport) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Cover header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${list.emoji || "📍"} ${list.name}`, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${list.places.length} lieu${list.places.length > 1 ? "x" : ""} sauvegardé${list.places.length > 1 ? "s" : ""}`, margin, 28);
  doc.setFontSize(9);
  doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")} • Xplania`, margin, 34);

  y = 50;
  doc.setTextColor(20, 20, 20);

  list.places.forEach((p, i) => {
    if (y > pageH - 40) {
      doc.addPage();
      y = margin;
    }
    // Card
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y, pageW - margin * 2, 32, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(`${i + 1}. ${truncate(p.name, 60)}`, margin + 4, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    const meta = [p.category, p.distance_km ? `${p.distance_km.toFixed(1)} km` : null, p.rating_avg ? `★ ${p.rating_avg.toFixed(1)}` : null]
      .filter(Boolean)
      .join(" • ");
    doc.text(meta, margin + 4, y + 13);

    if (p.address) {
      doc.setFontSize(8);
      doc.text(truncate(p.address, 90), margin + 4, y + 19);
    }
    if (p.why_fits || p.description) {
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      const text = doc.splitTextToSize(truncate(p.why_fits || p.description || "", 200), pageW - margin * 2 - 8);
      doc.text(text.slice(0, 2), margin + 4, y + 25);
    }
    y += 36;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Xplania • ${i}/${pageCount}`, pageW / 2, pageH - 8, { align: "center" });
  }

  doc.save(`xplania-${slug(list.name)}.pdf`);
}

export function buildListEmailBody(list: ListExport) {
  const lines = list.places.map((p, i) => {
    const url = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`;
    return `${i + 1}. ${p.name}${p.address ? ` — ${p.address}` : ""}\n   📍 ${url}`;
  });
  return [
    `Ma liste "${list.name}" sur Xplania`,
    "",
    `${list.places.length} lieu${list.places.length > 1 ? "x" : ""} à découvrir :`,
    "",
    ...lines,
    "",
    "— Envoyé depuis Xplania",
  ].join("\n");
}

export function shareListByEmail(list: ListExport) {
  const subject = `Ma liste Xplania : ${list.name}`;
  const body = buildListEmailBody(list);
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function shareListNative(list: ListExport): Promise<boolean> {
  const text = buildListEmailBody(list);
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: `Liste Xplania : ${list.name}`, text });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function copyListToClipboard(list: ListExport) {
  const text = buildListEmailBody(list);
  await navigator.clipboard.writeText(text);
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
