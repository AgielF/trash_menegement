import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Konfigurasi PWA: SW hanya meng-cache aset statis (app shell).
// Respons API TIDAK di-cache; sumber data offline adalah Dexie (lihat playbook 3.9/3.10).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [],
      },
      manifest: {
        name: 'Bersihku',
        short_name: 'Bersihku',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // TODO-sesuai-Figma: ganti dengan warna dan ikon resmi dari Figma.
        theme_color: '#00dc5a',
        background_color: '#eff5f3',
        icons: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['src/shared/lib/**', 'src/config/**', 'src/features/**/*.{ts,tsx}'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
})
