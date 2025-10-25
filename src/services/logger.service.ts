import { Injectable } from '@angular/core';
import { CACHE_CONFIG } from '../constants';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: unknown;
  source?: string;
}

/**
 * Centralized logging service with configurable log levels
 * and optional persistent storage for debugging.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private logLevel: LogLevel;
  private logHistory: LogEntry[] = [];
  private readonly maxHistorySize = CACHE_CONFIG.MAX_CACHE_SIZE;

  constructor() {
    // In production, set to WARN or ERROR to reduce noise
    this.logLevel = LogLevel.DEBUG;
  }

  /**
   * Set the minimum log level. Logs below this level will be ignored.
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log a debug message.
   */
  public debug(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  /**
   * Log an info message.
   */
  public info(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  /**
   * Log a warning message.
   */
  public warn(message: string, data?: unknown, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  /**
   * Log an error message.
   */
  public error(message: string, error?: unknown, source?: string): void {
    this.log(LogLevel.ERROR, message, error, source);
  }

  /**
   * Internal logging implementation.
   */
  private log(level: LogLevel, message: string, data?: unknown, source?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output
    const prefix = source ? `[${source}]` : '';
    const timestamp = entry.timestamp.toISOString();

    // Use structured logging for better debugging
    switch (level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(`${timestamp} DEBUG ${prefix}:`, message, data || '');
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(`${timestamp} INFO ${prefix}:`, message, data || '');
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(`${timestamp} WARN ${prefix}:`, message, data || '');
        break;
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(`${timestamp} ERROR ${prefix}:`, message, data || '');
        break;
    }
  }

  /**
   * Get the log history (useful for debugging).
   */
  public getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear the log history.
   */
  public clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON for debugging or support.
   */
  public exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}
