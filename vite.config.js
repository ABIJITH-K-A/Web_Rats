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
    exclude: ['@vercel/analytics/react'], // Lazy load analytics
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    brotliSize: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-core': ['firebase/app', 'firebase/auth'],
          'firebase-db': ['firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['lucide-react'],
          'animation': ['gsap', '@studio-freight/lenis', 'lenis/react'],
          'analytics': ['@vercel/analytics/react'],
          'charts': ['recharts', 'react-is'],
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.png|jpe?g|svg|gif|tiff?|bmp|ico$/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false, // Disable sourcemaps for production to reduce size
  },
  server: {
    // Enable compression for dev server testing
    compress: true,
  },
})
