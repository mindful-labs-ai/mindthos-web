import { StrictMode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import './lib/env';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { router } from './app/router';
import { AppInitialize } from './app/router/protecter/AppInitialize';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './shared/ui/composites/Toast';
import ErrorBoundary from './widgets/error/ErrorBoundary';
import './styles/tailwind.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <RouterProvider router={router} />
            <AppInitialize />
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
