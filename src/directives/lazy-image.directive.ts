import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';

/**
 * Directive for lazy loading images using Intersection Observer.
 * Usage: <img [appLazyImage]="imageUrl" [lazySrc]="placeholderUrl">
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit, OnChanges, OnDestroy {
  @Input() appLazyImage?: string | null; // The actual image source to lazy load
  @Input() lazySrc?: string; // Optional placeholder image
  @Input() lazyThreshold: number = 0.1; // Percentage of image visible before loading

  private elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;
  private supportsIntersectionObserver: boolean = false;

  ngOnInit(): void {
    this.supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined';

    // Create the observer once during initialization if supported
    if (this.supportsIntersectionObserver) {
      this.createObserver();
    }

    this.setupImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appLazyImage'] && !changes['appLazyImage'].firstChange) {
      this.setupImage();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private createObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset?.['lazySrc'];

            if (src) {
              this.loadImage(img, src);
            }

            // Stop observing this image after loading
            this.observer?.unobserve(img);
          }
        });
      },
      {
        threshold: this.lazyThreshold,
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );
  }

  private setupImage(): void {
    const element = this.elementRef.nativeElement as HTMLImageElement;
    const actualSrc = this.appLazyImage;

    // Clear previous state
    delete element.dataset['lazySrc'];
    element.classList.remove('lazy-loaded', 'lazy-error');

    // Unobserve the element if we're changing the source
    if (this.observer) {
      this.observer.unobserve(element);
    }

    // If no source provided, just leave src as is (don't change it)
    if (!actualSrc) {
      return;
    }

    // If IntersectionObserver is not available, load immediately
    if (!this.supportsIntersectionObserver) {
      this.loadImage(element, actualSrc);
      return;
    }

    // Set placeholder if provided
    if (this.lazySrc) {
      element.src = this.lazySrc;
    }

    // Store actual src in data attribute
    element.dataset['lazySrc'] = actualSrc;

    // Start observing with the existing observer
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  private loadImage(element: HTMLImageElement, src: string): void {
    const tempImg = new Image();

    tempImg.onload = (): void => {
      element.src = src;
      element.classList.add('lazy-loaded');
      element.classList.remove('lazy-error');
      delete element.dataset['lazySrc'];
    };

    tempImg.onerror = (): void => {
      element.classList.add('lazy-error');
      element.classList.remove('lazy-loaded');
    };

    tempImg.src = src;
  }
}
