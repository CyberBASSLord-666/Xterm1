import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  public show(message: string): void {
    const ev = new CustomEvent('toast', { detail: message });
    window.dispatchEvent(ev);
  }
}
