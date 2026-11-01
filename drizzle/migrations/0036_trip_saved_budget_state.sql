-- The student's own Budget numbers (amounts, categories, expenses, incomes) are saved with the trip
-- next to the saved AI results, with the same own-trip-only access rules.
ALTER TABLE public.trip_ai_results DROP CONSTRAINT trip_ai_results_kind_check;
ALTER TABLE public.trip_ai_results ADD CONSTRAINT trip_ai_results_kind_check
  CHECK (kind IN ('visa', 'budget_insights', 'valise_tip', 'valise_outfits', 'budget_state'));
COMMENT ON TABLE public.trip_ai_results IS 'Per-trip saved results: AI results (visa, budget_insights, valise_tip, valise_outfits) and the student''s own Budget numbers (budget_state). Own trips only.';