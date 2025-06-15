import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🔧 Vite config with CSP fix for Amplify development
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis', // Fix for AWS SDK
  },
  server: {
    // 🔒 CSP headers for development
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.amazonaws.com https://*.amplifyapp.com wss://*; img-src 'self' data: https:; font-src 'self' data:;"
    }
  },
  optimizeDeps: {
    // 🔧 Pre-bundle AWS SDK to avoid CSP issues
    include: [
      '@aws-amplify/core',
      '@aws-amplify/api',
      '@aws-amplify/auth',
      '@aws-amplify/storage',
      '@aws-amplify/ui-react',
      '@aws-amplify/ui-react-storage'
    ]
  }
})