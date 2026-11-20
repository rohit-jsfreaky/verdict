import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  // The render route reads fonts/ at runtime: ship it with the serverless function.
  outputFileTracingIncludes: { "/api/render": ["./fonts/**"] },
  // Hyper Elements renders PDFs and images on Node: keep their engines out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer", "@resvg/resvg-js", "satori"],
  turbopack: {
    // This folder is its own project (its own repo); a git repo further up must not become the root.
    root: dirname(fileURLToPath(import.meta.url)),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
