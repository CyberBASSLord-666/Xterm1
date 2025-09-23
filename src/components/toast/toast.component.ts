import { Component, ChangeDetectionStrategy, signal, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  imports: [],
})
export class ToastComponent implements OnInit, OnDestroy {
  message = signal<string | null>(null);
  private timeoutId: number | undefined;

  private handleToast = (event: Event) => {
    const customEvent = event as CustomEvent<string>;
    this.message.set(customEvent.detail);

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = window.setTimeout(() => {
      this.message.set(null);
    }, 4000);
  };

  ngOnInit() {
    window.addEventListener('toast', this.handleToast);
  }

  ngOnDestroy() {
    window.removeEventListener('toast', this.handleToast);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}