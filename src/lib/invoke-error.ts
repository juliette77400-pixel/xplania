import i18n from "@/i18n";

/** Turns a raw edge-function error into a friendly, translated message. */
export async function friendlyInvokeError(error: unknown): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  const status = ctx?.status;
  let serverMsg = "";
  try {
    if (ctx && typeof ctx.clone === "function") {
      const body = await ctx.clone().json();
      serverMsg = typeof body?.error === "string" ? body.error : "";
    }
  } catch { /* ignore */ }
  const t = i18n.t.bind(i18n);
  if (status === 429) return t("invokeError.rateLimit");
  if (status === 402) return t("invokeError.quota");
  if (status === 401) return t("invokeError.auth");
  if (status && status >= 500) return t("invokeError.server");
  return serverMsg && !/non-2xx/i.test(serverMsg) ? serverMsg : t("invokeError.server");
}
