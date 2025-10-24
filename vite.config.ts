import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Custom plugin to forward console logs to terminal
const consoleToTerminalPlugin = () => {
  return {
    name: 'console-to-terminal',
    configureServer(server: any) {
      server.middlewares.use('/__console-log', (req: any, res: any) => {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const logData = JSON.parse(body);
            const timestamp = new Date().toISOString();
            const level = logData.level || 'log';
            const message = logData.message || '';
            const args = logData.args || [];

            // Color coding for different log levels
            const colors = {
              error: '\x1b[31m', // Red
              warn: '\x1b[33m', // Yellow
              info: '\x1b[36m', // Cyan
              log: '\x1b[37m', // White
              debug: '\x1b[90m', // Gray
            };
            const reset = '\x1b[0m';
            const color = colors[level as keyof typeof colors] || colors.log;

            // Enhanced logging with more details
            console.log(
              `${color}[${timestamp}] [CONSOLE-TO-TERMINAL] ${level.toUpperCase()}:${reset} ${message}`
            );
            if (args.length > 0) {
              args.forEach((arg: any, index: number) => {
                console.log(
                  `${color}  [ARG ${index}]:${reset}`,
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                );
              });
            }
          } catch (e) {
            console.log(
              `[CONSOLE-TO-TERMINAL] Failed to parse console log: ${body}`
            );
            console.log(`[CONSOLE-TO-TERMINAL] Parse error:`, e);
          }
          res.end();
        });
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), consoleToTerminalPlugin()],
  optimizeDeps: {
    include: ['tslib'],
  },
  build: {
    rollupOptions: {
      external: id => {
        // Don't externalize tslib - it should be bundled
        if (id === 'tslib') return false;
        return false;
      },
      output: {
        manualChunks: id => {
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
            if (id.includes('tslib')) {
              return 'tslib-vendor';
            }
            return 'vendor';
          }

          // Feature chunks - updated for new architecture
          if (id.includes('/src/admin/')) {
            return 'admin';
          }
          if (id.includes('/src/customer/')) {
            return 'customer';
          }
          if (id.includes('/src/guest/')) {
            return 'guest';
          }
          if (id.includes('/src/auth/')) {
            return 'auth';
          }
          if (id.includes('/src/shared/')) {
            return 'shared';
          }
          if (id.includes('/src/features/chat/')) {
            return 'chat';
          }
          if (id.includes('/src/features/quotes/')) {
            return 'quotes';
          }
        },
      },
    },
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
  },
});
