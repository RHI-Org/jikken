import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "localhost",
    port: 8090,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@jikken/shared": path.resolve(__dirname, "../shared/src/index.ts"),
      // The CLI's real formatter — imported for true ANSI-output parity in the
      // browser terminal. It only depends on @jikken/shared (no node deps).
      "@jikken/cli-formatter": path.resolve(__dirname, "../cli/src/formatter.ts"),
    },
  },
}));
