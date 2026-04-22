import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
//
// VITE_DEMO_MODE=1 gives us a build that works when the user opens
// dist/index.html directly: assets via relative paths + HashRouter (see App.tsx).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "demo" ? "./" : "/",
}));
