import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './components/providers/AuthInitializer';
import { ToastProvider } from './components/ui/composites/Toast';
import ErrorBoundary from './feature/error/components/ErrorBoundary';
import { router } from './router';
import './lib/env';
import './styles/tailwind.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
