import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // rapier (física) pesa ~2 MB por su WebAssembly embebido; carga en diferido
    chunkSizeWarningLimit: 2200,
    // sin manualChunks: las escenas 3D se importan con lazy() (Lazy3D.jsx) y
    // Rollup ya separa three/rapier en chunks diferidos. Forzarlos a mano
    // metía helpers compartidos dentro del chunk de three y obligaba a
    // descargar 1 MB de three.js al abrir la página.
  },
})
