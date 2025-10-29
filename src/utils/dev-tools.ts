/**
 * Developer Tools - Enhanced debugging and development utilities
 * Quality of Life improvements for developers working on the application
 *
 * Note: Console statements are intentional for debugging purposes
 * eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type
 */

import { isDevMode } from '@angular/core';

export interface DevToolsConfig {
  enablePerformanceMonitoring?: boolean;
  enableMemoryTracking?: boolean;
  enableNetworkLogging?: boolean;
  enableStateInspector?: boolean;
  logComponentLifecycles?: boolean;
}

/**
 * Developer Tools for enhanced debugging experience
 */
export class DevTools {
  private static config: DevToolsConfig = {
    enablePerformanceMonitoring: true,
    enableMemoryTracking: true,
    enableNetworkLogging: false,
    enableStateInspector: true,
    logComponentLifecycles: false,
  };

  private static performanceMarks = new Map<string, number>();
  private static stateHistory: Array<{ timestamp: number; state: unknown; source: string }> = [];

  /**
   * Initialize developer tools
   */
  static initialize(config?: Partial<DevToolsConfig>): void {
    if (!isDevMode()) return;

    this.config = { ...this.config, ...config };
    this.setupGlobalDebugger();
    this.setupPerformanceMonitoring();
    console.log('🛠️ Developer Tools Initialized', this.config);
  }

  /**
   * Setup global debugger accessible from browser console
   */
  private static setupGlobalDebugger(): void {
    if (typeof window !== 'undefined') {
      (window as any).__POLLIWALL_DEBUG__ = {
        getConfig: () => this.config,
        setConfig: (config: Partial<DevToolsConfig>) => {
          this.config = { ...this.config, ...config };
          console.log('✅ DevTools config updated', this.config);
        },
        getPerformanceMarks: () => Object.fromEntries(this.performanceMarks),
        getStateHistory: () => this.stateHistory.slice(-50), // Last 50 states
        clearStateHistory: () => {
          this.stateHistory = [];
          console.log('✅ State history cleared');
        },
        logMemory: () => {
          if ((performance as any).memory) {
            const memory = (performance as any).memory;
            console.table({
              'Used Heap': `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
              'Total Heap': `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
              'Heap Limit': `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
            });
          }
        },
        help: () => {
          console.log(`
🛠️ PolliWall Developer Tools
============================

Available Commands:
------------------
__POLLIWALL_DEBUG__.getConfig()          - Get current configuration
__POLLIWALL_DEBUG__.setConfig({...})     - Update configuration
__POLLIWALL_DEBUG__.getPerformanceMarks() - Get performance measurements
__POLLIWALL_DEBUG__.getStateHistory()    - Get state change history
__POLLIWALL_DEBUG__.clearStateHistory()  - Clear state history
__POLLIWALL_DEBUG__.logMemory()          - Log current memory usage
__POLLIWALL_DEBUG__.help()               - Show this help message

Example Usage:
-------------
__POLLIWALL_DEBUG__.setConfig({ enableNetworkLogging: true })
__POLLIWALL_DEBUG__.logMemory()
          `);
        },
      };
      console.log('💡 Type __POLLIWALL_DEBUG__.help() for available commands');
    }
  }

  /**
   * Setup performance monitoring
   */
  private static setupPerformanceMonitoring(): void {
    if (!this.config.enablePerformanceMonitoring) return;

    // Monitor long tasks
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Long task threshold: 50ms
              console.warn(`🐌 Long Task Detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
            }
          }
        });
        observer.observe({ entryTypes: ['measure', 'longtask'] });
      } catch {
        // PerformanceObserver not supported
      }
    }
  }

  /**
   * Mark performance measurement start
   */
  static markStart(label: string): void {
    if (!isDevMode() || !this.config.enablePerformanceMonitoring) return;
    this.performanceMarks.set(label, performance.now());
  }

  /**
   * Mark performance measurement end and log duration
   */
  static markEnd(label: string, warnThreshold = 100): void {
    if (!isDevMode() || !this.config.enablePerformanceMonitoring) return;

    const startTime = this.performanceMarks.get(label);
    if (startTime === undefined) {
      console.warn(`⚠️ No start mark found for: ${label}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(label);

    const emoji = duration > warnThreshold ? '🐌' : '⚡';
    const logMethod = duration > warnThreshold ? console.warn : console.log;

    logMethod(`${emoji} [PERF] ${label}: ${duration.toFixed(2)}ms`);
  }

  /**
   * Measure execution time of a function
   */
  static async measure<T>(label: string, fn: () => T | Promise<T>, warnThreshold = 100): Promise<T> {
    this.markStart(label);
    try {
      const result = await fn();
      this.markEnd(label, warnThreshold);
      return result;
    } catch (error) {
      this.markEnd(label, warnThreshold);
      throw error;
    }
  }

  /**
   * Log state change for debugging
   */
  static logStateChange(source: string, newState: unknown): void {
    if (!isDevMode() || !this.config.enableStateInspector) return;

    this.stateHistory.push({
      timestamp: Date.now(),
      state: newState,
      source,
    });

    // Keep only last 100 entries
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }

    console.log(`📊 [STATE] ${source}:`, newState);
  }

  /**
   * Log component lifecycle event
   */
  static logLifecycle(component: string, lifecycle: string, data?: unknown): void {
    if (!isDevMode() || !this.config.logComponentLifecycles) return;

    console.log(`🔄 [LIFECYCLE] ${component}.${lifecycle}`, data || '');
  }

  /**
   * Log network request/response
   */
  static logNetwork(method: string, url: string, status?: number, duration?: number, error?: Error): void {
    if (!isDevMode() || !this.config.enableNetworkLogging) return;

    const emoji = error ? '❌' : status && status >= 200 && status < 300 ? '✅' : '⚠️';
    const durationStr = duration ? ` (${duration.toFixed(2)}ms)` : '';

    console.log(`${emoji} [NETWORK] ${method} ${url}${durationStr}`, {
      status,
      error: error?.message,
    });
  }

  /**
   * Assert condition and log helpful error if false
   */
  static assert(condition: boolean, message: string, context?: unknown): void {
    if (!isDevMode()) return;

    if (!condition) {
      console.error(`❌ [ASSERT] ${message}`, context);
      // Throw in development to catch issues early
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Log memory usage snapshot
   */
  static logMemorySnapshot(label: string): void {
    if (!isDevMode() || !this.config.enableMemoryTracking) return;

    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const percentage = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);

      console.log(`📊 [MEMORY] ${label}: ${usedMB}MB / ${totalMB}MB (${percentage}%)`);
    }
  }

  /**
   * Create a debug table for structured data
   */
  static table(label: string, data: unknown): void {
    if (!isDevMode()) return;
    console.log(`📋 [TABLE] ${label}:`);
    console.table(data);
  }

  /**
   * Group related console logs
   */
  static group(label: string, collapsed = false): void {
    if (!isDevMode()) return;
    if (collapsed) {
      console.groupCollapsed(`📦 ${label}`);
    } else {
      console.group(`📦 ${label}`);
    }
  }

  /**
   * End console group
   */
  static groupEnd(): void {
    if (!isDevMode()) return;
    console.groupEnd();
  }

  /**
   * Time a code block
   */
  static time(label: string): void {
    if (!isDevMode()) return;
    console.time(`⏱️ ${label}`);
  }

  /**
   * End time measurement
   */
  static timeEnd(label: string): void {
    if (!isDevMode()) return;
    console.timeEnd(`⏱️ ${label}`);
  }

  /**
   * Trace call stack
   */
  static trace(label: string): void {
    if (!isDevMode()) return;
    console.trace(`🔍 ${label}`);
  }
}
