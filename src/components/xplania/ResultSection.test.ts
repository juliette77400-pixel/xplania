import { describe, expect, it } from "vitest";
import { previewSteps } from "@/lib/prep-preview";
import { LANDING_EXAMPLE } from "./ResultSection";

describe("landing example", () => {
  it("shows the real 3 priorities of the questionnaire for the Spain Erasmus example", () => {
    const steps = previewSteps(LANDING_EXAMPLE);
    expect(steps).toHaveLength(3);
    expect(steps.map((s) => s.module).sort()).toEqual(["budget", "housing", "visa"]);
  });
});
