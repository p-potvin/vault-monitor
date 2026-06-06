import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const monitorApiTarget = process.env.VITE_MONITOR_API_TARGET ?? "http://127.0.0.1:9001";

export default defineConfig({
  plugins: [react()],
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
