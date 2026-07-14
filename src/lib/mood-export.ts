// jspdf loaded lazily inside exportMoodFavoritesPDF.
import type { MoodFavorite } from "@/hooks/useMoodExplorer";
import { moodByKey } from "./moods";

export async function exportMoodFavoritesPDF(favorites: MoodFavorite[]) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header
  doc.setFillColor(20, 24, 40);
  doc.rect(0, 0, pageW, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("💖 Mes lieux Mood Explorer", margin, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${favorites.length} favori${favorites.length > 1 ? "s" : ""}`, margin, 30);
  doc.setFontSize(9);
  doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")} • Xplania`, margin, 36);

  let y = 52;
  doc.setTextColor(20, 20, 20);

  favorites.forEach((f, i) => {
    const p = f.place;
    if (!p) return;
    if (y > pageH - 50) {
      doc.addPage();
      y = margin;
    }
    const m = moodByKey(p.mood);

    doc.setFillColor(248, 248, 252);
    doc.roundedRect(margin, y, pageW - margin * 2, 38, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(`${i + 1}. ${truncate(p.name, 55)}`, margin + 4, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 110);
    const meta = [
      m ? `${m.emoji} ${m.label}` : p.mood,
      p.category,
      p.distance_km ? `${p.distance_km.toFixed(1)} km` : null,
      p.hidden_gem ? "💎 Hidden gem" : null,
    ].filter(Boolean).join(" • ");
    doc.text(meta, margin + 4, y + 14);

    if (p.why_fits) {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 70);
      doc.setFont("helvetica", "italic");
      const why = doc.splitTextToSize(`"${truncate(p.why_fits, 200)}"`, pageW - margin * 2 - 8);
      doc.text(why.slice(0, 2), margin + 4, y + 21);
    }
    if (p.tips) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 100, 30);
      doc.text(`💡 ${truncate(p.tips, 110)}`, margin + 4, y + 33);
    }
    y += 42;
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Xplania Mood Explorer • ${i}/${pages}`, pageW / 2, pageH - 8, { align: "center" });
  }

  doc.save(`xplania-mood-favoris-${Date.now()}.pdf`);
}

export function buildMoodFavoritesEmailBody(favorites: MoodFavorite[]) {
  const lines = favorites
    .map((f, i) => {
      const p = f.place;
      if (!p) return null;
      const m = moodByKey(p.mood);
      const url = p.lat && p.lng
        ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`;
      return `${i + 1}. ${m?.emoji || ""} ${p.name}${p.category ? ` (${p.category})` : ""}\n   "${p.why_fits}"\n   📍 ${url}`;
    })
    .filter(Boolean);

  return [
    `Mes lieux Mood Explorer 💖`,
    "",
    `${favorites.length} lieu${favorites.length > 1 ? "x" : ""} sauvegardé${favorites.length > 1 ? "s" : ""} :`,
    "",
    ...lines,
    "",
    "— Envoyé depuis Xplania",
  ].join("\n");
}

export function shareMoodFavoritesByEmail(favorites: MoodFavorite[]) {
  const body = buildMoodFavoritesEmailBody(favorites);
  window.location.href = `mailto:?subject=${encodeURIComponent("Mes lieux Mood Explorer")}&body=${encodeURIComponent(body)}`;
}

export async function shareMoodFavoritesNative(favorites: MoodFavorite[]): Promise<boolean> {
  const text = buildMoodFavoritesEmailBody(favorites);
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: "Mes lieux Mood Explorer", text });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
