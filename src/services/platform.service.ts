import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Platform service providing SSR-safe abstractions for browser globals.
 * All browser-specific APIs should be accessed through this service to ensure
 * server-side rendering compatibility.
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private platformId = inject(PLATFORM_ID);
  public readonly isBrowser: boolean = isPlatformBrowser(this.platformId);

  /**
   * Get the window object in a type-safe, SSR-safe manner.
   * @returns Window object if in browser, undefined otherwise
   */
  getWindow(): Window | undefined {
    return this.isBrowser ? window : undefined;
  }

  /**
   * Get the document object in a type-safe, SSR-safe manner.
   * @returns Document object if in browser, undefined otherwise
   */
  getDocument(): Document | undefined {
    return this.isBrowser ? document : undefined;
  }

  /**
   * Get localStorage in an SSR-safe manner.
   * @returns Storage object if available, undefined otherwise
   */
  getLocalStorage(): Storage | undefined {
    return this.isBrowser && typeof localStorage !== 'undefined' ? localStorage : undefined;
  }

  /**
   * Get sessionStorage in an SSR-safe manner.
   * @returns Storage object if available, undefined otherwise
   */
  getSessionStorage(): Storage | undefined {
    return this.isBrowser && typeof sessionStorage !== 'undefined' ? sessionStorage : undefined;
  }

  /**
   * Get location object in an SSR-safe manner.
   * @returns Location object if in browser, undefined otherwise
   */
  getLocation(): Location | undefined {
    return this.isBrowser ? location : undefined;
  }

  /**
   * Get navigator object in an SSR-safe manner.
   * @returns Navigator object if in browser, undefined otherwise
   */
  getNavigator(): Navigator | undefined {
    return this.isBrowser ? navigator : undefined;
  }

  /**
   * Check if matchMedia is available and execute a media query.
   * @param query Media query string
   * @returns MediaQueryList if available, undefined otherwise
   */
  matchMedia(query: string): MediaQueryList | undefined {
    const win = this.getWindow();
    return win && win.matchMedia ? win.matchMedia(query) : undefined;
  }

  /**
   * Get the screen object in an SSR-safe manner.
   * @returns Screen object if in browser, undefined otherwise
   */
  getScreen(): Screen | undefined {
    return this.isBrowser && typeof screen !== 'undefined' ? screen : undefined;
  }

  /**
   * Get performance API in an SSR-safe manner.
   * @returns Performance object if available, undefined otherwise
   */
  getPerformance(): Performance | undefined {
    return this.isBrowser && typeof performance !== 'undefined' ? performance : undefined;
  }

  /**
   * Execute a callback only if in browser context.
   * @param callback Function to execute
   * @returns Result of callback if in browser, undefined otherwise
   */
  runInBrowser<T>(callback: () => T): T | undefined {
    return this.isBrowser ? callback() : undefined;
  }

  /**
   * Execute a callback only if in browser context, with fallback.
   * @param callback Function to execute in browser
   * @param fallback Value to return if not in browser
   * @returns Result of callback if in browser, fallback otherwise
   */
  runInBrowserOrFallback<T>(callback: () => T, fallback: T): T {
    return this.isBrowser ? callback() : fallback;
  }

  /**
   * Set a timeout in an SSR-safe manner.
   * @param callback Function to execute
   * @param delay Delay in milliseconds
   * @returns Timer ID if in browser, undefined otherwise
   */
  setTimeout(callback: () => void, delay: number): number | undefined {
    return this.isBrowser ? window.setTimeout(callback, delay) : undefined;
  }

  /**
   * Clear a timeout in an SSR-safe manner.
   * @param id Timer ID to clear
   */
  clearTimeout(id: number | undefined): void {
    if (this.isBrowser && id !== undefined) {
      window.clearTimeout(id);
    }
  }

  /**
   * Set an interval in an SSR-safe manner.
   * @param callback Function to execute
   * @param delay Delay in milliseconds
   * @returns Timer ID if in browser, undefined otherwise
   */
  setInterval(callback: () => void, delay: number): number | undefined {
    return this.isBrowser ? window.setInterval(callback, delay) : undefined;
  }

  /**
   * Clear an interval in an SSR-safe manner.
   * @param id Timer ID to clear
   */
  clearInterval(id: number | undefined): void {
    if (this.isBrowser && id !== undefined) {
      window.clearInterval(id);
    }
  }

  /**
   * Add an event listener in an SSR-safe manner.
   * @param target Event target (window, document, element)
   * @param type Event type
   * @param listener Event listener function
   * @param options Event listener options
   */
  addEventListener<K extends keyof WindowEventMap>(
    target: Window | Document | EventTarget | undefined,
    type: K | string,
    listener: (this: Window, ev: WindowEventMap[K] | Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (this.isBrowser && target) {
      target.addEventListener(type, listener as EventListener, options);
    }
  }

  /**
   * Remove an event listener in an SSR-safe manner.
   * @param target Event target (window, document, element)
   * @param type Event type
   * @param listener Event listener function
   * @param options Event listener options
   */
  removeEventListener<K extends keyof WindowEventMap>(
    target: Window | Document | EventTarget | undefined,
    type: K | string,
    listener: (this: Window, ev: WindowEventMap[K] | Event) => void,
    options?: boolean | EventListenerOptions
  ): void {
    if (this.isBrowser && target) {
      target.removeEventListener(type, listener as EventListener, options);
    }
  }

  /**
   * Dispatch a custom event in an SSR-safe manner.
   * @param target Event target
   * @param event Event to dispatch
   * @returns true if event was dispatched, false otherwise
   */
  dispatchEvent(target: EventTarget | undefined, event: Event): boolean {
    if (this.isBrowser && target) {
      return target.dispatchEvent(event);
    }
    return false;
  }

  /**
   * Create a CustomEvent in an SSR-safe manner.
   * @param type Event type
   * @param detail Event detail
   * @returns CustomEvent if in browser, undefined otherwise
   */
  createCustomEvent<T>(type: string, detail?: T): CustomEvent<T> | undefined {
    return this.isBrowser ? new CustomEvent(type, { detail }) : undefined;
  }

  /**
   * Show a native confirm dialog in an SSR-safe manner.
   * @param message Message to display
   * @returns true if confirmed, false otherwise (always false in SSR)
   */
  confirm(message: string): boolean {
    return this.isBrowser ? window.confirm(message) : false;
  }

  /**
   * Show a native alert dialog in an SSR-safe manner.
   * @param message Message to display
   */
  alert(message: string): void {
    if (this.isBrowser) {
      window.alert(message);
    }
  }
}
