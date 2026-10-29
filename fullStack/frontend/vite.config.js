import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // React, el router e i18next cambian muy poco: en un chunk aparte el navegador
        // los conserva en caché aunque cambie el código de la app
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|use-sync-external-store)[\\/]/.test(id)) return "vendor-react";
          if (/[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/.test(id)) return "vendor-i18n";
        },
      },
    },
  },
  // Vitest: componentes en un DOM simulado (jsdom); npm test
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
