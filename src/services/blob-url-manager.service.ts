import { Injectable, inject, DestroyRef } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Service for managing blob URLs to prevent memory leaks.
 * Automatically tracks and revokes blob URLs.
 */
@Injectable({ providedIn: 'root' })
export class BlobUrlManagerService {
  private logger = inject(LoggerService);
  private activeUrls = new Set<string>();

  /**
   * Create a blob URL and track it for automatic cleanup.
   */
  createUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.activeUrls.add(url);
    this.logger.debug(`Created blob URL: ${url}`, undefined, 'BlobUrlManager');
    return url;
  }

  /**
   * Revoke a blob URL and remove it from tracking.
   */
  revokeUrl(url: string): void {
    if (this.activeUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeUrls.delete(url);
      this.logger.debug(`Revoked blob URL: ${url}`, undefined, 'BlobUrlManager');
    }
  }

  /**
   * Revoke multiple blob URLs.
   */
  revokeUrls(urls: string[]): void {
    for (const url of urls) {
      this.revokeUrl(url);
    }
  }

  /**
   * Revoke all tracked blob URLs.
   */
  revokeAll(): void {
    this.logger.debug(`Revoking ${this.activeUrls.size} blob URLs`, undefined, 'BlobUrlManager');
    for (const url of this.activeUrls) {
      URL.revokeObjectURL(url);
    }
    this.activeUrls.clear();
  }

  /**
   * Get the number of active blob URLs.
   */
  get activeCount(): number {
    return this.activeUrls.size;
  }

  /**
   * Create a blob URL that will be automatically cleaned up when the component is destroyed.
   * Use this in components with DestroyRef.
   */
  createAutoCleanupUrl(blob: Blob, destroyRef: DestroyRef): string {
    const url = this.createUrl(blob);
    destroyRef.onDestroy(() => {
      this.revokeUrl(url);
    });
    return url;
  }
}
