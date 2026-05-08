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
    include: ['recharts', 'react-is', 'firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
    exclude: ['@vercel/analytics/react'], // Lazy load analytics
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    brotliSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('lucide-react')) return 'ui-vendor';
          if (id.includes('recharts') || id.includes('react-is')) return 'charts';
          if (id.includes('@vercel/analytics')) return 'analytics';
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]';
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
