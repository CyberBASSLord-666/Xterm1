import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

/**
 * Directive for lazy loading images using Intersection Observer.
 * Usage: <img [appLazyImage]="imageUrl" [lazySrc]="placeholderUrl">
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private targetSrc: string | null = null;
  private hasLoaded = false;
  private isInitialized = false;
  private isObservationActive = false;
  private lastIntersectionEntry?: IntersectionObserverEntry;
  private readonly intersectionSupported = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  private pendingSourceSwap = false;
  private currentLoadToken: symbol | null = null;
  private _lazyThreshold = 0.1;

  @Input()
  set appLazyImage(value: string | null) {
    const nextValue = value ?? null;

    if (this.targetSrc === nextValue) {
      return;
    }

    this.targetSrc = nextValue;
    this.hasLoaded = false;
    this.pendingSourceSwap = nextValue !== null;

    const element = this.elementRef.nativeElement;

    if (!this.isInitialized) {
      this.syncDataset(element);
      return;
    }

    this.applySourceChange(element);
  }

  @Input() lazySrc?: string; // Optional placeholder image

  @Input()
  set lazyThreshold(value: number) {
    const normalized = this.normalizeThreshold(value);
    if (this._lazyThreshold === normalized) {
      return;
    }

    this._lazyThreshold = normalized;

    if (this.observer) {
      const element = this.elementRef.nativeElement;
      this.observer.disconnect();
      this.observer = undefined;
      this.isObservationActive = false;
      if (this.isInitialized && this.targetSrc) {
        this.applySourceChange(element);
      }
    }
  }

  get lazyThreshold(): number {
    return this._lazyThreshold;
  }

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    this.isInitialized = true;

    if (this.lazySrc) {
      element.src = this.lazySrc;
    }

    if (this.targetSrc) {
      this.applySourceChange(element);
    } else if (this.intersectionSupported) {
      this.ensureObserver(element);
    }
  }

  ngOnDestroy(): void {
    const element = this.elementRef.nativeElement;
    if (this.observer) {
      if (this.isObservationActive) {
        this.observer.unobserve(element);
        this.isObservationActive = false;
      }
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.currentLoadToken = null;
  }

  private applySourceChange(element: HTMLImageElement): void {
    if (!this.targetSrc) {
      this.pendingSourceSwap = false;
      delete element.dataset.lazySrc;
      if (!this.lazySrc) {
        element.removeAttribute('src');
      }
      element.classList.remove('lazy-loaded');
      return;
    }

    if (!this.intersectionSupported) {
      this.loadImage(element, this.targetSrc);
      return;
    }

    this.ensureObserver(element);

    if (this.lastIntersectionEntry?.isIntersecting && this.lastIntersectionEntry.target === element) {
      this.loadImage(element, this.targetSrc);
      return;
    }

    element.dataset.lazySrc = this.targetSrc;

    if (!this.isObservationActive && this.observer) {
      this.observer.observe(element);
      this.isObservationActive = true;
    }
  }

  private ensureObserver(element: HTMLImageElement): void {
    if (this.observer || !this.intersectionSupported) {
      return;
    }

    const hostElement = element;
    this.observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (entry.target !== hostElement) {
            return;
          }

          this.lastIntersectionEntry = entry;

          if (!entry.isIntersecting && entry.intersectionRatio <= 0) {
            return;
          }

          const img = entry.target as HTMLImageElement;
          const candidate = this.targetSrc ?? img.dataset.lazySrc ?? null;

          if (!candidate) {
            return;
          }

          const alreadyLoaded = !this.pendingSourceSwap && this.hasLoaded && img.src === candidate;
          if (alreadyLoaded) {
            return;
          }

          this.loadImage(img, candidate);
        });
      },
      {
        threshold: this._lazyThreshold,
        rootMargin: '50px'
      }
    );
  }

  private syncDataset(element: HTMLImageElement): void {
    if (this.targetSrc) {
      element.dataset.lazySrc = this.targetSrc;
    } else {
      delete element.dataset.lazySrc;
    }
  }

  private normalizeThreshold(value: number): number {
    if (Number.isFinite(value)) {
      const clamped = Math.min(Math.max(value, 0), 1);
      return Number.isNaN(clamped) ? 0.1 : clamped;
    }
    return 0.1;
  }

  private loadImage(element: HTMLImageElement, src: string): void {
    const resolvedSrc = src;
    const loadToken = Symbol('lazy-image-load');
    this.currentLoadToken = loadToken;

    const tempImg = new Image();
    tempImg.decoding = 'async';
    tempImg.referrerPolicy = 'no-referrer';

    tempImg.onload = () => {
      if (this.currentLoadToken !== loadToken) {
        return;
      }

      element.src = resolvedSrc;
      delete element.dataset.lazySrc;
      element.classList.add('lazy-loaded');
      element.classList.remove('lazy-error');
      this.hasLoaded = true;
      this.pendingSourceSwap = false;
    };

    tempImg.onerror = () => {
      if (this.currentLoadToken !== loadToken) {
        return;
      }

      element.classList.add('lazy-error');
      element.classList.remove('lazy-loaded');
    };

    tempImg.src = resolvedSrc;
  }
}
