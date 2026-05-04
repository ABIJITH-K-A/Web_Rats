import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['recharts', 'react-is', 'lenis/react', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['lucide-react', '@vercel/analytics/react'],
          'animation': ['gsap', '@studio-freight/lenis', 'lenis/react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
