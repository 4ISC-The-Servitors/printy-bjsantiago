import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Initialize console to terminal forwarding in development
import './lib/consoleToTerminal';
import { AuthProvider } from '@/auth/hooks/AuthContext';

// Import console filter test in development
if (import.meta.env.DEV) {
  import('./lib/consoleFilterTest');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
