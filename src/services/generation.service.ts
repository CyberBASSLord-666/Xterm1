import { Injectable, signal, inject } from '@angular/core';
import { GalleryService } from './gallery.service';
import { ToastService } from './toast.service';
import { ImageUtilService } from './image-util.service';
import { createDeviceWallpaper, ImageOptions, DeviceInfo, SupportedResolutions } from './pollinations.client';
import { GalleryItem } from './idb';
import { UI_CONFIG, IMAGE_PRESETS, ERROR_MESSAGES } from '../constants';

@Injectable({ providedIn: 'root' })
export class GenerationService {
  private galleryService = inject(GalleryService);
  private imageUtilService = inject(ImageUtilService);
  private toastService = inject(ToastService);

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
    this.statusMessage.set(this.generatingMessages[0]);
    this.toastService.show('Sending prompt to AI for generation...');

    let messageIndex = 1;
    this.messageInterval = window.setInterval(() => {
      this.statusMessage.set(this.generatingMessages[messageIndex % this.generatingMessages.length]);
      messageIndex++;
    }, UI_CONFIG.GENERATION_MESSAGE_INTERVAL);

    try {
      const { blob, width, height, aspect, mode } = await createDeviceWallpaper({
        device,
        supported,
        prompt,
        options,
      });

      clearInterval(this.messageInterval);
      this.messageInterval = undefined;

      this.status.set('saving');
      this.statusMessage.set('Saving to gallery');
      this.toastService.show('Image received, saving to your gallery...');

      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const thumb = await this.imageUtilService.makeThumbnail(blob);

      const galleryItem: GalleryItem = {
        id,
        createdAt,
        width,
        height,
        aspect,
        mode,
        model: options.model!,
        prompt,
        blob,
        thumb,
        presetName,
        isFavorite: false,
        collectionId: null,
        seed: options.seed,
      };

      await this.galleryService.add(galleryItem);

      const blobUrl = URL.createObjectURL(blob);
      this.currentGenerationResult.set({ galleryItem, blobUrl });

      this.status.set('success');
      this.statusMessage.set('Wallpaper saved to gallery.');
      this.toastService.show('Wallpaper generated and saved to gallery.');
    } catch (e: unknown) {
      this.status.set('error');
      const error = e as Error;
      const errorMessage = `Generation failed: ${error.message || String(e)}`;
      this.statusMessage.set(errorMessage);
      this.toastService.show(errorMessage);
    } finally {
      if (this.messageInterval) {
        clearInterval(this.messageInterval);
        this.messageInterval = undefined;
      }
    }
  }

  reset(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = undefined;
    }
    const currentResult = this.currentGenerationResult();
    if (currentResult) {
      URL.revokeObjectURL(currentResult.blobUrl);
    }
    this.status.set('idle');
    this.statusMessage.set('');
    this.currentGenerationResult.set(null);
  }
}
