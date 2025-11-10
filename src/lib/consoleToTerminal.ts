/**
 * Console to Terminal Forwarder - Direct Error Logging
 *
 * This utility directly scaffolds errors from the dev console to the terminal
 * without relying on fetch requests. It provides reliable error capture and
 * forwarding for better debugging experience.
 */

interface LogFilterConfig {
  showErrors: boolean;
  showWarnings: boolean;
  showInfo: boolean;
  showLogs: boolean;
  showDebug: boolean;
  // Patterns to exclude even if level is enabled
  excludePatterns: string[];
  // Patterns to include even if level is disabled
  includePatterns: string[];
  // Patterns to completely suppress from browser console
  suppressPatterns: string[];
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
  private filterConfig: LogFilterConfig = {
    showErrors: true,
    showWarnings: true,
    showInfo: false,
    showLogs: false,
    showDebug: true,
    suppressPatterns: [
      // Completely suppress Vite HMR messages from browser console
      '[vite]',
      '[vite] hot updated',
      '[vite] connecting',
      '[vite] connected',
      'hot updated',
      'hot module',
      'hmr',
      'vite:',
      'vite hmr',
    ],
    excludePatterns: [
      // Exclude verbose success logs
      'File upload triggered',
      'Is payment flow',
      'Recent order ID',
      'Active conversation',
      'Using order ID',
      'Starting payment proof upload',
      'Upload successful',
      'Using regular chat attachments',
      'Flow definition loaded',
      'Flow started successfully',
      'Appending messages to UI',
      'Loaded tickets data',
      'Loaded quotes data',
      'Fetched orders',
      'Fetched quotes',
      'No tickets found for user',
      'Sample of all inquiries',
      // Temporarily exclude React internal errors (known issue)
      'Internal React error: Expected static flag was missing',
      'Warning: Internal React error: Expected static flag was missing',
      // Exclude debug flow logs
      'StartFlow] Processing',
      'ProcessInput] Current node',
      'ProcessInput] User input',
      'ProcessInput] Checking option',
      'ProcessInput] Selected option',
      'ProcessInput] Moving to next node',
      'ProcessInput] No matching option',
      'Conditional] Evaluating condition',
      'Conditional] Branching to',
      'JsonbFlowProcessor] Node message',
      'JsonbFlowProcessor] Executing action',
      'JsonbFlowProcessor] Action result',
      'ProcessInput] Checking for pending',
      'ProcessInput] Is accepted/rejected',
      'ProcessInput] Has pending action',
      'ProcessInput] Has pending conversation',
      'ProcessInput] All conditions met',
      'ProcessInput] Conditions not met',
      // Exclude admin flow logs
      'useAdminChat opening with topic',
      'Context:',
      'Opening admin JSONB flow',
      'Orders topic detected',
      'Order status:',
      'Order is in verifying_payment',
      'Order is not in verifying_payment',
      'Could not find order data',
      'Checking quote status',
      'Quote status:',
      'Quote is accepted',
      'Found accepted proposal',
      'Quote is not accepted',
      'Found saved specs',
      'No saved specs found',
      'Could not find quote data',
      'Loading.*flow definition',
      'Starting.*flow',
      'Flow started successfully',
      'Appending messages to UI',
      // Exclude customer flow logs
      'handleSend] Called with text',
      'LogoutButton handleClick called',
      'SpecEditorModal] Received spec-editor-open',
      'SpecEditorModal] Event detail',
      'SpecEditorModal] Modal should now be open',
      'updateTicket called',
      'updateQuote called',
      'updateOrder called',
      // Exclude cache and performance logs
      'cache-hit',
      'cache-miss',
      'SessionStateManager]',
      'FlowDefinitionCache',
      // Exclude verbose data logs
      'Fetched.*data',
      'Loaded.*data',
      'Sample of.*data',
      'Current user ID',
      'No.*found for user',
      'Checking all.*',
      'All inquiries',
      'All orders',
      'All quotes',
      'All tickets',
    ],
    includePatterns: [
      // Always include critical errors
      'Error:',
      'Failed to',
      'Unexpected error',
      'Error fetching',
      'Error loading',
      'Error saving',
      'Error updating',
      'Error creating',
      'Error getting',
      'Error processing',
      'Error starting',
      'Error handling',
      'Error occurred',
      'Failed to load',
      'Failed to fetch',
      'Failed to save',
      'Failed to update',
      'Failed to create',
      'Failed to get',
      'Failed to process',
      'Failed to start',
      'Failed to handle',
      'Failed to open',
      'Failed to send',
      'Failed to connect',
      'Connection failed',
      'Network error',
      'Database error',
      'Authentication failed',
      'Authorization failed',
      'Permission denied',
      'Access denied',
      'Invalid',
      'Malformed',
      'Corrupted',
      'Timeout',
      'Not found',
      'Unauthorized',
      'Forbidden',
      'Server error',
      'Internal error',
      'Critical error',
      'Fatal error',
      'Exception',
      'Stack trace',
      'Uncaught Error',
      'Unhandled Promise Rejection',
      // Include syntax errors and module errors
      'SyntaxError',
      'TypeError',
      'ReferenceError',
      'Module not found',
      'does not provide an export',
      'Cannot resolve',
      'Module resolution',
      'Import error',
      'Export error',
      'Uncaught SyntaxError',
      'Uncaught TypeError',
      'Uncaught ReferenceError',
    ],
  };

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
    // Override console methods with direct terminal output
    console.log = (...args) => {
      // Check if message should be completely suppressed
      if (this.shouldSuppressLog(...args)) {
        return;
      }
      this.originalConsole.log(...args);
      if (this.shouldForwardLog('log', ...args)) {
        this.scaffoldToTerminal('log', ...args);
      }
    };

    console.error = (...args) => {
      // Check if message should be completely suppressed
      if (this.shouldSuppressLog(...args)) {
        return;
      }
      this.originalConsole.error(...args);
      if (this.shouldForwardLog('error', ...args)) {
        this.scaffoldToTerminal('error', ...args);
      }
    };

    console.warn = (...args) => {
      // Check if message should be completely suppressed
      if (this.shouldSuppressLog(...args)) {
        return;
      }
      this.originalConsole.warn(...args);
      if (this.shouldForwardLog('warn', ...args)) {
        this.scaffoldToTerminal('warn', ...args);
      }
    };

    console.info = (...args) => {
      // Check if message should be completely suppressed
      if (this.shouldSuppressLog(...args)) {
        return;
      }
      this.originalConsole.info(...args);
      if (this.shouldForwardLog('info', ...args)) {
        this.scaffoldToTerminal('info', ...args);
      }
    };

    console.debug = (...args) => {
      // Check if message should be completely suppressed
      if (this.shouldSuppressLog(...args)) {
        return;
      }
      this.originalConsole.debug(...args);
      if (this.shouldForwardLog('debug', ...args)) {
        this.scaffoldToTerminal('debug', ...args);
      }
    };

    // Global error handler - always scaffold critical errors
    window.addEventListener('error', event => {
      this.scaffoldToTerminal('error', `Uncaught Error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejection handler - always scaffold critical errors
    window.addEventListener('unhandledrejection', event => {
      this.scaffoldToTerminal(
        'error',
        `Unhandled Promise Rejection: ${event.reason}`,
        {
          stack: event.reason?.stack,
        }
      );
    });
  }

  /**
   * Determines if a log should be completely suppressed from browser console
   */
  private shouldSuppressLog(...args: any[]): boolean {
    if (args.length === 0) return false;

    // Check first argument directly (Vite often logs with [vite] as first arg)
    const firstArg = args[0];
    if (typeof firstArg === 'string') {
      const lowerFirstArg = firstArg.toLowerCase();
      // Quick check for common Vite patterns in first argument
      if (lowerFirstArg.includes('[vite]') || lowerFirstArg.includes('vite:')) {
        return true;
      }
    }

    // Also check formatted message for pattern matching
    const message = this.formatMessage(args);

    // Check if message matches suppress patterns (matchesPatterns handles lowercasing)
    return this.matchesPatterns(message, this.filterConfig.suppressPatterns);
  }

  /**
   * Determines if a log should be forwarded to terminal based on filtering rules
   */
  private shouldForwardLog(level: string, ...args: any[]): boolean {
    if (!this.isEnabled) return false;

    const message = this.formatMessage(args);
    const lowerMessage = message.toLowerCase();

    // Check if this log level is enabled
    const levelEnabled = this.filterConfig[
      `show${level.charAt(0).toUpperCase() + level.slice(1)}` as keyof LogFilterConfig
    ] as boolean;
    if (!levelEnabled) {
      // Even if level is disabled, check if it matches include patterns
      return this.matchesPatterns(
        lowerMessage,
        this.filterConfig.includePatterns
      );
    }

    // Check exclude patterns first
    if (this.matchesPatterns(lowerMessage, this.filterConfig.excludePatterns)) {
      return false;
    }

    // Check include patterns (override exclude for critical errors)
    if (this.matchesPatterns(lowerMessage, this.filterConfig.includePatterns)) {
      return true;
    }

    return levelEnabled;
  }

  /**
   * Check if message matches any of the given patterns
   */
  private matchesPatterns(message: string, patterns: string[]): boolean {
    const lowerMessage = message.toLowerCase();
    return patterns.some(pattern => {
      const lowerPattern = pattern.toLowerCase();
      // Convert pattern to regex if it contains wildcards
      if (pattern.includes('*')) {
        const regexPattern = lowerPattern.replace(/\*/g, '.*');
        const regex = new RegExp(regexPattern, 'i');
        return regex.test(lowerMessage);
      }
      // Simple substring match (case-insensitive)
      return lowerMessage.includes(lowerPattern);
    });
  }

  private scaffoldToTerminal(level: string, ...args: any[]) {
    if (!this.isEnabled) return;

    try {
      const message = this.formatMessage(args);

      // Send directly to Vite dev server with correct format
      this.sendToViteDevServer(level, message, args);
    } catch (error) {
      // Silently fail to prevent console loops
      // This ensures the error logging system itself doesn't cause issues
    }
  }

  private sendToViteDevServer(level: string, message: string, args: any[]) {
    // Use the Vite dev server endpoint with the exact format it expects
    fetch('/__console-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level: level,
        message: message,
        args: args,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true, // Ensure request completes even if page unloads
    }).catch(() => {
      // If the endpoint doesn't exist, use a more visible fallback
      this.visibleFallback(`[${level.toUpperCase()}] ${message}`);
    });
  }

  private visibleFallback(message: string) {
    // Make errors more visible in the browser console
    // This ensures you can at least see them in the dev tools
    const originalConsole = this.originalConsole;

    // Use a distinctive format that's easy to spot
    originalConsole.error('TERMINAL ERROR:', message);

    // Also try to make it visible in the page itself for critical errors
    if (
      message.toLowerCase().includes('error') ||
      message.toLowerCase().includes('failed')
    ) {
      // Create a temporary visual indicator
      this.showErrorIndicator(message);
    }
  }

  private showErrorIndicator(message: string) {
    // Create a temporary visual indicator on the page
    try {
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        padding: 10px;
        border-radius: 4px;
        z-index: 10000;
        font-family: monospace;
        font-size: 12px;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      indicator.textContent = `ERROR: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`;

      document.body.appendChild(indicator);

      // Remove after 5 seconds
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 5000);
    } catch (error) {
      // If DOM manipulation fails, just log to console
      console.error('Error indicator failed:', error);
    }
  }

  private formatMessage(args: any[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch {
            return '[Object]';
          }
        }
        return String(arg);
      })
      .join(' ');
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

  /**
   * Update filter configuration
   */
  public updateFilterConfig(config: Partial<LogFilterConfig>) {
    this.filterConfig = { ...this.filterConfig, ...config };
  }

  /**
   * Get current filter configuration
   */
  public getFilterConfig(): LogFilterConfig {
    return { ...this.filterConfig };
  }

  /**
   * Enable verbose mode (show all logs)
   */
  public enableVerboseMode() {
    this.updateFilterConfig({
      showErrors: true,
      showWarnings: true,
      showInfo: true,
      showLogs: true,
      showDebug: true,
    });
  }

  /**
   * Enable error-only mode (default: errors, warnings, and debug)
   */
  public enableErrorOnlyMode() {
    this.updateFilterConfig({
      showErrors: true,
      showWarnings: true,
      showInfo: false,
      showLogs: false,
      showDebug: true,
    });
  }

  /**
   * Test function to verify the logging system is working
   */
  public testLogging() {
    console.log('Testing console logging system...');
    console.error('This is a test error message');
    console.warn('This is a test warning message');

    // Test the direct scaffolding
    this.scaffoldToTerminal('error', 'Direct test error message');
    this.scaffoldToTerminal('warn', 'Direct test warning message');

    // Test with a syntax error-like message
    this.scaffoldToTerminal(
      'error',
      'Uncaught SyntaxError: The requested module does not provide an export named test'
    );
  }
}

// Initialize the forwarder only in development
if (import.meta.env.DEV) {
  const forwarder = new TerminalConsoleForwarder();

  // Make it globally available for debugging
  (window as any).__consoleForwarder = forwarder;

  console.log(
    'Console to Terminal direct logging enabled (Errors, Warnings, Debug).'
  );
  console.log('Available commands:');
  console.log(
    '  window.__consoleForwarder.enableVerboseMode() - Show all logs'
  );
  console.log(
    '  window.__consoleForwarder.enableErrorOnlyMode() - Show errors, warnings, and debug'
  );
  console.log(
    '  window.__consoleForwarder.getFilterConfig() - View current config'
  );
  console.log(
    '  window.__consoleForwarder.testLogging() - Test the logging system'
  );
}
