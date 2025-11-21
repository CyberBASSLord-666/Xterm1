import { Injectable, inject } from '@angular/core';
import type { DeviceInfo } from './pollinations.client';
import { PlatformService } from './platform.service';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private platformService = inject(PlatformService);

  getInfo(): DeviceInfo {
    // Provide fallback values for SSR
    if (!this.platformService.isBrowser) {
      return {
        width: 1920,
        height: 1080,
        dpr: 1,
      };
    }

    const win = this.platformService.getWindow();
    const screen = this.platformService.getScreen();

    const dpr = win?.devicePixelRatio ?? 1;
    const width = Math.round((screen?.width ?? win?.innerWidth ?? 1920) * dpr);
    const height = Math.round((screen?.height ?? win?.innerHeight ?? 1080) * dpr);

    return { width, height, dpr };
  }
}
