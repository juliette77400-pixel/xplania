// Journal photos and voice memos live in the private "journal-media" bucket.
// Links are never stored long-term: each time a journal is loaded we create
// fresh, short-lived signed links from the stored file path. When a journal
// stops being public, viewers can no longer obtain new links and old ones
// expire quickly.
import { supabase } from "@/integrations/supabase/client";

export const JOURNAL_MEDIA_BUCKET = "journal-media";
/** Lifetime of a signed media link, in seconds (2 hours). */
export const JOURNAL_MEDIA_TTL = 60 * 60 * 2;

const SIGN_MARKER = `/storage/v1/object/sign/${JOURNAL_MEDIA_BUCKET}/`;

/** Returns the storage path of a journal media block, or null. */
export const journalMediaPath = (content: unknown): string | null => {
  if (!content || typeof content !== "object") return null;
  const c = content as { path?: unknown; url?: unknown };
  if (typeof c.path === "string" && c.path) return c.path;
  if (typeof c.url === "string") {
    const i = c.url.indexOf(SIGN_MARKER);
    if (i >= 0) {
      const rest = c.url.slice(i + SIGN_MARKER.length).split("?")[0];
      try {
        return decodeURIComponent(rest) || null;
      } catch {
        return rest || null;
      }
    }
  }
  return null;
};

type BlockLike = { type?: string | null; content?: unknown };

/** Replaces stored media links with fresh short-lived ones (one batch request). */
export async function withFreshJournalMedia<T extends BlockLike>(blocks: T[]): Promise<T[]> {
  const targets = blocks
    .map((b, idx) => ({ idx, path: b.type === "photo" || b.type === "audio" ? journalMediaPath(b.content) : null }))
    .filter((x): x is { idx: number; path: string } => !!x.path);
  if (!targets.length) return blocks;

  const uniquePaths = [...new Set(targets.map((t) => t.path))];
  const signed = new Map<string, string>();
  try {
    const { data } = await supabase.storage
      .from(JOURNAL_MEDIA_BUCKET)
      .createSignedUrls(uniquePaths, JOURNAL_MEDIA_TTL);
    (data || []).forEach((d) => {
      if (d.path && d.signedUrl && !d.error) signed.set(d.path, d.signedUrl);
    });
  } catch {
    /* fall through: links are dropped below */
  }

  const out = [...blocks];
  for (const { idx, path } of targets) {
    const b = out[idx];
    const content = { ...(b.content as Record<string, unknown>), path };
    const url = signed.get(path);
    if (url) content.url = url;
    else delete content.url; // never fall back to an old long-lived link
    out[idx] = { ...b, content };
  }
  return out;
}

/** Creates a short-lived link right after an upload. */
export async function signJournalMedia(path: string): Promise<string | undefined> {
  const { data } = await supabase.storage.from(JOURNAL_MEDIA_BUCKET).createSignedUrl(path, JOURNAL_MEDIA_TTL);
  return data?.signedUrl;
}
