// Only same-site paths are allowed after sign-in ("/guide-visa", "/app?x=1").
// Blocks "//evil.com", "/\evil.com", "@evil.com", full URLs and control characters.
export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(v)) return fallback;
  try {
    const u = new URL(v, "https://xplania.app");
    if (u.origin !== "https://xplania.app") return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}
