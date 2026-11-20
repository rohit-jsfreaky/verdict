import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Static files only: every output renders in the browser, so the site runs on Cloudflare with no server.
  output: "export",
  images: { unoptimized: true },
  devIndicators: false,
  turbopack: {
    // This folder is its own project (its own repo); a git repo further up must not become the root.
    root: dirname(fileURLToPath(import.meta.url)),
    resolveAlias: {
      // Hyper Elements' PDF and image renderers target Node; these let them run in the browser.
      "@resvg/resvg-js": "./src/shims/resvg.ts",
      "@react-pdf/renderer": "./src/shims/react-pdf.js",
      crypto: "./src/shims/crypto.ts",
      harfbuzzjs: "./src/shims/harfbuzz.js",
      fs: { browser: "./src/shims/empty.ts" },
      path: { browser: "./src/shims/empty.ts" },
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
