import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './lib/env'; // Validate environment variables on startup
import './styles/tailwind.css';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
