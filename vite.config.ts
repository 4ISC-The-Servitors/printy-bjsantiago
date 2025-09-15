import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('/src/components/admin/') || id.includes('/src/pages/admin/')) {
            return 'admin-components';
          }
          if (id.includes('/src/components/customer/') || id.includes('/src/pages/customer/')) {
            return 'customer-components';
          }
          if (id.includes('/src/components/shared/')) {
            return 'shared-components';
          }
          if (id.includes('/src/chatLogic/')) {
            return 'chat-logic';
          }
        },
      },
    },
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
  },
});
