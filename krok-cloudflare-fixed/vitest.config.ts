import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@krok/core': r('./packages/core/src/index.ts'),
      '@krok/content': r('./packages/content/src/index.ts'),
    },
  },
  test: { include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'], testTimeout: 60000 },
})
