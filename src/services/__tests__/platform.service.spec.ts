import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { PlatformService } from '../platform.service';

describe('PlatformService', () => {
  describe('Browser Platform', () => {
    let service: PlatformService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(PlatformService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should identify as browser platform', () => {
      expect(service.isBrowser).toBe(true);
    });

    it('should return window object', () => {
      expect(service.getWindow()).toBe(window);
    });

    it('should return document object', () => {
      expect(service.getDocument()).toBe(document);
    });

    it('should return localStorage', () => {
      expect(service.getLocalStorage()).toBe(localStorage);
    });

    it('should return sessionStorage', () => {
      expect(service.getSessionStorage()).toBe(sessionStorage);
    });

    it('should return location', () => {
      expect(service.getLocation()).toBe(location);
    });

    it('should return navigator', () => {
      expect(service.getNavigator()).toBe(navigator);
    });

    it('should return screen', () => {
      expect(service.getScreen()).toBe(screen);
    });

    it('should return performance', () => {
      expect(service.getPerformance()).toBe(performance);
    });

    it('should execute callback in browser context', () => {
      const callback = jest.fn(() => 'result');
      const result = service.runInBrowser(callback);
      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should execute callback in browser context with fallback', () => {
      const callback = jest.fn(() => 'result');
      const result = service.runInBrowserOrFallback(callback, 'fallback');
      expect(callback).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should set and clear timeout', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const id = service.setTimeout(callback, 1000);
      expect(id).toBeDefined();
      jest.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should set and clear interval', () => {
      jest.useFakeTimers();
      const callback = jest.fn();
      const id = service.setInterval(callback, 1000);
      expect(id).toBeDefined();
      jest.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(2);
      service.clearInterval(id);
      jest.useRealTimers();
    });

    it('should add and remove event listener', () => {
      const target = document.createElement('div');
      const listener = jest.fn();
      service.addEventListener(target, 'click', listener);
      target.click();
      expect(listener).toHaveBeenCalled();
      service.removeEventListener(target, 'click', listener);
    });

    it('should create and dispatch custom event', () => {
      const target = document.createElement('div');
      const listener = jest.fn();
      target.addEventListener('custom', listener);
      const event = service.createCustomEvent('custom', { data: 'test' });
      expect(event).toBeDefined();
      if (event) {
        service.dispatchEvent(target, event);
        expect(listener).toHaveBeenCalled();
      }
    });

    it('should match media query', () => {
      const result = service.matchMedia('(min-width: 768px)');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('matches');
    });
  });

  describe('Server Platform', () => {
    let service: PlatformService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(PlatformService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should identify as non-browser platform', () => {
      expect(service.isBrowser).toBe(false);
    });

    it('should return undefined for window', () => {
      expect(service.getWindow()).toBeUndefined();
    });

    it('should return undefined for document', () => {
      expect(service.getDocument()).toBeUndefined();
    });

    it('should return undefined for localStorage', () => {
      expect(service.getLocalStorage()).toBeUndefined();
    });

    it('should return undefined for sessionStorage', () => {
      expect(service.getSessionStorage()).toBeUndefined();
    });

    it('should return undefined for location', () => {
      expect(service.getLocation()).toBeUndefined();
    });

    it('should return undefined for navigator', () => {
      expect(service.getNavigator()).toBeUndefined();
    });

    it('should return undefined for screen', () => {
      expect(service.getScreen()).toBeUndefined();
    });

    it('should return undefined for performance', () => {
      expect(service.getPerformance()).toBeUndefined();
    });

    it('should not execute callback in non-browser context', () => {
      const callback = jest.fn(() => 'result');
      const result = service.runInBrowser(callback);
      expect(callback).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return fallback in non-browser context', () => {
      const callback = jest.fn(() => 'result');
      const result = service.runInBrowserOrFallback(callback, 'fallback');
      expect(callback).not.toHaveBeenCalled();
      expect(result).toBe('fallback');
    });

    it('should not set timeout in non-browser context', () => {
      const callback = jest.fn();
      const id = service.setTimeout(callback, 1000);
      expect(id).toBeUndefined();
    });

    it('should not set interval in non-browser context', () => {
      const callback = jest.fn();
      const id = service.setInterval(callback, 1000);
      expect(id).toBeUndefined();
    });

    it('should not add event listener in non-browser context', () => {
      const listener = jest.fn();
      // This should not throw and should be a no-op
      expect(() => {
        service.addEventListener(undefined, 'click', listener);
      }).not.toThrow();
    });

    it('should not create custom event in non-browser context', () => {
      const event = service.createCustomEvent('custom', { data: 'test' });
      expect(event).toBeUndefined();
    });

    it('should return false for confirm in non-browser context', () => {
      expect(service.confirm('Test message')).toBe(false);
    });

    it('should not throw on alert in non-browser context', () => {
      expect(() => {
        service.alert('Test message');
      }).not.toThrow();
    });

    it('should return undefined for matchMedia in non-browser context', () => {
      const result = service.matchMedia('(min-width: 768px)');
      expect(result).toBeUndefined();
    });
  });
});
