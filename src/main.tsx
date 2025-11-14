import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { ToastProvider } from './components/ui/composites/Toast';
import ErrorBoundary from './feature/error/components/ErrorBoundary';
import { ThemeProvider } from './providers/ThemeProvider';
import { router } from './router';
import './lib/env';
import './styles/tailwind.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);
