// First-party analytics: no-op unless the user has given analytics consent.
import { supabase } from "@/integrations/supabase/client";
import { hasAnalyticsConsent } from "@/lib/consent";

const SESSION_KEY = "xplania-analytics-session";
const UTM_KEY = "xplania-analytics-utm";

type AnalyticsEvent =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "login"
  | "quiz_started"
  | "quiz_completed"
  | "trip_created"
  | "itinerary_generated"
  | "guide_generated"
  | "carnet_created"
  | "waitlist_joined"
  | "cta_click";

const getSessionId = (): string => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
};

interface Utm {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
}

const getUtm = (): Utm => {
  try {
    const cached = sessionStorage.getItem(UTM_KEY);
    if (cached) return JSON.parse(cached) as Utm;
    const params = new URLSearchParams(window.location.search);
    const utm: Utm = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      referrer: document.referrer || null,
    };
    sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    return utm;
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null, referrer: null };
  }
};

const getDevice = (): string => {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

/**
 * Tracks a product analytics event. Silently does nothing when the user has
 * not opted in to analytics cookies, and never throws on failure.
 */
export const track = (event: AnalyticsEvent, props: Record<string, unknown> = {}): void => {
  if (!hasAnalyticsConsent()) return;
  try {
    const utm = getUtm();
    void supabase
      .from("analytics_events")
      .insert({
        session_id: getSessionId(),
        event,
        path: window.location.pathname.slice(0, 300),
        props: props as never,
        lang: document.documentElement.lang || null,
        referrer: utm.referrer,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        device: getDevice(),
      } as never)
      .then(() => {}, () => {});
  } catch {
    // Never let analytics break the app.
  }
};
