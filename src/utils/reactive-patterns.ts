/**
 * Advanced Reactive Patterns
 *
 * Professional-grade reactive programming patterns for Angular applications.
 * Provides advanced signal compositions, reactive state machines, and effect utilities.
 */

import { Signal, WritableSignal, signal, computed, effect } from '@angular/core';

/**
 * Async signal that loads data on demand
 */
export interface AsyncSignal<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  reload: () => Promise<void>;
  reset: () => void;
}

export function createAsyncSignal<T>(
  loader: () => Promise<T>,
  initialValue: T | null = null
): AsyncSignal<T> {
  const data = signal<T | null>(initialValue);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const reload = async (): Promise<void> => {
    loading.set(true);
    error.set(null);
    try {
      const result = await loader();
      data.set(result);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
    } finally {
      loading.set(false);
    }
  };

  const reset = (): void => {
    data.set(initialValue);
    loading.set(false);
    error.set(null);
  };

  return {
    data: data.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    reload,
    reset,
  };
}

/**
 * Reactive state machine
 */
export type StateTransition<S extends string, E extends string> = {
  from: S;
  event: E;
  to: S;
  guard?: () => boolean;
  action?: () => void;
};

export interface StateMachine<S extends string, E extends string> {
  current: Signal<S>;
  can: (event: E) => boolean;
  transition: (event: E) => boolean;
  onEnter: (state: S, callback: () => void) => void;
  onExit: (state: S, callback: () => void) => void;
}

export function createStateMachine<S extends string, E extends string>(
  initialState: S,
  transitions: StateTransition<S, E>[]
): StateMachine<S, E> {
  const current = signal(initialState);
  const enterCallbacks = new Map<S, Array<() => void>>();
  const exitCallbacks = new Map<S, Array<() => void>>();

  const can = (event: E): boolean => {
    const currentState = current();
    const transition = transitions.find(
      (t) => t.from === currentState && t.event === event
    );
    if (!transition) return false;
    if (transition.guard && !transition.guard()) return false;
    return true;
  };

  const transition = (event: E): boolean => {
    if (!can(event)) return false;

    const currentState = current();
    const trans = transitions.find(
      (t) => t.from === currentState && t.event === event
    );

    if (!trans) return false;

    // Exit current state
    const exitCbs = exitCallbacks.get(currentState);
    if (exitCbs) {
      exitCbs.forEach((cb) => cb());
    }

    // Execute transition action
    if (trans.action) {
      trans.action();
    }

    // Enter new state
    current.set(trans.to);
    const enterCbs = enterCallbacks.get(trans.to);
    if (enterCbs) {
      enterCbs.forEach((cb) => cb());
    }

    return true;
  };

  const onEnter = (state: S, callback: () => void): void => {
    if (!enterCallbacks.has(state)) {
      enterCallbacks.set(state, []);
    }
    enterCallbacks.get(state)!.push(callback);
  };

  const onExit = (state: S, callback: () => void): void => {
    if (!exitCallbacks.has(state)) {
      exitCallbacks.set(state, []);
    }
    exitCallbacks.get(state)!.push(callback);
  };

  return {
    current: current.asReadonly(),
    can,
    transition,
    onEnter,
    onExit,
  };
}

/**
 * Computed signal with caching and staleness
 */
export interface CachedComputed<T> {
  value: Signal<T>;
  refresh: () => void;
  isStale: Signal<boolean>;
}

export function createCachedComputed<T>(
  computeFn: () => T,
  staleAfterMs: number = 5000
): CachedComputed<T> {
  const cached = signal<T>(computeFn());
  const lastUpdate = signal(Date.now());
  const isStale = computed(() => Date.now() - lastUpdate() > staleAfterMs);

  const refresh = (): void => {
    cached.set(computeFn());
    lastUpdate.set(Date.now());
  };

  // Auto-refresh when stale
  effect(() => {
    if (isStale()) {
      refresh();
    }
  });

  return {
    value: cached.asReadonly(),
    refresh,
    isStale,
  };
}

/**
 * Reactive collection with CRUD operations
 */
export interface ReactiveCollection<T, K = string> {
  items: Signal<T[]>;
  byId: Signal<Map<K, T>>;
  add: (item: T) => void;
  addMany: (items: T[]) => void;
  update: (id: K, updates: Partial<T>) => void;
  remove: (id: K) => void;
  clear: () => void;
  find: (predicate: (item: T) => boolean) => T | undefined;
  filter: (predicate: (item: T) => boolean) => T[];
  get: (id: K) => T | undefined;
  has: (id: K) => boolean;
  count: Signal<number>;
}

export function createReactiveCollection<T, K = string>(
  idExtractor: (item: T) => K,
  initialItems: T[] = []
): ReactiveCollection<T, K> {
  const items = signal<T[]>(initialItems);
  const byId = computed(() => {
    const map = new Map<K, T>();
    for (const item of items()) {
      map.set(idExtractor(item), item);
    }
    return map;
  });

  const add = (item: T): void => {
    items.update((current) => [...current, item]);
  };

  const addMany = (newItems: T[]): void => {
    items.update((current) => [...current, ...newItems]);
  };

  const update = (id: K, updates: Partial<T>): void => {
    items.update((current) =>
      current.map((item) =>
        idExtractor(item) === id ? { ...item, ...updates } : item
      )
    );
  };

  const remove = (id: K): void => {
    items.update((current) => current.filter((item) => idExtractor(item) !== id));
  };

  const clear = (): void => {
    items.set([]);
  };

  const find = (predicate: (item: T) => boolean): T | undefined => {
    return items().find(predicate);
  };

  const filter = (predicate: (item: T) => boolean): T[] => {
    return items().filter(predicate);
  };

  const get = (id: K): T | undefined => {
    return byId().get(id);
  };

  const has = (id: K): boolean => {
    return byId().has(id);
  };

  const count = computed(() => items().length);

  return {
    items: items.asReadonly(),
    byId,
    add,
    addMany,
    update,
    remove,
    clear,
    find,
    filter,
    get,
    has,
    count,
  };
}

/**
 * Undo/Redo state manager
 */
export interface UndoRedo<T> {
  current: Signal<T>;
  canUndo: Signal<boolean>;
  canRedo: Signal<boolean>;
  commit: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export function createUndoRedo<T>(
  initialState: T,
  maxHistory: number = 50
): UndoRedo<T> {
  const history = signal<T[]>([initialState]);
  const currentIndex = signal(0);

  const current = computed(() => history()[currentIndex()]);
  const canUndo = computed(() => currentIndex() > 0);
  const canRedo = computed(() => currentIndex() < history().length - 1);

  const commit = (newState: T): void => {
    const index = currentIndex();
    const hist = history();

    // Remove any redo history
    const newHistory = hist.slice(0, index + 1);
    newHistory.push(newState);

    // Limit history size
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    } else {
      currentIndex.update((i) => i + 1);
    }

    history.set(newHistory);
  };

  const undo = (): void => {
    if (canUndo()) {
      currentIndex.update((i) => i - 1);
    }
  };

  const redo = (): void => {
    if (canRedo()) {
      currentIndex.update((i) => i + 1);
    }
  };

  const clear = (): void => {
    history.set([initialState]);
    currentIndex.set(0);
  };

  return {
    current,
    canUndo,
    canRedo,
    commit,
    undo,
    redo,
    clear,
  };
}

/**
 * Batch signal updates
 */
export function batchSignalUpdates(updates: Array<() => void>): void {
  // Angular's signals automatically batch updates within the same execution context
  // This is a convenience wrapper for clarity
  updates.forEach((update) => update());
}

/**
 * Effect with cleanup
 */
export function effectWithCleanup(
  effectFn: () => (() => void) | void
): () => void {
  let cleanup: (() => void) | void;

  const stopEffect = effect(() => {
    // Run previous cleanup
    if (cleanup) {
      cleanup();
    }
    // Run effect and get new cleanup
    cleanup = effectFn();
  });

  // Return function to stop effect and run final cleanup
  return () => {
    if (cleanup) {
      cleanup();
    }
    stopEffect();
  };
}

/**
 * Reactive derived state with transform
 */
export function derived<T, R>(
  source: Signal<T>,
  transform: (value: T) => R
): Signal<R> {
  return computed(() => transform(source()));
}

/**
 * Combine multiple signals into one
 */
export function combine<T extends unknown[]>(
  ...signals: { [K in keyof T]: Signal<T[K]> }
): Signal<T> {
  return computed(() => signals.map((s) => s()) as T);
}

/**
 * Signal that only updates when value actually changes (deep equality)
 */
export function distinctSignal<T>(initialValue: T): WritableSignal<T> {
  const sig = signal(initialValue);

  return {
    ...sig,
    set: (value: T) => {
      if (JSON.stringify(value) !== JSON.stringify(sig())) {
        sig.set(value);
      }
    },
    update: (updateFn: (value: T) => T) => {
      const newValue = updateFn(sig());
      if (JSON.stringify(newValue) !== JSON.stringify(sig())) {
        sig.set(newValue);
      }
    },
  } as WritableSignal<T>;
}

/**
 * Create a signal that persists to localStorage
 */
export function persistedSignal<T>(
  key: string,
  initialValue: T
): WritableSignal<T> {
  // Try to load from localStorage
  let loadedValue = initialValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      loadedValue = JSON.parse(stored);
    }
  } catch (e) {
    // Ignore parse errors
  }

  const sig = signal(loadedValue);

  // Save to localStorage on change
  effect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(sig()));
    } catch (e) {
      // Ignore storage errors
    }
  });

  return sig;
}
