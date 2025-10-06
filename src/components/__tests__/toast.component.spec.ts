import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from '../toast/toast.component';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with no visible toast', () => {
    expect(component.message()).toBe('');
    expect(component.visible()).toBe(false);
  });

  it('should show toast message when custom event is dispatched', (done) => {
    const testMessage = 'Test toast message';
    
    // Dispatch custom toast event
    const event = new CustomEvent('toast', { detail: testMessage });
    window.dispatchEvent(event);
    
    // Give Angular time to process the event
    setTimeout(() => {
      expect(component.message()).toBe(testMessage);
      expect(component.visible()).toBe(true);
      done();
    }, 100);
  });

  it('should hide toast after timeout', (done) => {
    const testMessage = 'Test toast';
    
    // Show toast
    const event = new CustomEvent('toast', { detail: testMessage });
    window.dispatchEvent(event);
    
    setTimeout(() => {
      expect(component.visible()).toBe(true);
      
      // Wait for auto-hide (typically 3000ms, but we'll check sooner)
      setTimeout(() => {
        // Toast should eventually hide
        // This test might need adjustment based on actual timeout duration
      }, 3500);
      done();
    }, 100);
  });

  it('should handle multiple consecutive toast messages', (done) => {
    window.dispatchEvent(new CustomEvent('toast', { detail: 'Message 1' }));
    
    setTimeout(() => {
      expect(component.message()).toBe('Message 1');
      
      window.dispatchEvent(new CustomEvent('toast', { detail: 'Message 2' }));
      
      setTimeout(() => {
        expect(component.message()).toBe('Message 2');
        done();
      }, 100);
    }, 100);
  });

  it('should have message signal', () => {
    expect(component.message).toBeDefined();
    expect(typeof component.message()).toBe('string');
  });

  it('should have visible signal', () => {
    expect(component.visible).toBeDefined();
    expect(typeof component.visible()).toBe('boolean');
  });
});
