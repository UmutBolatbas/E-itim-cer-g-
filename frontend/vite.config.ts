import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // yeni surum yayinlanınca otomatik guncelle
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Ambulans Egitim Takip Sistemi",
        short_name: "Ambulans Egitim",
        description: "Acil durum personeli icin egitim videosu izleme takip uygulamasi",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // App shell (JS/CSS/HTML) cache'lenir.
        // YouTube video stream'i bilerek cache'lemiyoruz; sadece YouTube'un
        // kendi CDN'i uzerinden akacak, biz sadece arayuzu offline calistirilabilir hale getiriyoruz.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallbackDenylist: [/^\/api/], // API isteklerini service worker yakalamasin
      },
      devOptions: {
        enabled: true, // gelistirme ortaminda da PWA'yi test edebilmek icin
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Gelistirme sirasinda /api isteklerini backend'e yonlendir
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
