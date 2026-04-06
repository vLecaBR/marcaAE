import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.test" })

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
    exclude: ["tests/e2e/**", "node_modules/**"],
    alias: {
      "@": resolve(__dirname, "./"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/e2e/",
        "**/*.d.ts",
        "**/*.config.*",
        ".next/",
        "components/ui/", // Geralmente ignoramos componentes da lib de UI puro (shadcn, radix)
      ],
    },
  },
})
