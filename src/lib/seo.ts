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

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  let el = document.head.querySelector<HTMLScriptElement>(`script[type="application/ld+json"][data-id="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute("data-id", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function setShareMeta(opts: {
  title: string;
  description: string;
  ogKind: "carnet" | "suivi";
  slug: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
}) {
  const { title, description, ogKind, slug, imageUrl, author, publishedAt } = opts;
  document.title = `${title} · Xplania`;
  const ogImage = imageUrl || `${SUPABASE_URL}/functions/v1/og-image?kind=${ogKind}&slug=${encodeURIComponent(slug)}`;
  const url = window.location.href;

  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:image", ogImage);
  upsertMeta("property", "og:image:width", "1200");
  upsertMeta("property", "og:image:height", "630");
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:type", "article");
  upsertMeta("property", "og:site_name", "Xplania");
  upsertMeta("property", "og:locale", document.documentElement.lang === "en" ? "en_US" : "fr_FR");
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", ogImage);
  upsertMeta("name", "twitter:site", "@xplania");
  upsertMeta("name", "robots", "index, follow");
  upsertLink("canonical", url);

  upsertJsonLd("share-article", {
    "@context": "https://schema.org",
    "@type": ogKind === "carnet" ? "Article" : "TravelEvent",
    headline: title,
    description,
    image: [ogImage],
    url,
    inLanguage: document.documentElement.lang || "fr",
    ...(author ? { author: { "@type": "Person", name: author } } : {}),
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    publisher: {
      "@type": "Organization",
      name: "Xplania",
      logo: { "@type": "ImageObject", url: `${window.location.origin}/favicon.ico` },
    },
  });
}

export function clearShareMeta() {
  // Reset to defaults when leaving a public share page.
  document.title = "Xplania";
  ["description", "twitter:title", "twitter:description", "twitter:image"].forEach((k) => {
    const el = document.head.querySelector(`meta[name="${k}"]`);
    if (el) el.remove();
  });
  ["og:title", "og:description", "og:image", "og:url", "og:type"].forEach((k) => {
    const el = document.head.querySelector(`meta[property="${k}"]`);
    if (el) el.remove();
  });
  const ld = document.head.querySelector('script[type="application/ld+json"][data-id="share-article"]');
  if (ld) ld.remove();
}
