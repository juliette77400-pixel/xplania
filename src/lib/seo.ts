// Lightweight runtime SEO/OG meta tag setter for public pages.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setShareMeta(opts: {
  title: string;
  description: string;
  ogKind: "carnet" | "suivi";
  slug: string;
}) {
  const { title, description, ogKind, slug } = opts;
  document.title = `${title} · Xplania`;
  const ogImage = `${SUPABASE_URL}/functions/v1/og-image?kind=${ogKind}&slug=${encodeURIComponent(slug)}`;
  const url = window.location.href;

  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:image", ogImage);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:type", "article");
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", ogImage);
}
