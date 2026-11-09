import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@krok/core': r('../../packages/core/src/index.ts'),
      '@krok/content': r('../../packages/content/src/index.ts'),
    },
  },
  build: { chunkSizeWarningLimit: 2500 },
})
