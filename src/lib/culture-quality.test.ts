import { describe, expect, it } from "vitest";
import { cultureQualityIssues } from "../../supabase/functions/_shared/culture-quality";

const tip = (text: string, example: string) => ({ text, why: "Une raison culturelle assez détaillée.", example, nuance: "Cela varie selon les équipes et les régions." });
const good = {
  ping: "Observe d'abord.",
  dos: [tip("Dire « -san »", "Dans ton stage à Tokyo, tu dis « Tanaka-san »."), tip("Être ponctuel", "Pour ton séminaire à Kyoto, arrive à 9 h 55."), tip("Faire le point", "En stage à Osaka, tu fais un point rapide.")],
  donts: [tip("Couper la parole", "En réunion à Nagoya, attends la pause."), tip("Ranger la carte", "Lors d'un rendez-vous à Marunouchi, lis la carte."), tip("Refuser sèchement", "Si ton tuteur à Tokyo propose une tâche, explique.")],
  homeVsHere: ["a", "b"],
};

describe("culture theme quality check before sharing", () => {
  it("lets a rich, local theme be cached", () => {
    expect(cultureQualityIssues(good, "Japon")).toEqual([]);
  });
  it("refuses a theme whose examples could happen anywhere", () => {
    const generic = { ...good, dos: good.dos.map((d) => ({ ...d, example: "tu arrives un peu en avance pour montrer ton respect." })), donts: good.donts.map((d) => ({ ...d, example: "tu écoutes bien la personne avant de répondre." })) };
    expect(cultureQualityIssues(generic, "Japon")).toContain("not_local_enough");
  });
  it("refuses a theme with fewer than 3 tips or empty fields", () => {
    const r = cultureQualityIssues({ dos: [tip("a", "")], donts: [], homeVsHere: [] }, "Japon");
    expect(r).toEqual(expect.arrayContaining(["too_few_dos", "too_few_donts", "incomplete_tip", "missing_comparison"]));
  });
  it("refuses a theme written with inclusive writing", () => {
    expect(cultureQualityIssues({ ...good, ping: "Chaque étudiant·e est différent." }, "Japon")).toContain("inclusive_writing");
  });
});
