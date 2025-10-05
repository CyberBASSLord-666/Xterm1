import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

/**
 * Directive for lazy loading images using Intersection Observer.
 * Usage: <img lazyImage [src]="imageUrl" [lazySrc]="placeholderUrl">
 */
// eslint-disable-next-line @angular-eslint/directive-selector
@Directive({
  selector: 'img[lazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() lazySrc?: string; // Optional placeholder image
  @Input() lazyThreshold: number = 0.1; // Percentage of image visible before loading

  private elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const element = this.elementRef.nativeElement as HTMLImageElement;

    // Set placeholder if provided
    if (this.lazySrc) {
      element.src = this.lazySrc;
    }

    // Store the actual image URL
    const actualSrc = element.getAttribute('src');
    if (!actualSrc) {
      return;
    }

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset['lazySrc'];
            
            if (src) {
              // Start loading the actual image
              const tempImg = new Image();
              tempImg.onload = () => {
                img.src = src;
                img.classList.add('lazy-loaded');
              };
              tempImg.onerror = () => {
                img.classList.add('lazy-error');
              };
              tempImg.src = src;
            }

            // Stop observing this image
            this.observer?.unobserve(img);
          }
        });
      },
      {
        threshold: this.lazyThreshold,
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    // Store actual src in data attribute and use placeholder
    element.dataset['lazySrc'] = actualSrc;
    if (this.lazySrc) {
      element.src = this.lazySrc;
    }

    // Start observing
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
