import { Component, signal, OnDestroy, OnInit, inject } from '@angular/core';
import { UI_CONFIG } from '../../constants';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  imports: [],
})
export class ToastComponent implements OnInit, OnDestroy {
  private platformService = inject(PlatformService);

  message = signal<string | null>(null);
  private timeoutId: number | undefined;

  private handleToast = (event: Event): void => {
    const customEvent = event as CustomEvent<string>;
    this.message.set(customEvent.detail);

    if (this.timeoutId) {
      this.platformService.clearTimeout(this.timeoutId);
    }

    this.timeoutId = this.platformService.setTimeout(() => {
      this.message.set(null);
    }, UI_CONFIG.TOAST_DURATION);
  };

  public ngOnInit(): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    const win = this.platformService.getWindow();
    this.platformService.addEventListener(win, 'toast', this.handleToast);
  }

  public ngOnDestroy(): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    const win = this.platformService.getWindow();
    this.platformService.removeEventListener(win, 'toast', this.handleToast);

    if (this.timeoutId) {
      this.platformService.clearTimeout(this.timeoutId);
    }
  }
}
