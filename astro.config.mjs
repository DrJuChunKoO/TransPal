// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import partytown from "@astrojs/partytown";
import tailwindcss from "@tailwindcss/vite";
import opengraphImages from "astro-opengraph-images";
import OGImageTemplate from "./src/components/OGImageTemplate.tsx";
import * as fs from "fs";
import Icons from "unplugin-icons/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://transpal.juchunko.com",
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
            name: "Noto Sans TC",
            weight: 400,
            style: "normal",
            data: fs.readFileSync(
              "node_modules/@expo-google-fonts/noto-sans-tc/400Regular/NotoSansTC_400Regular.ttf"
            ),
          },
          {
            name: "Noto Sans TC",
            weight: 700,
            style: "normal",
            data: fs.readFileSync(
              "node_modules/@expo-google-fonts/noto-sans-tc/700Bold/NotoSansTC_700Bold.ttf"
            ),
          },
        ],
      },
      render: OGImageTemplate,
    }),
    partytown({ config: { forward: ["dataLayer.push"] } }),
  ],
  output: "static",
  build: {
    // Enable asset inlining for better performance
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  vite: {
    plugins: [
      tailwindcss(),
      Icons({
        autoInstall: true,
        compiler: "jsx",
        jsx: "react",
      }),
    ],
    build: {
      // Optimize chunk splitting
      rollupOptions: {
        external: ["@resvg/resvg-js", "jsdom"],
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      exclude: ["@resvg/resvg-js", "jsdom"],
    },
    ssr: {
      external: ["@resvg/resvg-js", "jsdom"],
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
