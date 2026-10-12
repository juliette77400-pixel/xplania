export function authErrorKey(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate") || m.includes("seconds")) return "auth.errRate";
  if (m.includes("invalid login")) return "auth.errInvalid";
  if (m.includes("email not confirmed")) return "auth.errNotConfirmed";
  if (m.includes("already registered") || m.includes("already been registered")) return "auth.errExists";
  if (m.includes("same password")) return "auth.errSamePassword";
  if (m.includes("password")) return "auth.errPassword";
  return "auth.errGeneric";
}