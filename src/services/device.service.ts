
import { Injectable } from '@angular/core';
import type { DeviceInfo } from './pollinations.client';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  getInfo(): DeviceInfo {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.round((window.screen?.width ?? window.innerWidth) * dpr);
    const height = Math.round((window.screen?.height ?? window.innerHeight) * dpr);
    return { width, height, dpr };
  }
}
