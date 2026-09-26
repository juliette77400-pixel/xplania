import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { META, SELF_MANAGED, NOINDEX_ROUTES } from "@/lib/route-meta.data";

const BASE = "https://xplania.app";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function RouteMeta() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    setMeta("name", "robots", NOINDEX_ROUTES.includes(pathname) ? "noindex,follow" : "index,follow");

    if (SELF_MANAGED.some((r) => r.test(pathname))) return;
    const url = `${BASE}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;
    setCanonical(url);
    setMeta("property", "og:url", url);
    const m = META[pathname];
    if (!m) return;
    const [title, description] = i18n.language?.startsWith("en") ? m.en : m.fr;
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
  }, [pathname, i18n.language]);

  return null;
}
