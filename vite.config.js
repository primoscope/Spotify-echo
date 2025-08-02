import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Entry point for the React application
  root: 'src/frontend',
  
  // Build configuration
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    
    // Generate manifest for cache busting
    manifest: true,
    
    // Optimize chunks
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/frontend/index.html')
      },
      output: {
        // Organize assets
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return 'assets/media/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          if (extType === 'css') {
            return 'assets/css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Target modern browsers
    target: 'es2020'
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    
    // Proxy API requests to the backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  
  // Preview server configuration (for production build testing)
  preview: {
    port: 4173,
    host: true
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/frontend'),
      '@components': resolve(__dirname, 'src/frontend/components'),
      '@contexts': resolve(__dirname, 'src/frontend/contexts'),
      '@styles': resolve(__dirname, 'src/frontend/styles'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  
  // CSS configuration
  css: {
    postcss: {
      plugins: [
        // Add autoprefixer for better browser compatibility
        require('autoprefixer')
      ]
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/variables.scss";`
      }
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom'
    ]
  }
});