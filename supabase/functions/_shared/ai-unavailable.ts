// When the workspace has no AI credits left (gateway 402) or hits its AI
// spending cap (gateway 403 credit limit), every tool answers the same way:
// HTTP 503 + code "ai_unavailable". It is never a 402, so the app can never
// confuse it with the student's own monthly tries (402 "quota_exceeded"),
// and withQuotaRefund gives the student's try back.

export const AI_UNAVAILABLE = "ai_unavailable";

/** True when the AI gateway refused because of workspace credits, not the request itself. */
export function isAiCreditBlock(status: number, body = ""): boolean {
  if (status === 402) return true;
  return status === 403 && /credit|spending|ai[_ ]?disabled/i.test(body);
}

export function aiUnavailableResponse(cors: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: AI_UNAVAILABLE, code: AI_UNAVAILABLE }), {
    status: 503,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
