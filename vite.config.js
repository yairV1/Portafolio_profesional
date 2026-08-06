import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('rapier')) return 'rapier'
            if (id.includes('three') || id.includes('@react-three')) return 'three'
            if (id.includes('gsap') || id.includes('framer-motion') || id.includes('lenis')) return 'motion'
          }
        }
      }
    }
  }
})
