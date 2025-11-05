import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Initialize console to terminal forwarding in development
import './lib/consoleToTerminal';
import { AuthProvider } from '@/auth/hooks/AuthContext';
import { SessionCacheProvider } from '@customer/components/shared/cache/SessionCacheProvider';
import { supabase } from '@lib/supabase';

// Import console filter test in development
if (import.meta.env.DEV) {
  import('./lib/consoleFilterTest');
}

const RootApp = () => {
  const [customerId, setCustomerId] = useState<string | undefined>();

  useEffect(() => {
    const getCustomerId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCustomerId(user?.id);
    };
    getCustomerId();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionCacheProvider customerId={customerId}>
          <App />
        </SessionCacheProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
