import { defineConfig } from "vite";
import type { Plugin, ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { META } from "./src/lib/route-meta.data";

const SITE = "https://xplania.app";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Generates a prerendered dist/<route>/index.html per public route, with
// route-specific <title>, meta description, canonical, og:*/twitter:* tags,
// so crawlers/social scrapers get correct per-route social previews without
// SSR. Skips "/" (root index.html already reflects it).
function staticRouteMetaPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "static-route-meta",
    apply: "build",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    closeBundle() {
      const outDir = path.isAbsolute(config.build.outDir)
        ? config.build.outDir
        : path.resolve(config.root, config.build.outDir);
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const baseHtml = fs.readFileSync(indexPath, "utf-8");

      for (const [route, meta] of Object.entries(META)) {
        if (route === "/") continue;
        const [title, description] = meta.fr;
        const url = `${SITE}${route}`;
        const eTitle = escapeHtml(title);
        const eDesc = escapeHtml(description);
        const eUrl = escapeHtml(url);

        let html = baseHtml;
        html = html.replace(/<title>.*?<\/title>/s, `<title>${eTitle}</title>`);
        html = html.replace(
          /<meta name="description" content=".*?"\s*\/?>/s,
          `<meta name="description" content="${eDesc}" />`
        );
        html = html.replace(
          /<link rel="canonical" href=".*?"\s*\/?>/s,
          `<link rel="canonical" href="${eUrl}" />`
        );
        html = html.replace(
          /<meta property="og:title" content=".*?"\s*\/?>/s,
          `<meta property="og:title" content="${eTitle}" />`
        );
        html = html.replace(
          /<meta property="og:description" content=".*?"\s*\/?>/s,
          `<meta property="og:description" content="${eDesc}" />`
        );
        html = html.replace(
          /<meta property="og:url" content=".*?"\s*\/?>/s,
          `<meta property="og:url" content="${eUrl}" />`
        );
        html = html.replace(
          /<meta name="twitter:title" content=".*?"\s*\/?>/s,
          `<meta name="twitter:title" content="${eTitle}" />`
        );
        html = html.replace(
          /<meta name="twitter:description" content=".*?"\s*\/?>/s,
          `<meta name="twitter:description" content="${eDesc}" />`
        );

        const routeDir = path.join(outDir, route.replace(/^\//, ""));
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, "index.html"), html, "utf-8");
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    staticRouteMetaPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      manifest: false,
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
      ],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "html-navigations",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:js|css|woff2)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 96, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
