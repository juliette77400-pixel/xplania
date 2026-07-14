// Centralized data-layer helpers for tables accessed from many components.
//
// Wave 3 goal: replace ad-hoc `supabase.from(...)` calls that appear in the
// same shape across the codebase. Import these helpers instead of duplicating
// the query in each consumer — this shrinks the surface for RLS/shape changes
// to a single file per table group.
export * from "./weekly-progress";
export * from "./profiles";
