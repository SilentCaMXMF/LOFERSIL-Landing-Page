import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';
import tailwind from '@astrojs/tailwind';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [tailwind()],
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    plugins: [
      process.env.ANALYZE === 'true' && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
      }),
    ].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['dompurify'],
            modules: [
              './src/scripts/modules/TranslationManager.js',
              './src/scripts/modules/NavigationManager.js',
              './src/scripts/modules/ThemeManager.js',
            ],
          },
        },
      },
    },
  },
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
    minify: 'esbuild',
  },
  experimental: {
    env: {
      schema: {
        // Define any environment variables here
      },
    },
    build: {
      inline: ['script', 'style'],
    },
  },
  security: {
    CSP: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://formspree.io"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", "https://formspree.io"],
      },
    },
  },
});