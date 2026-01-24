import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      stream: "stream-browserify",
      buffer: "buffer/",
      process: "process/browser",
    },
  },
  optimizeDeps: {
    include: ['simple-peer', 'buffer', 'process'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  plugins: [
    react(),
    tailwindcss()
  ],
})