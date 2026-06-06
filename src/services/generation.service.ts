import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { GalleryService } from './gallery.service';
import { ToastService } from './toast.service';
import { ImageUtilService } from './image-util.service';
import { LoggerService } from './logger.service';
import { BlobUrlManagerService } from './blob-url-manager.service';
import { createDeviceWallpaper, ImageOptions, DeviceInfo, SupportedResolutions } from './pollinations.client';
import { GalleryItem } from './idb';
import { UI_CONFIG, IMAGE_PRESETS, ERROR_MESSAGES } from '../constants';

@Injectable({ providedIn: 'root' })
export class GenerationService implements OnDestroy {
  private readonly galleryService = inject(GalleryService);
  private readonly imageUtilService = inject(ImageUtilService);
  private readonly toastService = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly blobUrlManager = inject(BlobUrlManagerService);

  readonly status = signal<'idle' | 'generating' | 'saving' | 'error' | 'success'>('idle');
  readonly statusMessage = signal('');
  readonly currentGenerationResult = signal<{ galleryItem: GalleryItem; blobUrl: string } | null>(null);

  private messageInterval: number | undefined;
  private readonly generatingMessages = IMAGE_PRESETS.GENERATION_MESSAGES;

  public async generateWallpaper(
    prompt: string,
    options: ImageOptions,
    device: DeviceInfo,
    supported: SupportedResolutions,
    presetName: string
  ): Promise<void> {
    if (this.status() === 'generating' || this.status() === 'saving') {
      this.toastService.show(ERROR_MESSAGES.GENERATION_IN_PROGRESS);
      return;
    }

    this.reset();
    this.status.set('generating');
    this.statusMessage.set(this.generatingMessages[0] ?? 'Generating wallpaper');
    this.toastService.show('Sending prompt to AI for generation...');

    this.startProgressMessages();

    try {
      const { blob, width, height, aspect, mode } = await createDeviceWallpaper({
        device,
        supported,
        prompt,
        options,
      });

      this.clearProgressMessages();
      this.status.set('saving');
      this.statusMessage.set('Saving to gallery');
      this.toastService.show('Image received, saving to your gallery...');

      const galleryItem = await this.createGalleryItem({
        blob,
        width,
        height,
        aspect,
        mode,
        options,
        prompt,
        presetName,
      });
      await this.galleryService.add(galleryItem);

      const blobUrl = this.blobUrlManager.createUrl(blob);
      this.replaceCurrentResult({ galleryItem, blobUrl });

      this.status.set('success');
      this.statusMessage.set('Wallpaper saved to gallery.');
      this.toastService.show('Wallpaper generated and saved to gallery.');
    } catch (e: unknown) {
      this.status.set('error');
      const error = e instanceof Error ? e : new Error(String(e));
      const errorMessage = `Generation failed: ${error.message}`;
      this.statusMessage.set(errorMessage);
      this.toastService.show(errorMessage);
      this.logger.error('Wallpaper generation failed', error, 'GenerationService');
      this.releaseCurrentResult();
    } finally {
      this.clearProgressMessages();
    }
  }

  reset(): void {
    this.clearProgressMessages();
    this.releaseCurrentResult();
    this.status.set('idle');
    this.statusMessage.set('');
  }

  ngOnDestroy(): void {
    this.reset();
  }

  private startProgressMessages(): void {
    let messageIndex = 1;
    this.messageInterval = window.setInterval(() => {
      this.statusMessage.set(
        this.generatingMessages[messageIndex % this.generatingMessages.length] ?? 'Generating wallpaper'
      );
      messageIndex++;
    }, UI_CONFIG.GENERATION_MESSAGE_INTERVAL);
  }

  private clearProgressMessages(): void {
    if (this.messageInterval !== undefined) {
      clearInterval(this.messageInterval);
      this.messageInterval = undefined;
    }
  }

  private async createGalleryItem({
    blob,
    width,
    height,
    aspect,
    mode,
    options,
    prompt,
    presetName,
  }: {
    blob: Blob;
    width: number;
    height: number;
    aspect: string;
    mode: 'exact' | 'constrained';
    options: ImageOptions;
    prompt: string;
    presetName: string;
  }): Promise<GalleryItem> {
    const thumb = await this.imageUtilService.makeThumbnail(blob);
    return {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      width,
      height,
      aspect,
      mode,
      model: options.model ?? 'unknown',
      prompt,
      blob,
      thumb,
      presetName,
      isFavorite: false,
      collectionId: null,
      seed: options.seed,
    };
  }

  private replaceCurrentResult(result: { galleryItem: GalleryItem; blobUrl: string }): void {
    this.releaseCurrentResult();
    this.currentGenerationResult.set(result);
  }

  private releaseCurrentResult(): void {
    const currentResult = this.currentGenerationResult();
    if (currentResult) {
      this.blobUrlManager.revokeUrl(currentResult.blobUrl);
      this.currentGenerationResult.set(null);
    }
  }
}
