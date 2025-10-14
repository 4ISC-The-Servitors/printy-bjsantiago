/**
 * Console to Terminal Forwarder
 * 
 * This utility intercepts browser console logs and forwards them to the terminal
 * via a Vite middleware endpoint. This allows developers to see console output
 * directly in their terminal instead of opening the browser dev tools.
 */

interface ConsoleLogData {
  level: string;
  message: string;
  args: any[];
  timestamp: string;
  stack?: string;
}

class TerminalConsoleForwarder {
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };
  private isEnabled: boolean = true;

  constructor() {
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Override console methods
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.forwardToTerminal('log', ...args);
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.forwardToTerminal('error', ...args);
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.forwardToTerminal('warn', ...args);
    };

    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.forwardToTerminal('info', ...args);
    };

    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      this.forwardToTerminal('debug', ...args);
    };

    // Global error handler
    window.addEventListener('error', (event) => {
      this.forwardToTerminal('error', `Uncaught Error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.forwardToTerminal('error', `Unhandled Promise Rejection: ${event.reason}`, {
        stack: event.reason?.stack
      });
    });
  }

  private forwardToTerminal(level: string, ...args: any[]) {
    if (!this.isEnabled) return;

    try {
      const logData: ConsoleLogData = {
        level,
        message: this.formatMessage(args),
        args: this.serializeArgs(args),
        timestamp: new Date().toISOString()
      };

      // Send to terminal via fetch (non-blocking)
      fetch('/__console-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      }).catch(() => {
        // Silently fail if the endpoint is not available
        // This prevents infinite loops or errors during build
      });
    } catch (error) {
      // Silently fail to prevent console loops
    }
  }

  private formatMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');
  }

  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return '[Circular or Non-serializable Object]';
        }
      }
      return arg;
    });
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public restore() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }
}

// Initialize the forwarder only in development
if (import.meta.env.DEV) {
  const forwarder = new TerminalConsoleForwarder();
  
  // Make it globally available for debugging
  (window as any).__consoleForwarder = forwarder;
  
  console.log('Console to Terminal forwarding enabled. Use window.__consoleForwarder to control.');
}
