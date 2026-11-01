// Single place that decides which AI provider and which models Xplania uses.
// Today every call goes through the Lovable AI Gateway. To move to the OpenAI
// API later, set the AI_PROVIDER secret to "openai" and add OPENAI_API_KEY:
// no feature code changes, the same models are used (GPT-6 Luna / Sol exist
// with the same names on the OpenAI API).
// deno-lint-ignore-file no-explicit-any

/** "default" = everyday generations and assistants; "official" = summaries of official Visa pages. */
export type AiRole = "default" | "official";

const MODELS: Record<AiRole, string> = {
  default: "openai/gpt-6-luna",
  official: "openai/gpt-6-sol",
};

export type AiProvider = "lovable" | "openai";

export function aiProvider(): AiProvider {
  return (Deno.env.get("AI_PROVIDER") || "").trim().toLowerCase() === "openai" ? "openai" : "lovable";
}

/** Model id for a role, in the naming of the active provider. */
export function aiModel(role: AiRole = "default"): string {
  const id = MODELS[role];
  return aiProvider() === "openai" ? id.replace(/^openai\//, "") : id;
}

export function aiEndpoint(path: "responses" | "chat/completions"): string {
  return aiProvider() === "openai" ? `https://api.openai.com/v1/${path}` : `https://ai.gateway.lovable.dev/v1/${path}`;
}

export class AiConfigError extends Error {}

export function aiHeaders(): Record<string, string> {
  if (aiProvider() === "openai") {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) throw new AiConfigError("OPENAI_API_KEY is not configured");
    return { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
  }
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new AiConfigError("LOVABLE_API_KEY is not configured");
  return { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" };
}

/**
 * Chat Completions call with the request shape GPT-6 models accept: no
 * temperature/top_p, light reasoning (none when function tools are sent, as
 * the API requires), and output caps under max_completion_tokens.
 */
export function aiChat(body: Record<string, any>, role: AiRole = "default", signal?: AbortSignal): Promise<Response> {
  const { temperature: _t, top_p: _p, reasoning: _r, max_tokens, model: _m, ...rest } = body;
  const hasTools = Array.isArray(body.tools) && body.tools.length > 0;
  const payload: Record<string, any> = { ...rest, model: aiModel(role), reasoning_effort: hasTools ? "none" : "low" };
  if (max_tokens && !payload.max_completion_tokens) payload.max_completion_tokens = max_tokens;
  return fetch(aiEndpoint("chat/completions"), { method: "POST", headers: aiHeaders(), body: JSON.stringify(payload), signal });
}
