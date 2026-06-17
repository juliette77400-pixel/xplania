import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { BudgetCategory } from "@/components/budget/BudgetForecast";
import type { Expense } from "@/components/budget/AddExpenseForm";
import type { TravelFormData } from "@/types/travel";

interface ExportBudgetPdfArgs {
  destination: string;
  tripData?: TravelFormData | null;
  days: number;
  travelers: number;
  totalBudget: number;
  categories: BudgetCategory[];
  expenses: Expense[];
  locale: "fr" | "en";
  tips?: string[];
  chartElement?: HTMLElement | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

export async function exportBudgetPdf({
  destination,
  tripData,
  days,
  travelers,
  totalBudget,
  categories,
  expenses,
  locale,
  tips,
  chartElement,
  t,
}: ExportBudgetPdfArgs) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const newPageIfNeeded = (need: number) => {
    if (y + need > pageH - 60) {
      addFooter();
      doc.addPage();
      y = margin;
      addHeader();
    }
  };

  const addHeader = () => {
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, pageW, 50, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Xplania", margin, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(45, 212, 191);
    doc.text(t("budget.pdf.headerSubtitle"), pageW - margin, 32, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y = 70;
  };

  const addFooter = () => {
    const dateStr = new Date().toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(t("budget.pdf.footer", { date: dateStr }), margin, pageH - 25);
    const page = doc.getCurrentPageInfo().pageNumber;
    doc.text(`${page}`, pageW - margin, pageH - 25, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  addHeader();

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(t("budget.pdf.title", { destination }), margin, y);
  y += 26;

  // Trip summary
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const dates =
    tripData?.departureDate && tripData?.returnDate
      ? `${tripData.departureDate} → ${tripData.returnDate}`
      : t("budget.pdf.noDates");
  const summaryLines = [
    `${t("budget.pdf.destination")}: ${destination}`,
    `${t("budget.pdf.dates")}: ${dates}`,
    `${t("budget.pdf.duration")}: ${days} ${t("budget.pdf.days")}`,
    `${t("budget.pdf.travelers")}: ${travelers}`,
    `${t("budget.pdf.totalBudget")}: ${fmt(totalBudget)}`,
  ];
  summaryLines.forEach((line) => {
    newPageIfNeeded(16);
    doc.text(line, margin, y);
    y += 16;
  });
  y += 8;

  // Breakdown table
  newPageIfNeeded(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(t("budget.pdf.breakdown"), margin, y);
  y += 18;

  const headers = [
    t("budget.pdf.category"),
    t("budget.pdf.planned"),
    t("budget.pdf.spent"),
    t("budget.pdf.remaining"),
  ];
  const colX = [margin, margin + 200, margin + 300, margin + 400];
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin - 4, y - 12, pageW - margin * 2 + 8, 18, "F");
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 14;

  doc.setFont("helvetica", "normal");
  categories.forEach((c) => {
    newPageIfNeeded(16);
    const remaining = c.planned - c.spent;
    const label = t(`budget.categories.${c.key}`, { defaultValue: c.key });
    doc.text(String(label), colX[0], y);
    doc.text(fmt(c.planned), colX[1], y);
    doc.text(fmt(c.spent), colX[2], y);
    doc.text(fmt(remaining), colX[3], y);
    y += 14;
  });
  y += 10;

  // Chart snapshot
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#0d1117",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      newPageIfNeeded(imgH + 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(t("budget.pdf.chartsTitle"), margin, y);
      y += 14;
      doc.addImage(imgData, "PNG", margin, y, imgW, imgH);
      y += imgH + 12;
    } catch (e) {
      console.warn("chart snapshot failed", e);
    }
  }

  // Expenses
  if (expenses.length) {
    newPageIfNeeded(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(t("budget.pdf.expensesTitle"), margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    expenses.forEach((e) => {
      newPageIfNeeded(14);
      const date = e.date ? new Date(e.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US") : "";
      const label = t(`budget.categories.${e.category}`, { defaultValue: e.category });
      const desc = (e.comment || "").slice(0, 60);
      doc.text(`${date}  ·  ${label}  ·  ${desc}`, margin, y);
      doc.text(fmt(e.amount), pageW - margin, y, { align: "right" });
      y += 13;
    });
    y += 8;
  }

  // Tips
  if (tips?.length) {
    newPageIfNeeded(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(t("budget.pdf.tipsTitle"), margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    tips.forEach((tip, i) => {
      const wrapped = doc.splitTextToSize(`${i + 1}. ${tip}`, pageW - margin * 2);
      newPageIfNeeded(wrapped.length * 12 + 4);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12 + 4;
    });
  }

  addFooter();

  const safe = destination.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`xplania-budget-${safe}-${dateTag}.pdf`);
}
