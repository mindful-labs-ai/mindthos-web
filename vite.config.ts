import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [
    // 로컬 심리검사 해석 QA 중 localhost CORS 재현을 위해 dev HTTPS를 비활성화한다.
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-xyflow': ['@xyflow/react'],
          'vendor-pdf': ['@react-pdf/renderer', 'html2canvas', 'html-to-image'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
