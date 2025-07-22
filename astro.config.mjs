// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import opengraphImages from "astro-opengraph-images";
import OGImageTemplate from "./src/components/OGImageTemplate.tsx";
import * as fs from "fs";

// https://astro.build/config
export default defineConfig({
  site: "https://transpal.pages.dev", // Default Cloudflare Pages URL, can be overridden
  integrations: [
    react({
      // Only include React runtime for interactive components
      include: ["**/components/**/*"],
    }),
    opengraphImages({
      options: {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "IBM Plex Sans TC",
            weight: 400,
            style: "normal",
            data: fs.readFileSync(
              "node_modules/@openfonts/noto-sans-tc_chinese-traditional/files/noto-sans-tc-chinese-traditional-400.woff"
            ),
          },
        ],
      },
      render: OGImageTemplate,
    }),
  ],
  output: "static",
  build: {
    // Enable asset inlining for better performance
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          // Create separate chunks for vendor libraries
          manualChunks: {
            "react-vendor": ["react", "react-dom"],
          },
        },
      },
      // Enable minification
      minify: "esbuild",
      // Optimize CSS
      cssMinify: true,
      // Set chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
  },
  // Enable prefetch for better navigation performance
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  // Image optimization
  image: {
    // Enable image optimization
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  // Security headers
  security: {
    checkOrigin: true,
  },
});
