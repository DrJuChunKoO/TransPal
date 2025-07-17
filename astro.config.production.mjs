// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

// Production-optimized Astro configuration
export default defineConfig({
  site: 'https://transpal.pages.dev',
  integrations: [
    react({
      // Only include React runtime for interactive components
      include: ['**/components/**/*'],
    })
  ],
  output: 'static',
  build: {
    // Enable asset inlining for better performance
    inlineStylesheets: 'always',
    // Optimize assets
    assets: '_assets',
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Optimize chunk splitting for production
      rollupOptions: {
        output: {
          // Create separate chunks for better caching
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'utils': ['src/utils/speeches.ts'],
          },
          // Optimize asset naming for caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `styles/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
        },
      },
      // Maximum minification
      minify: 'esbuild',
      // Optimize CSS
      cssMinify: 'esbuild',
      // Set chunk size warning limit
      chunkSizeWarningLimit: 500,
      // Enable source maps for debugging (can be disabled for production)
      sourcemap: false,
      // Target modern browsers for better optimization
      target: 'es2020',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@astrojs/react'],
    },
    // Define environment variables
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  },
  // Enable aggressive prefetch for production
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  // Image optimization for production
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: false,
      },
    },
    // Remove remote patterns as we're using local images only
  },
  // Security headers
  security: {
    checkOrigin: true,
  },
  // Remove experimental flags that are no longer valid
});