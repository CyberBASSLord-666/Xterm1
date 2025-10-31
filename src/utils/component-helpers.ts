/**
 * Component Helper Utilities
 *
 * Professional-grade helper utilities for Angular components.
 * Provides reactive patterns, lifecycle management, and common component operations.
 */

import { Signal, WritableSignal, computed, signal, effect, DestroyRef } from '@angular/core';
import { Subject, Observable, fromEvent, takeUntil } from 'rxjs';

/**
 * Reactive computed property that derives from multiple signals
 */
export function computedFrom<T, R>(sources: Signal<T>[], computeFn: (...values: T[]) => R): Signal<R> {
  return computed(() => {
    const values = sources.map((s) => s());
    return computeFn(...values);
  });
}

/**
 * Create a debounced signal that updates after a delay
 */
export function debouncedSignal<T>(source: Signal<T>, delay: number = 300): Signal<T> {
  const debounced = signal(source());
  let timeoutId: number | undefined;

  effect(() => {
    const value = source();
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
      debounced.set(value);
    }, delay);
  });

  return debounced.asReadonly();
}

/**
 * Create a throttled signal that updates at most once per interval
 */
export function throttledSignal<T>(source: Signal<T>, interval: number = 300): Signal<T> {
  const throttled = signal(source());
  let lastUpdate = 0;
  let timeoutId: number | undefined;

  effect(() => {
    const value = source();
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;

    if (timeSinceLastUpdate >= interval) {
      throttled.set(value);
      lastUpdate = now;
    } else {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        throttled.set(value);
        lastUpdate = Date.now();
      }, interval - timeSinceLastUpdate);
    }
  });

  return throttled.asReadonly();
}

/**
 * Track loading state for async operations
 */
export interface LoadingState {
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createLoadingState(): LoadingState {
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const execute = async <T>(fn: () => Promise<T>): Promise<T> => {
    loading.set(true);
    error.set(null);
    try {
      const result = await fn();
      loading.set(false);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      error.set(err);
      loading.set(false);
      throw err;
    }
  };

  return {
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    execute,
  };
}

/**
 * Paginated list state management
 */
export interface PaginationState<T> {
  items: Signal<T[]>;
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
  totalPages: Signal<number>;
  paginatedItems: Signal<T[]>;
  hasNext: Signal<boolean>;
  hasPrevious: Signal<boolean>;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setItems: (items: T[]) => void;
}

export function createPaginationState<T>(initialPageSize: number = 20): PaginationState<T> {
  const items = signal<T[]>([]);
  const page = signal(1);
  const pageSize = signal(initialPageSize);

  const totalPages = computed(() => {
    const total = items().length;
    const size = pageSize();
    return Math.ceil(total / size) || 1;
  });

  const paginatedItems = computed(() => {
    const allItems = items();
    const currentPage = page();
    const size = pageSize();
    const start = (currentPage - 1) * size;
    const end = start + size;
    return allItems.slice(start, end);
  });

  const hasNext = computed(() => page() < totalPages());
  const hasPrevious = computed(() => page() > 1);

  const nextPage = (): void => {
    if (hasNext()) {
      page.update((p) => p + 1);
    }
  };

  const previousPage = (): void => {
    if (hasPrevious()) {
      page.update((p) => p - 1);
    }
  };

  const goToPage = (newPage: number): void => {
    const total = totalPages();
    if (newPage >= 1 && newPage <= total) {
      page.set(newPage);
    }
  };

  const setItems = (newItems: T[]): void => {
    items.set(newItems);
    // Reset to first page when items change
    page.set(1);
  };

  return {
    items: items.asReadonly(),
    page,
    pageSize,
    totalPages,
    paginatedItems,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    goToPage,
    setItems,
  };
}

/**
 * Selection state management for lists
 */
export interface SelectionState<T> {
  selectedItems: Signal<Set<T>>;
  isSelected: (item: T) => boolean;
  toggle: (item: T) => void;
  select: (item: T) => void;
  deselect: (item: T) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  selectedCount: Signal<number>;
}

export function createSelectionState<T>(): SelectionState<T> {
  const selectedItems = signal<Set<T>>(new Set());

  const isSelected = (item: T): boolean => {
    return selectedItems().has(item);
  };

  const toggle = (item: T): void => {
    selectedItems.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const select = (item: T): void => {
    selectedItems.update((set) => {
      const newSet = new Set(set);
      newSet.add(item);
      return newSet;
    });
  };

  const deselect = (item: T): void => {
    selectedItems.update((set) => {
      const newSet = new Set(set);
      newSet.delete(item);
      return newSet;
    });
  };

  const selectAll = (items: T[]): void => {
    selectedItems.set(new Set(items));
  };

  const deselectAll = (): void => {
    selectedItems.set(new Set());
  };

  const selectedCount = computed(() => selectedItems().size);

  return {
    selectedItems: selectedItems.asReadonly(),
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    selectedCount,
  };
}

/**
 * Form field state with validation
 */
export interface FormFieldState<T> {
  value: WritableSignal<T>;
  error: Signal<string | null>;
  touched: WritableSignal<boolean>;
  valid: Signal<boolean>;
  validate: () => void;
  reset: (newValue?: T) => void;
}

export function createFormField<T>(
  initialValue: T,
  validators: Array<(value: T) => string | null> = []
): FormFieldState<T> {
  const value = signal(initialValue);
  const error = signal<string | null>(null);
  const touched = signal(false);

  const validate = (): void => {
    const currentValue = value();
    for (const validator of validators) {
      const validationError = validator(currentValue);
      if (validationError) {
        error.set(validationError);
        return;
      }
    }
    error.set(null);
  };

  const valid = computed(() => {
    // Run validation on read
    const currentValue = value();
    for (const validator of validators) {
      if (validator(currentValue)) {
        return false;
      }
    }
    return true;
  });

  const reset = (newValue?: T): void => {
    value.set(newValue !== undefined ? newValue : initialValue);
    error.set(null);
    touched.set(false);
  };

  // Validate on value change
  effect(() => {
    value();
    if (touched()) {
      validate();
    }
  });

  return {
    value,
    error: error.asReadonly(),
    touched,
    valid,
    validate,
    reset,
  };
}

/**
 * Sort state management
 */
export interface SortState<T, K extends keyof T = keyof T> {
  sortBy: WritableSignal<K | null>;
  sortDirection: WritableSignal<'asc' | 'desc'>;
  sort: (items: T[]) => T[];
  setSortBy: (key: K) => void;
  toggleDirection: () => void;
}

export function createSortState<T, K extends keyof T = keyof T>(): SortState<T, K> {
  const sortBy = signal<K | null>(null);
  const sortDirection = signal<'asc' | 'desc'>('asc');

  const sort = (items: T[]): T[] => {
    const key = sortBy();
    if (!key) return items;

    const direction = sortDirection();
    return [...items].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) return 0;

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const setSortBy = (key: K): void => {
    if (sortBy() === key) {
      toggleDirection();
    } else {
      sortBy.set(key);
      sortDirection.set('asc');
    }
  };

  const toggleDirection = (): void => {
    sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
  };

  return {
    sortBy,
    sortDirection,
    sort,
    setSortBy,
    toggleDirection,
  };
}

/**
 * Filter state management
 */
export interface FilterState<T> {
  filters: WritableSignal<Map<string, (item: T) => boolean>>;
  addFilter: (key: string, predicate: (item: T) => boolean) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  filter: (items: T[]) => T[];
}

export function createFilterState<T>(): FilterState<T> {
  const filters = signal<Map<string, (item: T) => boolean>>(new Map());

  const addFilter = (key: string, predicate: (item: T) => boolean): void => {
    filters.update((map) => {
      const newMap = new Map(map);
      newMap.set(key, predicate);
      return newMap;
    });
  };

  const removeFilter = (key: string): void => {
    filters.update((map) => {
      const newMap = new Map(map);
      newMap.delete(key);
      return newMap;
    });
  };

  const clearFilters = (): void => {
    filters.set(new Map());
  };

  const filter = (items: T[]): T[] => {
    const activeFilters = Array.from(filters().values());
    if (activeFilters.length === 0) return items;

    return items.filter((item) => {
      return activeFilters.every((predicate) => predicate(item));
    });
  };

  return {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    filter,
  };
}

/**
 * Event listener cleanup helper
 */
export function addEventListenerWithCleanup(
  target: EventTarget,
  event: string,
  handler: EventListener,
  destroyRef: DestroyRef
): void {
  target.addEventListener(event, handler);
  destroyRef.onDestroy(() => {
    target.removeEventListener(event, handler);
  });
}

/**
 * Observable to Signal converter with cleanup
 */
export function toSignal<T>(observable: Observable<T>, initialValue: T, destroyRef: DestroyRef): Signal<T> {
  const sig = signal(initialValue);
  const destroy$ = new Subject<void>();

  observable.pipe(takeUntil(destroy$)).subscribe((value) => {
    sig.set(value);
  });

  destroyRef.onDestroy(() => {
    destroy$.next();
    destroy$.complete();
  });

  return sig.asReadonly();
}

/**
 * Window resize observable with cleanup
 */
export function createResizeObservable(destroyRef: DestroyRef): Observable<Event> {
  const resize$ = fromEvent(window, 'resize');
  const destroy$ = new Subject<void>();

  destroyRef.onDestroy(() => {
    destroy$.next();
    destroy$.complete();
  });

  return resize$.pipe(takeUntil(destroy$));
}

/**
 * Intersection observer helper for lazy loading
 */
export interface IntersectionOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionOptions,
  destroyRef?: DestroyRef
): IntersectionObserver {
  const observer = new IntersectionObserver(callback, options);

  if (destroyRef) {
    destroyRef.onDestroy(() => {
      observer.disconnect();
    });
  }

  return observer;
}

/**
 * Scroll position tracker
 */
export interface ScrollState {
  scrollY: Signal<number>;
  scrollX: Signal<number>;
  scrollingDown: Signal<boolean>;
  scrollingUp: Signal<boolean>;
  atTop: Signal<boolean>;
  atBottom: Signal<boolean>;
}

export function createScrollTracker(element: HTMLElement | Window = window, destroyRef: DestroyRef): ScrollState {
  const scrollY = signal(0);
  const scrollX = signal(0);
  const previousY = signal(0);

  const scrollingDown = computed(() => scrollY() > previousY());
  const scrollingUp = computed(() => scrollY() < previousY());
  const atTop = computed(() => scrollY() === 0);

  const atBottom = computed(() => {
    if (element === window) {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      return scrollY() + windowHeight >= documentHeight - 10;
    } else {
      const el = element as HTMLElement;
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    }
  });

  const handleScroll = (): void => {
    previousY.set(scrollY());
    if (element === window) {
      scrollY.set(window.scrollY);
      scrollX.set(window.scrollX);
    } else {
      const el = element as HTMLElement;
      scrollY.set(el.scrollTop);
      scrollX.set(el.scrollLeft);
    }
  };

  addEventListenerWithCleanup(element, 'scroll', handleScroll, destroyRef);

  // Initialize
  handleScroll();

  return {
    scrollY: scrollY.asReadonly(),
    scrollX: scrollX.asReadonly(),
    scrollingDown,
    scrollingUp,
    atTop,
    atBottom,
  };
}
