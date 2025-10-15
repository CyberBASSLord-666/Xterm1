import { TestBed } from '@angular/core/testing';
import { ToastService } from '../toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch a toast custom event with message', (done) => {
    const testMessage = 'Test toast message';

    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      expect(customEvent.detail).toBe(testMessage);
      window.removeEventListener('toast', eventListener);
      done();
    };

    window.addEventListener('toast', eventListener);
    service.show(testMessage);
  });

  it('should handle multiple toast messages', () => {
    const messages: string[] = [];
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      messages.push(customEvent.detail);
    };

    window.addEventListener('toast', eventListener);

    service.show('Message 1');
    service.show('Message 2');
    service.show('Message 3');

    expect(messages).toEqual(['Message 1', 'Message 2', 'Message 3']);

    window.removeEventListener('toast', eventListener);
  });

  it('should handle empty string message', (done) => {
    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      expect(customEvent.detail).toBe('');
      window.removeEventListener('toast', eventListener);
      done();
    };

    window.addEventListener('toast', eventListener);
    service.show('');
  });

  it('should handle special characters in message', (done) => {
    const specialMessage = 'Test <>&"\' message!@#$%';

    const eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      expect(customEvent.detail).toBe(specialMessage);
      window.removeEventListener('toast', eventListener);
      done();
    };

    window.addEventListener('toast', eventListener);
    service.show(specialMessage);
  });
});
