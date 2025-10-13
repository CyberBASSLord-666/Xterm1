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

  @Input()
  set appLazyImage(value: string | null) {
    const nextValue = value ?? null;
    const previousValue = this.targetSrc;
    this.targetSrc = nextValue;

    if (previousValue !== nextValue) {
      this.hasLoaded = false;
    }
    const element = this.elementRef.nativeElement;

    if (this.hasLoaded) {
      if (this.targetSrc) {
        this.loadImage(element, this.targetSrc);
      } else {
        element.removeAttribute('src');
      }
    } else if (this.targetSrc) {
      element.dataset.lazySrc = this.targetSrc;
    } else {
      delete element.dataset.lazySrc;
    }
  }

  @Input() lazySrc?: string; // Optional placeholder image
  @Input() lazyThreshold: number = 0.1; // Percentage of image visible before loading

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;

    if (this.lazySrc) {
      element.src = this.lazySrc;
    }

    if (!this.targetSrc) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      this.loadImage(element, this.targetSrc);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const img = entry.target as HTMLImageElement;
          const src = this.targetSrc ?? img.dataset.lazySrc;

          if (src) {
            this.loadImage(img, src);
          }

          this.observer?.unobserve(img);
        });
      },
      {
        threshold: this.lazyThreshold,
        rootMargin: '50px'
      }
    );

    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private loadImage(element: HTMLImageElement, src: string): void {
    const resolvedSrc = src;
    const tempImg = new Image();

    tempImg.onload = () => {
      element.src = resolvedSrc;
      element.classList.add('lazy-loaded');
      element.classList.remove('lazy-error');
      this.hasLoaded = true;
    };

    tempImg.onerror = () => {
      element.classList.add('lazy-error');
    };

    tempImg.src = resolvedSrc;
  }
}
