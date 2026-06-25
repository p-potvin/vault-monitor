import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

const monitorApiTarget = process.env.VITE_MONITOR_API_TARGET ?? "http://100.67.25.118:9001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: "public",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@vaultwares-themes": fileURLToPath(new URL("./vaultwares-themes", import.meta.url))
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    proxy: {
      "/monitor": {
        target: monitorApiTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
});
