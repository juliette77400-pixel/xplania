/**
 * Helpers to drive Google Website Translator from React.
 * The widget exposes a hidden <select.goog-te-combo> we mutate to switch language.
 */

const COOKIE_NAME = "googtrans";

export function setGoogleTranslateLang(target: string | null) {
  // null = restore original (FR)
  const value = target && target !== "fr" ? `/fr/${target}` : "/fr/fr";

  // Cookie on root + domain so it survives reloads/SPA navigations
  const setCookie = (domain: string) => {
    document.cookie = `${COOKIE_NAME}=${value}; path=/; domain=${domain}; max-age=31536000`;
  };
  setCookie(window.location.hostname);
  // Try parent domain too (.lovable.app, etc.)
  const parts = window.location.hostname.split(".");
  if (parts.length > 1) setCookie("." + parts.slice(-2).join("."));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=31536000`;

  // Try to drive the combo immediately if widget is loaded
  const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (select) {
    select.value = target && target !== "fr" ? target : "";
    select.dispatchEvent(new Event("change"));
    return;
  }

  // Widget not ready yet → reload to apply cookie
  window.location.reload();
}

export function getGoogleTranslateLang(): string | null {
  const m = document.cookie.match(/googtrans=\/fr\/([^;]+)/);
  if (!m) return null;
  const code = m[1];
  return code === "fr" ? null : code;
}
