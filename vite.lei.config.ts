import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

// App di lei (Frappaula Fit · Lei): progetto a parte nella cartella lei/, pubblicato in /FrappaulaFit/lei/.
// Service worker, cache, IndexedDB e chiavi di sincronizzazione sono propri: non tocca l'app di Francesco.

function codiceBuild(): string {
  let sha = process.env.GITHUB_SHA?.slice(0, 7);
  if (!sha) {
    try {
      sha = execSync('git rev-parse --short HEAD').toString().trim();
    } catch {
      sha = 'locale';
    }
  }
  const quando = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `${sha} · ${quando}`;
}

export default defineConfig(({ mode }) => ({
  root: resolve(__dirname, 'lei'),
  base: mode === 'production' ? '/FrappaulaFit/lei/' : '/',
  define: { __APP_VERSION__: JSON.stringify('1.0.0'), __APP_BUILD__: JSON.stringify(codiceBuild()) },
  build: { outDir: resolve(__dirname, 'dist/lei'), emptyOutDir: true },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '/FrappaulaFit/lei/',
        name: 'Frappaula Fit · Lei',
        short_name: 'Frappaula Lei',
        description: 'Programma glutei e parte alta a 3 sedute, con test e carichi calcolati',
        lang: 'it',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E0F11',
        theme_color: '#0E0F11',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
        cacheId: 'frappaula-lei',
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'lei-google-fonts-css', expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } } },
          { urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i, handler: 'CacheFirst', options: { cacheName: 'lei-google-fonts-file', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } } },
        ],
      },
    }),
  ],
}));
