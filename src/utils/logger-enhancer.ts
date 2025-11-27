/**
 * Logger Enhancer - Quality of Life Improvements for Development
 * Provides enhanced logging with stack traces, source maps, and actionable suggestions
 *
 * NOTE: This is a lower-level logging enhancer that augments console output.
 * It intentionally uses direct console methods because:
 * 1. LoggerService itself may use this enhancer (avoid circular dependencies)
 * 2. Provides foundational logging infrastructure
 * 3. Designed for development-time debugging and diagnostics
 * 4. Adding LoggerService dependency would create architectural anti-pattern
 */

export interface LogContext {
  component?: string;
  service?: string;
  method?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  [key: string]: unknown;
}

export interface EnhancedLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: LogContext;
  stack?: string;
  timestamp: number;
  source?: string;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Enhanced logger with stack trace analysis and better error messages
 */
export class LoggerEnhancer {
  private static isDevelopment = false;

  static setDevelopmentMode(isDev: boolean): void {
    this.isDevelopment = isDev;
  }

  /**
   * Extract meaningful stack trace with source locations
   */
  static getStackTrace(error?: Error): string[] {
    const stack = (error?.stack || new Error().stack || '').split('\n');
    return stack
      .slice(1) // Remove first line (Error message)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => !line.includes('node_modules'))
      .filter((line) => !line.includes('logger-enhancer'))
      .slice(0, 5); // Top 5 frames
  }

  /**
   * Get source location from stack trace
   */
  static getSourceLocation(): string | undefined {
    const stack = this.getStackTrace();
    if (stack.length > 0) {
      const match = stack[0].match(/\((.*):(\d+):(\d+)\)/);
      if (match) {
        const [, file, line, col] = match;
        const fileName = file.split('/').pop();
        return `${fileName}:${line}:${col}`;
      }
    }
    return undefined;
  }

  /**
   * Create enhanced log entry with context
   */
  static createLogEntry(
    level: EnhancedLogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error
  ): EnhancedLogEntry {
    return {
      level,
      message,
      context,
      stack: error ? error.stack : undefined,
      timestamp: Date.now(),
      source: this.getSourceLocation(),
    };
  }

  /**
   * Format log entry for console output with colors and formatting
   */
  static formatForConsole(entry: EnhancedLogEntry): string[] {
    const parts: string[] = [];
    const timestamp = new Date(entry.timestamp).toISOString();

    // Level badge
    const levelBadge = `[${entry.level.toUpperCase()}]`;
    parts.push(levelBadge);

    // Timestamp in development
    if (this.isDevelopment) {
      parts.push(`[${timestamp}]`);
    }

    // Source location
    if (entry.source && this.isDevelopment) {
      parts.push(`[${entry.source}]`);
    }

    // Message
    parts.push(entry.message);

    // Context
    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(`\nContext: ${JSON.stringify(entry.context, null, 2)}`);
    }

    // Stack trace in development
    if (entry.stack && this.isDevelopment) {
      parts.push(`\nStack:\n${entry.stack}`);
    }

    return parts;
  }

  /**
   * Get actionable suggestions for common errors
   */
  static getActionableSuggestion(error: Error | string): string | undefined {
    const message = typeof error === 'string' ? error : error.message;

    const suggestions: Record<string, string> = {
      'Network error': '→ Check your internet connection and try again',
      timeout: '→ The server took too long to respond. Try refreshing the page',
      'rate limit': '→ Too many requests. Please wait a moment before trying again',
      '404': '→ The requested resource was not found. Check the URL',
      '500': '→ Server error. Our team has been notified. Try again later',
      IndexedDB: '→ Browser storage error. Try clearing cache or using incognito mode',
      QuotaExceeded: '→ Storage quota exceeded. Clear some data from gallery',
      'Failed to fetch': '→ Network error. Check firewall settings or try again',
      unauthorized: '→ Please log in again to continue',
      forbidden: "→ You don't have permission to access this resource",
    };

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return suggestion;
      }
    }

    return undefined;
  }

  /**
   * Log with enhanced formatting and suggestions
   */
  static logEnhanced(level: EnhancedLogEntry['level'], message: string, context?: LogContext, error?: Error): void {
    const entry = this.createLogEntry(level, message, context, error);
    const formatted = this.formatForConsole(entry);

    // Get suggestion if error
    const suggestion = error ? this.getActionableSuggestion(error) : undefined;
    if (suggestion) {
      formatted.push(`\n💡 ${suggestion}`);
    }

    // Console output with appropriate method based on log level
    /* eslint-disable no-console */
    const consoleMethod =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'info'
            ? console.info
            : console.debug;
    consoleMethod(...formatted);
    /* eslint-enable no-console */
  }

  /**
   * Performance logging helper
   */
  static logPerformance(operation: string, duration: number, threshold = 1000): void {
    const level = duration > threshold ? 'warn' : 'info';
    const emoji = duration > threshold ? '🐌' : '⚡';
    this.logEnhanced(level, `${emoji} ${operation} completed in ${duration.toFixed(2)}ms`, {
      operation,
      duration,
      threshold,
    });
  }

  /**
   * Memory usage logging helper
   */
  static logMemoryUsage(context?: string): void {
    if (this.isDevelopment && performance && 'memory' in performance) {
      const memory = (performance as { memory: PerformanceMemory }).memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

      this.logEnhanced('info', `📊 Memory Usage ${context ? `(${context})` : ''}`, {
        used: `${usedMB}MB`,
        total: `${totalMB}MB`,
        limit: `${limitMB}MB`,
        percentage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`,
      });
    }
  }
}
