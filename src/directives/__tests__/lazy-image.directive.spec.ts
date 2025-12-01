import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LazyImageDirective } from '../lazy-image.directive';

describe('LazyImageDirective', () => {
  let originalIntersectionObserver: typeof IntersectionObserver | undefined;
  let originalImage: typeof Image;

  beforeEach(() => {
    originalIntersectionObserver = (globalThis as any).IntersectionObserver;
    originalImage = (globalThis as any).Image;
  });

  afterEach(() => {
    (globalThis as any).IntersectionObserver = originalIntersectionObserver;
    (globalThis as any).Image = originalImage;
    document.head
      .querySelectorAll('meta[name="gemini-api-key"], meta[name="analytics-measurement-id"]')
      .forEach((meta) => meta.remove());
  });

  @Component({
    template: '<img [appLazyImage]="image" [lazySrc]="placeholder" />',
    standalone: false,
  })
  class HostComponent {
    image: string | null = null;
    placeholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  }

  it('loads new sources immediately when IntersectionObserver is unavailable', async () => {
    delete (globalThis as any).IntersectionObserver;

    class MockImage {
      srcValue = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      decoding?: string;
      referrerPolicy?: string;

      set src(value: string) {
        this.srcValue = value;
        if (value && this.onload) {
          this.onload();
        }
      }

      get src(): string {
        return this.srcValue;
      }
    }

    (globalThis as any).Image = MockImage as unknown as typeof Image;

    TestBed.configureTestingModule({
      imports: [LazyImageDirective],
      declarations: [HostComponent],
    });

    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    fixture.componentInstance.image = 'https://cdn.example.com/wallpapers/first.webp';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(img.src).toBe('https://cdn.example.com/wallpapers/first.webp');
    expect(img.classList.contains('lazy-loaded')).toBe(true);

    fixture.componentInstance.image = 'https://cdn.example.com/wallpapers/second.webp';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(img.src).toBe('https://cdn.example.com/wallpapers/second.webp');
    expect(img.classList.contains('lazy-loaded')).toBe(true);
    expect(img.classList.contains('lazy-error')).toBe(false);
  });

  it('re-observes the host element when sources change with IntersectionObserver support', async () => {
    type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;

    class MockIntersectionObserver {
      static instances: MockIntersectionObserver[] = [];
      private readonly elements = new Set<Element>();

      constructor(
        private readonly callback: IntersectionCallback,
        public readonly options?: IntersectionObserverInit
      ) {
        MockIntersectionObserver.instances.push(this);
      }

      observe = jest.fn((element: Element) => {
        this.elements.add(element);
      });

      unobserve = jest.fn((element: Element) => {
        this.elements.delete(element);
      });

      disconnect = jest.fn(() => {
        this.elements.clear();
      });

      trigger(isIntersecting: boolean): void {
        const entry: IntersectionObserverEntry = {
          time: performance.now(),
          target: Array.from(this.elements)[0] as Element,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
        };
        this.callback([entry]);
      }
    }

    (globalThis as any).IntersectionObserver = jest
      .fn()
      .mockImplementation((callback: IntersectionCallback, options?: IntersectionObserverInit) => {
        return new MockIntersectionObserver(callback, options);
      });

    class MockImage {
      srcValue = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        this.srcValue = value;
        if (value && this.onload) {
          this.onload();
        }
      }

      get src(): string {
        return this.srcValue;
      }
    }

    (globalThis as any).Image = MockImage as unknown as typeof Image;

    TestBed.configureTestingModule({
      imports: [LazyImageDirective],
      declarations: [HostComponent],
    });

    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    fixture.componentInstance.image = 'https://cdn.example.com/wallpapers/initial.webp';
    fixture.detectChanges();
    await fixture.whenStable();

    const observerInstance = MockIntersectionObserver.instances[0];
    expect(observerInstance).toBeDefined();

    observerInstance.trigger(true);
    await fixture.whenStable();

    expect(img.src).toBe('https://cdn.example.com/wallpapers/initial.webp');

    fixture.componentInstance.image = 'https://cdn.example.com/wallpapers/refresh.webp';
    fixture.detectChanges();
    await fixture.whenStable();

    observerInstance.trigger(true);
    await fixture.whenStable();

    expect(img.src).toBe('https://cdn.example.com/wallpapers/refresh.webp');
    expect(observerInstance.observe).toHaveBeenCalled();
  });

  it('removes lazy metadata when the bound source is cleared', async () => {
    delete (globalThis as any).IntersectionObserver;

    class MockImage {
      srcValue = '';
      onload: (() => void) | null = null;

      set src(value: string) {
        this.srcValue = value;
        if (value && this.onload) {
          this.onload();
        }
      }

      get src(): string {
        return this.srcValue;
      }
    }

    (globalThis as any).Image = MockImage as unknown as typeof Image;

    TestBed.configureTestingModule({
      imports: [LazyImageDirective],
      declarations: [HostComponent],
    });

    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    fixture.componentInstance.image = 'https://cdn.example.com/stateful.webp';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(img.dataset.lazySrc).toBeUndefined();
    expect(img.classList.contains('lazy-loaded')).toBe(true);
    const previousSrc = img.getAttribute('src');

    fixture.componentInstance.image = null;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(img.dataset.lazySrc).toBeUndefined();
    expect(img.classList.contains('lazy-loaded')).toBe(false);
    expect(img.classList.contains('lazy-error')).toBe(false);
    expect(img.getAttribute('src')).toBe(previousSrc);
  });

  it('marks the host with error styling when loading fails', async () => {
    delete (globalThis as any).IntersectionObserver;

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        if (this.onerror) {
          this.onerror();
        }
      }
    }

    (globalThis as any).Image = MockImage as unknown as typeof Image;

    TestBed.configureTestingModule({
      imports: [LazyImageDirective],
      declarations: [HostComponent],
    });

    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');

    fixture.componentInstance.image = 'https://cdn.example.com/error.webp';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(img.classList.contains('lazy-error')).toBe(true);
    expect(img.classList.contains('lazy-loaded')).toBe(false);
  });
});
