// Convert ai_analysis.steps into safe, user-facing strings (no raw AI text, no sensitive data).
export type ClaimAnalysis = {
  steps?: Array<any>;
  verdict?: string;
  started_at?: string;
  finished_at?: string;
  settings?: any;
} | null | undefined;

export type ClaimExplain = {
  kind: "geo" | "exif" | "ai" | "info";
  ok: boolean | null;
  label: string;
  detail?: string;
};

export function explainClaim(analysis: ClaimAnalysis, lang: "fr" | "en" = "fr"): ClaimExplain[] {
  const out: ClaimExplain[] = [];
  const fr = lang === "fr";
  for (const s of analysis?.steps ?? []) {
    if (s.kind === "geo") {
      out.push({
        kind: "geo",
        ok: !!s.ok,
        label: fr ? "Position GPS au moment de la soumission" : "GPS position at submission",
        detail: s.distance_m != null
          ? (fr
              ? `À environ ${s.distance_m} m du lieu cible (limite : ${s.radius_m} m).`
              : `About ${s.distance_m} m from the target spot (limit: ${s.radius_m} m).`)
          : undefined,
      });
    } else if (s.kind === "exif") {
      if (s.ok && s.distance_m != null) {
        out.push({
          kind: "exif",
          ok: true,
          label: fr ? "Géolocalisation extraite de la photo" : "Photo GPS metadata",
          detail: fr
            ? `Pris à environ ${s.distance_m} m du lieu cible (limite : ${s.radius_m} m).`
            : `Taken about ${s.distance_m} m from the target spot (limit: ${s.radius_m} m).`,
        });
      } else {
        out.push({
          kind: "exif",
          ok: false,
          label: fr ? "Géolocalisation de la photo" : "Photo GPS metadata",
          detail: s.reason === "no_gps"
            ? (fr ? "Aucune coordonnée GPS dans la photo." : "No GPS data found in the photo.")
            : s.reason === "no_target"
            ? (fr ? "Le badge n'a pas de coordonnées cibles." : "Badge has no target coordinates.")
            : (fr ? "Impossible de lire les métadonnées de la photo." : "Could not read photo metadata."),
        });
      }
    } else if (s.kind === "ai") {
      const parsed = s.parsed;
      if (parsed?.verdict) {
        const conf = Math.round((parsed.confidence ?? 0) * 100);
        const labelMap: Record<string, string> = fr
          ? { validated: "Confirmée", rejected: "Insuffisante", uncertain: "Incertaine" }
          : { validated: "Confirmed", rejected: "Insufficient", uncertain: "Uncertain" };
        out.push({
          kind: "ai",
          ok: parsed.verdict === "validated",
          label: fr ? "Analyse visuelle automatisée" : "Automated visual analysis",
          detail: `${labelMap[parsed.verdict] ?? parsed.verdict} · ${fr ? "confiance" : "confidence"} ${conf}%`,
        });
      } else {
        out.push({
          kind: "ai",
          ok: false,
          label: fr ? "Analyse visuelle automatisée" : "Automated visual analysis",
          detail: fr ? "Analyse non concluante." : "Analysis was not conclusive.",
        });
      }
    }
  }
  return out;
}

export function statusLabel(status: string, lang: "fr" | "en" = "fr"): { label: string; tone: "ok" | "wait" | "bad" | "neutral" } {
  const fr = lang === "fr";
  switch (status) {
    case "validated": return { label: fr ? "Badge validé" : "Badge validated", tone: "ok" };
    case "rejected": return { label: fr ? "Preuve refusée" : "Proof refused", tone: "bad" };
    case "submitted": return { label: fr ? "En attente de modération" : "Awaiting moderation", tone: "wait" };
    case "in_progress": return { label: fr ? "En cours" : "In progress", tone: "neutral" };
    default: return { label: status, tone: "neutral" };
  }
}
