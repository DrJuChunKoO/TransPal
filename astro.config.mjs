// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: 'https://transpal.pages.dev', // Default Cloudflare Pages URL, can be overridden
  integrations: [
    react({
      // Only include React runtime for interactive components
      include: ['**/components/**/*'],
    })
  ],
  output: 'static',
  build: {
    // Enable asset inlining for better performance
    inlineStylesheets: 'auto',
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
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
      // Enable minification
      minify: 'esbuild',
      // Optimize CSS
      cssMinify: true,
      // Set chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  },
  // Enable prefetch for better navigation performance
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  // Image optimization
  image: {
    // Enable image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  // Security headers
  security: {
    checkOrigin: true,
  },
});
