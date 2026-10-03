import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    allowedHosts: ["kajar.dev.aisergateway.dev.br", "kajar.prod.aisergateway.dev.br"],
  },
  preview: { port: 4174 },
});
