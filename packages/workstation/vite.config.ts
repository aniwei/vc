import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      bindings: path.resolve(__dirname, '../bindings/src/index.ts'),
      ui: path.resolve(__dirname, '../ui/src/Index.ts'),
      geometry: path.resolve(__dirname, '../geometry/src/index.ts'),
      painting: path.resolve(__dirname, '../painting/src/index.ts'),
      shared: path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
