import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon-32.png',
        'icons/apple-touch-icon.png',
        'icons/logo.svg',
        'fonts/*.woff2',
        'screenshots/*.png',
      ],
      manifest: {
        name: 'RasaAtlas — Katalog Kuliner Semarang',
        short_name: 'RasaAtlas',
        description:
          'Jelajahi 24 tempat makan pilihan di Semarang: warung legendaris, kafe, restoran, dan jajanan. Bisa dipasang dan dibuka offline.',
        lang: 'id',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f7f1e6',
        theme_color: '#143f33',
        categories: ['food', 'travel', 'lifestyle'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Jelajahi Kuliner',
            short_name: 'Katalog',
            description: 'Lihat seluruh daftar kuliner Semarang',
            url: '/tempat',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Tempat Terdekat',
            short_name: 'Terdekat',
            description: 'Cari kuliner terdekat dari lokasi Anda',
            url: '/tempat?sort=terdekat',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Tambah Tempat',
            short_name: 'Tambah',
            description: 'Kontribusikan warung atau restoran baru',
            url: '/tempat/tambah',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Tempat Favorit',
            short_name: 'Favorit',
            description: 'Buka daftar tempat yang Anda simpan',
            url: '/favorit',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-beranda.png',
            sizes: '1280x800',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Tampilan Beranda RasaAtlas di Desktop',
          },
          {
            src: '/screenshots/mobile-beranda.png',
            sizes: '412x915',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Eksplorasi Kuliner Semarang di Ponsel',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              /\/(tempat|kategori|favorit)(\/|$)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rasaatlas-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith('/images/') ||
              url.pathname.startsWith('/uploads/') ||
              url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'rasaatlas-images',
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  preview: { port: 4173 },
})
