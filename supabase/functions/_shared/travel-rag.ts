// Shared helper: retrieve relevant travel documents via pgvector semantic search.
// deno-lint-ignore-file no-explicit-any

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/embeddings";
const EMBEDDING_MODEL = "openai/text-embedding-3-small"; // 1536 dims — matches travel_documents.embedding

export async function embedQuery(query: string): Promise<number[] | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key || !query?.trim()) return null;
  try {
    const r = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: query.slice(0, 6000) }),
    });
    if (!r.ok) {
      console.error("embedQuery failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return j?.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("embedQuery exception", e);
    return null;
  }
}

export interface RetrievedDoc {
  id: string;
  destination_slug: string | null;
  title: string;
  content: string;
  category: string;
  source: string | null;
  source_url: string | null;
  similarity: number;
}

export async function retrieveTravelDocs(
  supabase: any,
  query: string,
  opts: { destinationSlug?: string | null; locale?: "fr" | "en"; k?: number } = {},
): Promise<RetrievedDoc[]> {
  const embedding = await embedQuery(query);
  if (!embedding) return [];
  try {
    const { data, error } = await supabase.rpc("match_travel_documents", {
      query_embedding: embedding as unknown as string,
      match_count: opts.k ?? 4,
      filter_destination_slug: opts.destinationSlug ?? null,
      filter_locale: opts.locale ?? null,
    });
    if (error) {
      console.error("match_travel_documents error", error);
      return [];
    }
    return (data as RetrievedDoc[]) ?? [];
  } catch (e) {
    console.error("retrieveTravelDocs exception", e);
    return [];
  }
}

export function docsToPromptSnippet(docs: RetrievedDoc[], locale: "fr" | "en" = "fr"): string {
  if (!docs.length) return "";
  const header = locale === "en"
    ? "== XPLANIA CURATED KNOWLEDGE (use when relevant, never invent) =="
    : "== SAVOIR XPLANIA CURATE (utilise si pertinent, n'invente jamais) ==";
  const items = docs
    .map((d, i) => `[${i + 1}] ${d.title}${d.destination_slug ? ` (${d.destination_slug})` : ""} — ${d.content}`)
    .join("\n");
  return `${header}\n${items}`;
}
