import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
// 로컬 개발은 HTTPS(basic-ssl) 대신 평문 + dev 프록시(server.proxy)를 사용한다.
export default defineConfig(() => ({
  plugins: [
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
  }, // ─────────────────────────────────────────────────────────────────────
  // 로컬 개발 프록시
  //
  // Vite dev (`pnpm dev`, 5173)가 /api/* 요청을 vercel dev(3000)로 forward.
  // vercel dev가 api/session/create.ts 같은 서버리스 함수를 실행하고,
  // 함수 내부에서 VITE_SESSION_API_URL(로컬: http://localhost:3300/api/session)로
  // 다시 forward → mavo-api 처리. production과 동일한 흐름.
  //
  // 실행:
  //   터미널 1: cd mavo-api && pnpm dev          # mavo-api on :3300
  //   터미널 2: cd mindthos-web && vercel dev    # functions on :3000
  //   터미널 3: cd mindthos-web && pnpm dev      # SPA on :5173
  // ─────────────────────────────────────────────────────────────────────
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // mindthos-server (NestJS) — /v1/* REST API.
      // 로컬에서 :3000이 다른 앱에 점유돼 서버를 :3001로 띄움(docker-compose.override).
      '/v1': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // AI-chatbot-layer (FastAPI, :8400) — 임시 로컬 챗봇 데모.
      // /chatbot/v1/chat → :8400/v1/chat 로 forward.
      '/chatbot': {
        target: 'http://localhost:8400',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chatbot/, ''),
      },
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
