import { Injectable, inject } from '@angular/core';
import { PlatformService } from './platform.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private platformService = inject(PlatformService);

  public show(message: string): void {
    // Only dispatch toast events in browser context
    if (!this.platformService.isBrowser) {
      return;
    }

    const win = this.platformService.getWindow();
    const event = this.platformService.createCustomEvent('toast', message);

    if (win && event) {
      this.platformService.dispatchEvent(win, event);
    }
  }
}
