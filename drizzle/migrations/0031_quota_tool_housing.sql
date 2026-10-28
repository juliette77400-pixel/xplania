-- The housing assistant gets its own monthly tries (same limit as every tool, via get_quota_limit).
ALTER TYPE public.quota_tool ADD VALUE IF NOT EXISTS 'housing';