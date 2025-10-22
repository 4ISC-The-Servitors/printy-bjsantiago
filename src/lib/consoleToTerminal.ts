/**
 * Console to Terminal Forwarder - Error-Only Mode
 * 
 * This utility intercepts browser console logs and forwards only critical errors
 * to the terminal via a Vite middleware endpoint. This provides a clean terminal
 * output focused on actual issues rather than verbose success logs.
 */

interface ConsoleLogData {
  level: string;
  message: string;
  args: any[];
  timestamp: string;
  stack?: string;
}

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
    showDebug: false,
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
      'Loaded tickets data',
      'Loaded quotes data',
      'Fetched orders',
      'Fetched quotes',
      'No tickets found for user',
      'Sample of all inquiries',
      'Loaded tickets data',
      'Loaded quotes data',
      'Fetched orders',
      'Fetched quotes',
      'No tickets found for user',
      'Sample of all inquiries',
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
      'All tickets'
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
      'Unhandled Promise Rejection'
    ]
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
    // Override console methods with filtering
    console.log = (...args) => {
      this.originalConsole.log(...args);
      if (this.shouldForwardLog('log', ...args)) {
        this.forwardToTerminal('log', ...args);
      }
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      if (this.shouldForwardLog('error', ...args)) {
        this.forwardToTerminal('error', ...args);
      }
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      if (this.shouldForwardLog('warn', ...args)) {
        this.forwardToTerminal('warn', ...args);
      }
    };

    console.info = (...args) => {
      this.originalConsole.info(...args);
      if (this.shouldForwardLog('info', ...args)) {
        this.forwardToTerminal('info', ...args);
      }
    };

    console.debug = (...args) => {
      this.originalConsole.debug(...args);
      if (this.shouldForwardLog('debug', ...args)) {
        this.forwardToTerminal('debug', ...args);
      }
    };

    // Global error handler - always forward critical errors
    window.addEventListener('error', (event) => {
      this.forwardToTerminal('error', `Uncaught Error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler - always forward critical errors
    window.addEventListener('unhandledrejection', (event) => {
      this.forwardToTerminal('error', `Unhandled Promise Rejection: ${event.reason}`, {
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Determines if a log should be forwarded to terminal based on filtering rules
   */
  private shouldForwardLog(level: string, ...args: any[]): boolean {
    if (!this.isEnabled) return false;

    const message = this.formatMessage(args);
    const lowerMessage = message.toLowerCase();

    // Check if this log level is enabled
    const levelEnabled = this.filterConfig[`show${level.charAt(0).toUpperCase() + level.slice(1)}` as keyof LogFilterConfig] as boolean;
    if (!levelEnabled) {
      // Even if level is disabled, check if it matches include patterns
      return this.matchesPatterns(lowerMessage, this.filterConfig.includePatterns);
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
    return patterns.some(pattern => {
      // Convert pattern to regex if it contains wildcards
      if (pattern.includes('*')) {
        const regexPattern = pattern.replace(/\*/g, '.*');
        const regex = new RegExp(regexPattern, 'i');
        return regex.test(message);
      }
      // Simple substring match
      return message.includes(pattern.toLowerCase());
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
      showDebug: true
    });
  }

  /**
   * Enable error-only mode (default)
   */
  public enableErrorOnlyMode() {
    this.updateFilterConfig({
      showErrors: true,
      showWarnings: true,
      showInfo: false,
      showLogs: false,
      showDebug: false
    });
  }
}

// Initialize the forwarder only in development
if (import.meta.env.DEV) {
  const forwarder = new TerminalConsoleForwarder();
  
  // Make it globally available for debugging
  (window as any).__consoleForwarder = forwarder;
  
  console.log('Console to Terminal forwarding enabled (Error-Only Mode).');
  console.log('Available commands:');
  console.log('  window.__consoleForwarder.enableVerboseMode() - Show all logs');
  console.log('  window.__consoleForwarder.enableErrorOnlyMode() - Show only errors/warnings');
  console.log('  window.__consoleForwarder.getFilterConfig() - View current config');
}
