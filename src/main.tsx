import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";

const rootEl = document.getElementById("root")!;

// Fail-fast guard: if the backend env vars weren't injected at build time,
// the Supabase client throws "supabaseUrl is required" and the whole app
// renders a black screen. Show a readable message instead.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;background:#0b0b12;color:#fff;">
      <div style="max-width:520px;text-align:center;">
        <h1 style="font-size:22px;margin-bottom:12px;">Configuration manquante</h1>
        <p style="opacity:.8;line-height:1.5;">
          Les variables d'environnement du backend (<code>VITE_SUPABASE_URL</code> /
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>) n'ont pas été injectées dans cette build.
          Republie l'application depuis Lovable pour régénérer les variables, puis recharge la page.
        </p>
      </div>
    </div>`;
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY at build time. Republish the app to regenerate env vars."
  );
}

const [{ default: App }, { ThemeProvider }, { registerAppSW }] = await Promise.all([
  import("./App.tsx"),
  import("@/hooks/useTheme"),
  import("@/pwa/registerSW"),
]);

createRoot(rootEl).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

void registerAppSW();
