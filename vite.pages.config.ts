import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/japan-msme-ai-cases/",
  plugins: [react()],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
