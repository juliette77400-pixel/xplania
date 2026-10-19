import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TravelerProfileOnboarding from "./TravelerProfileOnboarding";

const state = vi.hoisted(() => ({
  profile: { completed_at: "2026-10-18T12:00:00Z", onboarding_step: "done" } as { completed_at: string | null; onboarding_step: string },
  deleteSwipes: vi.fn(),
  upsertProfile: vi.fn(),
  invalidate: vi.fn(),
  user: { id: "traveler" },
  t: (key: string) => key,
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock("@/hooks/useTravelerProfile", () => ({
  useTravelerProfile: () => ({ data: state.profile, isLoading: false }),
  travelerProfileKey: (id: string) => ["traveler_profile", id],
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: state.invalidate }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: state.t, i18n: { language: "fr" } }) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }) }));
vi.mock("@/components/tinder/TinderCard", () => ({ default: () => <div>question</div> }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "tinder_cards") return { select: () => ({ eq: () => ({ order: async () => ({
        data: Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: String(i), image_url: "/photo.jpg", phrase_fr: "question", phrase_en: "question", score_tags: { culture: 1 }, order_index: i })), error: null,
      }) }) }) };
      if (table === "user_swipes") return {
        select: () => ({ eq: async () => ({ data: [], error: null }) }),
        delete: () => ({ eq: state.deleteSwipes }),
      };
      if (table === "traveler_profiles") return { upsert: state.upsertProfile };
      return { insert: () => Promise.resolve({ error: null }) };
    },
  },
}));

function openQuiz() {
  return render(<MemoryRouter initialEntries={["/profil-voyageur"]}>
    <Routes>
      <Route path="/profil-voyageur" element={<TravelerProfileOnboarding />} />
      <Route path="/app" element={<div>traveler-app</div>} />
    </Routes>
  </MemoryRouter>);
}

describe("intentional retakes for completed travelers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    state.profile = { completed_at: "2026-10-18T12:00:00Z", onboarding_step: "done" };
    state.deleteSwipes.mockResolvedValue({ error: null });
    state.upsertProfile.mockImplementation(async (row) => {
      state.profile = { completed_at: row.completed_at, onboarding_step: row.onboarding_step };
      return { error: null };
    });
    state.invalidate.mockResolvedValue(undefined);
  });

  it("keeps ordinary entry going to the app without changing the profile", async () => {
    openQuiz();
    fireEvent.click(screen.getByRole("button", { name: "journeyIntro.cta" }));
    expect(await screen.findByText("traveler-app")).toBeInTheDocument();
    expect(state.upsertProfile).not.toHaveBeenCalled();
    expect(state.deleteSwipes).not.toHaveBeenCalled();
  });

  it("leaves the completed profile untouched when restart is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    openQuiz();
    fireEvent.click(screen.getByRole("button", { name: "travelerProfile.resetCta" }));
    expect(state.deleteSwipes).not.toHaveBeenCalled();
    expect(state.upsertProfile).not.toHaveBeenCalled();
    expect(state.profile.completed_at).toBe("2026-10-18T12:00:00Z");
  });

  it("opens a fresh ten-question quiz only after confirmed reset", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    openQuiz();
    fireEvent.click(screen.getByRole("button", { name: "travelerProfile.resetCta" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "travelerProfile.forMe" })).toBeEnabled());
    expect(state.deleteSwipes).toHaveBeenCalledWith("user_id", "traveler");
    expect(state.upsertProfile).toHaveBeenCalledWith(expect.objectContaining({ user_id: "traveler", completed_at: null, onboarding_step: "tinder", culture_score: 0 }), { onConflict: "user_id" });
    expect(JSON.parse(localStorage.getItem("xplania:onboarding") ?? "{}").swipes).toEqual([]);
    expect(screen.queryByText("traveler-app")).not.toBeInTheDocument();
    expect(screen.getByText("travelerProfile.questionOf")).toBeInTheDocument();
  });

  it("does not start a retake if saving the reset fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    state.upsertProfile.mockResolvedValue({ error: { message: "save failed" } });
    openQuiz();
    fireEvent.click(screen.getByRole("button", { name: "travelerProfile.resetCta" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "travelerProfile.resetCta" })).toBeEnabled());
    expect(screen.queryByRole("button", { name: "travelerProfile.forMe" })).not.toBeInTheDocument();
    expect(state.profile.completed_at).toBe("2026-10-18T12:00:00Z");
  });
});