/**
 * Service Composition Patterns
 * Advanced patterns for composing and orchestrating services with professional rigor
 */

import { inject, InjectionToken, Type } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

/**
 * Service lifecycle hook interface
 */
export interface ServiceLifecycle {
  onInit?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

/**
 * Base service class with lifecycle management
 */
export abstract class BaseService implements ServiceLifecycle {
  private readonly destroySubject = new Subject<void>();
  protected readonly destroy$ = this.destroySubject.asObservable();

  /**
   * Called when service is initialized
   */
  public onInit(): void | Promise<void> {
    // Override in subclass
  }

  /**
   * Called when service is destroyed
   */
  public onDestroy(): void | Promise<void> {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
}

/**
 * Service registry for managing service instances
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services = new Map<Type<unknown>, unknown>();

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service instance
   */
  public register<T>(token: Type<T>, instance: T): void {
    this.services.set(token, instance);
  }

  /**
   * Get a registered service
   */
  public get<T>(token: Type<T>): T | undefined {
    return this.services.get(token) as T | undefined;
  }

  /**
   * Check if a service is registered
   */
  public has<T>(token: Type<T>): boolean {
    return this.services.has(token);
  }

  /**
   * Unregister a service
   */
  public unregister<T>(token: Type<T>): boolean {
    return this.services.delete(token);
  }

  /**
   * Clear all services
   */
  public clear(): void {
    this.services.clear();
  }
}

/**
 * Service state management using BehaviorSubject
 */
export class ServiceState<T> {
  private readonly state$: BehaviorSubject<T>;

  constructor(initialState: T) {
    this.state$ = new BehaviorSubject<T>(initialState);
  }

  /**
   * Get current state value
   */
  public get value(): T {
    return this.state$.value;
  }

  /**
   * Get state as Observable
   */
  public get observable(): Observable<T> {
    return this.state$.asObservable();
  }

  /**
   * Update state
   */
  public update(updater: Partial<T> | ((state: T) => T)): void {
    if (typeof updater === 'function') {
      this.state$.next(updater(this.value));
    } else {
      this.state$.next({ ...this.value, ...updater });
    }
  }

  /**
   * Reset state to initial value
   */
  public reset(initialState: T): void {
    this.state$.next(initialState);
  }

  /**
   * Complete the state observable
   */
  public complete(): void {
    this.state$.complete();
  }
}

/**
 * Create a typed injection token with default value
 */
export function createInjectionToken<T>(
  description: string,
  factory?: () => T
): InjectionToken<T> {
  return new InjectionToken<T>(description, {
    providedIn: 'root',
    factory: factory as () => T,
  });
}

/**
 * Service dependency injection helper
 */
export function injectService<T>(token: Type<T> | InjectionToken<T>): T {
  return inject(token);
}

/**
 * Lazy service loader
 */
export class LazyServiceLoader<T> {
  private instance: T | null = null;
  private loading = false;

  constructor(private loader: () => Promise<T>) {}

  /**
   * Load service lazily
   */
  public async load(): Promise<T> {
    if (this.instance) {
      return this.instance;
    }

    if (this.loading) {
      // Wait for loading to complete using promise-based approach
      await new Promise<void>((resolve) => {
        const checkLoading = (): void => {
          if (!this.loading) {
            resolve();
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
      return this.instance!;
    }

    this.loading = true;
    try {
      this.instance = await this.loader();
      return this.instance;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Check if service is loaded
   */
  public get isLoaded(): boolean {
    return this.instance !== null;
  }

  /**
   * Unload service
   */
  public unload(): void {
    this.instance = null;
  }
}

/**
 * Service factory pattern
 */
export interface ServiceFactory<T> {
  create(...args: unknown[]): T;
}

/**
 * Abstract service factory
 */
export abstract class AbstractServiceFactory<T> implements ServiceFactory<T> {
  abstract create(...args: unknown[]): T;

  /**
   * Create multiple instances
   */
  public createMany(count: number, ...args: unknown[]): T[] {
    return Array.from({ length: count }, () => this.create(...args));
  }
}

/**
 * Service pool for reusing instances
 */
export class ServicePool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();

  constructor(
    private factory: () => T,
    private maxSize: number = 10
  ) {}

  /**
   * Acquire a service instance from the pool
   */
  public acquire(): T {
    let instance = this.available.pop();

    if (!instance) {
      instance = this.factory();
    }

    this.inUse.add(instance);
    return instance;
  }

  /**
   * Release a service instance back to the pool
   */
  public release(instance: T): void {
    if (!this.inUse.has(instance)) {
      return;
    }

    this.inUse.delete(instance);

    if (this.available.length < this.maxSize) {
      this.available.push(instance);
    }
  }

  /**
   * Get pool statistics
   */
  public getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }

  /**
   * Clear the pool
   */
  public clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}
