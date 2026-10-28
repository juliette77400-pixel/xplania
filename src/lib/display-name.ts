// Display name rules, shared by the profile editor and every place that greets the student.
// The database applies the same cleaning (trigger on profiles), so nothing else can slip through.

export const DISPLAY_NAME_MAX = 40;

export type DisplayNameError = "empty" | "tooLong" | "invalid";

/** Same cleaning as the database: no control characters or angle brackets, single spaces. */
export function cleanDisplayName(raw: string): string {
  return raw.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
}

export function validateDisplayName(raw: string): { ok: true; value: string } | { ok: false; error: DisplayNameError } {
  if (/[<>]/.test(raw)) return { ok: false, error: "invalid" };
  const value = cleanDisplayName(raw);
  if (!value) return { ok: false, error: "empty" };
  if (value.length > DISPLAY_NAME_MAX) return { ok: false, error: "tooLong" };
  // At least one letter: "123" or "---" is not a name.
  if (!/\p{L}/u.test(value)) return { ok: false, error: "invalid" };
  return { ok: true, value };
}

/**
 * First name used to greet the student: the name saved in the profile wins, then what the sign-in
 * provider gave, then the start of the e-mail address.
 */
export function pickFirstName(profileName: string | null | undefined, meta: Record<string, unknown> | undefined, email?: string | null): string {
  const first = (v: unknown) => (typeof v === "string" ? v.trim().split(/\s+/)[0] : "");
  const fromProfile = first(profileName);
  if (fromProfile) return fromProfile;
  const m = meta ?? {};
  const fromMeta = [m.first_name, m.firstName, m.given_name, m.display_name, m.full_name, m.name].map(first).find(Boolean);
  if (fromMeta) return fromMeta;
  const local = (email ?? "").split("@")[0].replace(/[._-]+/g, " ").trim().split(" ")[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "";
}
