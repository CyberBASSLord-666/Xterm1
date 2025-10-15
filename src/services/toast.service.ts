import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  show(message: string) {
    const ev = new CustomEvent('toast', { detail: message });
    window.dispatchEvent(ev);
  }
}
