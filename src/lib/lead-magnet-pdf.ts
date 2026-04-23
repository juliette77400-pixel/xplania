import jsPDF from "jspdf";
import i18n from "@/i18n";

/**
 * Generates a "Ultimate pre-departure checklist" PDF lead magnet.
 * Returns a Blob that can be downloaded or attached.
 */
export function generateChecklistPdf(): Blob {
  const isFr = (i18n.language || "fr").startsWith("fr");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header band
  doc.setFillColor(20, 184, 166); // teal-ish primary
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Xplania", margin, 50);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    isFr ? "Checklist ultime avant départ" : "Ultimate pre-departure checklist",
    margin,
    72
  );

  y = 130;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    isFr ? "Tout ce qu'il faut vérifier avant de partir" : "Everything to check before you go",
    margin,
    y
  );
  y += 24;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const intro = isFr
    ? "Imprime ou garde sur ton téléphone. Coche au fur et à mesure. Tu pars l'esprit léger."
    : "Print it or keep it on your phone. Tick as you go. Travel with peace of mind.";
  doc.text(intro, margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 30;

  type Section = { title: string; items: string[] };
  const sections: Section[] = isFr
    ? [
        {
          title: "📄 Documents",
          items: [
            "Passeport valide (6 mois après le retour)",
            "Visa si requis (vérifie les délais)",
            "Permis international si conduite",
            "Photocopies des documents (cloud + papier)",
            "Carte d'assurance voyage / européenne",
            "Réservations (vols, hôtels, transferts)",
          ],
        },
        {
          title: "💳 Argent & administratif",
          items: [
            "Préviens ta banque du voyage",
            "Carte sans frais à l'étranger",
            "Cash en monnaie locale (petit montant)",
            "Application de conversion installée",
            "Numéros d'urgence (banque, ambassade)",
          ],
        },
        {
          title: "💊 Santé",
          items: [
            "Vaccins à jour selon la destination",
            "Trousse à pharmacie de base",
            "Ordonnances (originales + traduction)",
            "Crème solaire & anti-moustique",
            "Assurance santé internationale",
          ],
        },
        {
          title: "🎒 Valise essentielle",
          items: [
            "Adaptateur de prise universel",
            "Batterie externe + câbles",
            "Vêtements adaptés à la météo",
            "Chaussures confortables rodées",
            "Sac de jour léger",
            "Trousse de toilette format cabine",
          ],
        },
        {
          title: "🏠 Avant de quitter la maison",
          items: [
            "Couper l'eau, le gaz, débrancher les appareils",
            "Vider le frigo",
            "Prévenir un voisin ou un proche",
            "Sortir les poubelles",
            "Nourrir les plantes / animaux",
          ],
        },
      ]
    : [
        {
          title: "📄 Documents",
          items: [
            "Valid passport (6 months past return date)",
            "Visa if required (check timelines)",
            "International driving permit if driving",
            "Copies of documents (cloud + paper)",
            "Travel / health insurance card",
            "Bookings (flights, hotels, transfers)",
          ],
        },
        {
          title: "💳 Money & admin",
          items: [
            "Notify your bank about the trip",
            "Card with no foreign transaction fees",
            "Local currency cash (small amount)",
            "Currency conversion app installed",
            "Emergency numbers (bank, embassy)",
          ],
        },
        {
          title: "💊 Health",
          items: [
            "Vaccinations up to date for destination",
            "Basic first-aid kit",
            "Prescriptions (originals + translation)",
            "Sunscreen & insect repellent",
            "International health insurance",
          ],
        },
        {
          title: "🎒 Suitcase essentials",
          items: [
            "Universal power adapter",
            "Power bank + cables",
            "Weather-appropriate clothing",
            "Comfortable broken-in shoes",
            "Light daypack",
            "Cabin-size toiletries",
          ],
        },
        {
          title: "🏠 Before leaving home",
          items: [
            "Turn off water, gas, unplug appliances",
            "Empty the fridge",
            "Notify a neighbor or relative",
            "Take out the trash",
            "Plants / pets covered",
          ],
        },
      ];

  const newPageIfNeeded = (h: number) => {
    if (y + h > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = margin;
    }
  };

  for (const section of sections) {
    newPageIfNeeded(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 184, 166);
    doc.text(section.title, margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    for (const item of section.items) {
      newPageIfNeeded(20);
      doc.rect(margin, y - 9, 10, 10);
      doc.text(item, margin + 18, y, { maxWidth: pageWidth - margin * 2 - 20 });
      y += 18;
    }
    y += 10;
  }

  // Footer on last page
  newPageIfNeeded(60);
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    isFr
      ? "Offert par Xplania — l'app qui prépare tes voyages de A à Z."
      : "Brought to you by Xplania — the app that plans your trips end-to-end.",
    margin,
    y
  );
  doc.text("https://xplania.lovable.app", margin, y + 14);

  return doc.output("blob");
}

export function downloadChecklistPdf() {
  const blob = generateChecklistPdf();
  const url = URL.createObjectURL(blob);
  const isFr = (i18n.language || "fr").startsWith("fr");
  const filename = isFr
    ? "xplania-checklist-avant-depart.pdf"
    : "xplania-pre-departure-checklist.pdf";
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
