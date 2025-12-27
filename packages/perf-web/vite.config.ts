import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  server: {
    // Allow importing the workspace bindings source.
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
