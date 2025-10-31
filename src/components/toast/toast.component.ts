import { Component, signal, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UI_CONFIG } from '../../constants';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent implements OnInit, OnDestroy {
  message = signal<string | null>(null);
  private timeoutId: number | undefined;

  private handleToast = (event: Event): void => {
    const customEvent = event as CustomEvent<string>;
    this.message.set(customEvent.detail);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = window.setTimeout(() => {
      this.message.set(null);
    }, UI_CONFIG.TOAST_DURATION);
  };

  public ngOnInit(): void {
    window.addEventListener('toast', this.handleToast);
  }

  public ngOnDestroy(): void {
    window.removeEventListener('toast', this.handleToast);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
