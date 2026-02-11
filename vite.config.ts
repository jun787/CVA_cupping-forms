import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['forms/cva.pdf', 'fonts/msjh.ttf', 'fields/fields.json'],
      manifest: {
        name: 'CVA Cupping Form',
        short_name: 'CVA Forms',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1f2937',
        start_url: '/',
        icons: []
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,pdf,ttf,json,png}'],
        runtimeCaching: [
          {
            urlPattern: /\/forms\/cva\.pdf$/,
            handler: 'CacheFirst',
            options: { cacheName: 'cva-pdf-cache' }
          },
          {
            urlPattern: /\/fonts\/msjh\.ttf$/,
            handler: 'CacheFirst',
            options: { cacheName: 'cva-font-cache' }
          },
          {
            urlPattern: /\/fields\/fields\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'cva-fields-cache' }
          }
        ]
      }
    })
  ]
});
