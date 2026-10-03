// Shared helper: structured JSON generation through the Lovable AI Gateway
// Responses API (streamed, so long reasoning runs don't hit request timeouts).
// deno-lint-ignore-file no-explicit-any

export class AiHttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function generateJson<T = any>(opts: {
  instructions: string;
  input: string;
  schema: Record<string, unknown>;
  name?: string;
  strict?: boolean;
  effort?: "low" | "medium" | "high";
}): Promise<T> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new AiHttpError(500, "LOVABLE_API_KEY is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: opts.instructions,
      input: opts.input,
      stream: true,
      store: false,
      reasoning: { effort: opts.effort ?? "low" },
      text: {
        format: {
          type: "json_schema",
          name: opts.name ?? "result",
          strict: opts.strict ?? false,
          schema: opts.schema,
        },
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("AI gateway error", res.status, txt.slice(0, 500));
    throw new AiHttpError(res.status, `AI gateway error: ${res.status}`);
  }

  let out = "";
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
        else if (ev.type === "response.completed" && !out) out = ev.response?.output_text ?? "";
      } catch { /* partial line */ }
    }
  }
  const m = out.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(m ? m[1] : out) as T;
}

export function aiErrorResponse(e: unknown, cors: Record<string, string>): Response | null {
  if (!(e instanceof AiHttpError)) return null;
  const status = [402, 403, 429].includes(e.status) ? e.status : 500;
  const msg = status === 429
    ? "Trop de requêtes, réessaie dans quelques instants."
    : status === 402 ? "Crédits IA insuffisants." : "Erreur du service IA";
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/**
 * Same as generateJson, but splits the top-level fields of an object schema
 * into groups generated in parallel, then merges them. Much faster for big
 * structured answers: the user waits for the slowest group only.
 */
export async function generateJsonSplit<T = any>(opts: Parameters<typeof generateJson>[0] & { parts: string[][] }): Promise<T> {
  const props = (opts.schema as any).properties as Record<string, unknown>;
  const isEN = /\bENGLISH\b/.test(opts.instructions);
  const results = await Promise.all(opts.parts.map((keys) => {
    const strict = opts.strict ?? false;
    const schema: Record<string, unknown> = {
      type: "object",
      additionalProperties: false,
      required: keys,
      properties: Object.fromEntries(keys.map((k) => [k, props[k]])),
    };
    const only = isEN
      ? `\nFor this request, fill ONLY these fields: ${keys.join(", ")}.`
      : `\nPour cette demande, remplis UNIQUEMENT ces champs : ${keys.join(", ")}.`;
    return generateJson({ ...opts, schema, strict, instructions: opts.instructions + only });
  }));
  return Object.assign({}, ...results) as T;
}
