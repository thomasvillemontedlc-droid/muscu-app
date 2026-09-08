import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' -> chemins relatifs dans le build, pour pouvoir déployer l'app
// sous n'importe quel sous-dossier (GitHub Pages, etc.) sans reconfigurer.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Muscu',
        short_name: 'Muscu',
        description: 'Suivi de séances de musculation, hors-ligne',
        start_url: '.',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
      // permet de tester le service worker / mode hors-ligne avec `npm run dev`
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
