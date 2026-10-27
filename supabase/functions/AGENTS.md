# Edge function rules

- AI safety: every AI prompt must include SAFETY_RULE_* from supabase/functions/_shared/prompts.ts (via brandHeader or explicitly) — why: no illegal/dangerous/disrespectful recommendations.
- Departure reminders (J-60 visa/housing/budget, J-10 arrival, J-7 formalities, J-5 suitcase, weather) are sent by the daily trip-reminders job and skipped when user_metadata.departure_reminders is false (Settings → Notifications) — why: the server must honour the opt-out without a new table.
- Request-body values never go into an AI system prompt: clean them and send them as a user-role data message via supabase/functions/_shared/untrusted.ts — why: a student-typed field must not be able to rewrite the assistant's rules.
- Visa fees and processing times are shown only when their numbers appear in the official extract (supabase/functions/_shared/visa-figures.ts, tested); otherwise the card links to the official site and visa-qa is told never to quote them — why: AI-estimated prices must never look official.
