import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { IMAGE_PRESETS } from '../constants';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface ThumbnailOptions {
  size?: number;
  quality?: number;
}

/**
 * Service for image manipulation utilities including thumbnails,
 * compression, and format conversion with performance optimizations.
 */
@Injectable({ providedIn: 'root' })
export class ImageUtilService {
  private logger = inject(LoggerService);

  /**
   * Create a canvas with image bitmap for processing.
   * @param blob The source image blob
   * @param width Target width
   * @param height Target height
   * @param alpha Whether to preserve alpha channel
   * @returns Canvas, context, and bitmap for further processing
   */
  private async createCanvasWithBitmap(
    blob: Blob,
    width: number,
    height: number,
    alpha: boolean = false
  ): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; bitmap: ImageBitmap }> {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    return { canvas, ctx, bitmap };
  }

  /**
   * Convert canvas to blob with error handling.
   * @param canvas The canvas to convert
   * @param format The output format
   * @param quality The quality (0-1)
   * @returns Promise resolving to the blob
   */
  private canvasToBlob(
    canvas: HTMLCanvasElement,
    format: 'image/jpeg' | 'image/png' | 'image/webp',
    quality: number
  ): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), format, quality);
    });
  }

  /**
   * Create a thumbnail from a blob with configurable size and quality.
   * @param blob The source image blob
   * @param options Thumbnail generation options
   * @returns A promise that resolves to the thumbnail blob
   */
  async makeThumbnail(blob: Blob, options: ThumbnailOptions = {}): Promise<Blob> {
    const { size = IMAGE_PRESETS.THUMBNAIL_SIZE, quality = IMAGE_PRESETS.THUMBNAIL_QUALITY } = options;
    const startTime = performance.now();

    try {
      const bitmap = await createImageBitmap(blob);
      const scale = size / Math.max(bitmap.width, bitmap.height);
      const targetWidth = Math.round(bitmap.width * scale);
      const targetHeight = Math.round(bitmap.height * scale);

      const { canvas, ctx } = await this.createCanvasWithBitmap(blob, targetWidth, targetHeight, false);
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      bitmap.close();

      const result = await this.canvasToBlob(canvas, 'image/jpeg', quality);

      const duration = performance.now() - startTime;
      this.logger.debug(
        `Thumbnail created: ${blob.size} bytes -> ${result.size} bytes (${duration.toFixed(2)}ms)`,
        { originalSize: blob.size, thumbnailSize: result.size, duration },
        'ImageUtilService'
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to create thumbnail', error, 'ImageUtilService');
      throw error;
    }
  }

  /**
   * Compress an image with configurable options.
   * @param blob The source image blob
   * @param options Compression options
   * @returns A promise that resolves to the compressed blob
   */
  async compressImage(blob: Blob, options: CompressionOptions = {}): Promise<Blob> {
    const {
      maxWidth = IMAGE_PRESETS.MAX_IMAGE_WIDTH,
      maxHeight = IMAGE_PRESETS.MAX_IMAGE_HEIGHT,
      quality = IMAGE_PRESETS.COMPRESSION_QUALITY,
      format = 'image/jpeg',
    } = options;

    const startTime = performance.now();

    try {
      const bitmap = await createImageBitmap(blob);

      // Calculate scaling to fit within max dimensions
      let { width, height } = bitmap;
      const scale = Math.min(1, maxWidth / width, maxHeight / height);

      if (scale < 1) {
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const { canvas, ctx } = await this.createCanvasWithBitmap(blob, width, height, format !== 'image/jpeg');
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const result = await this.canvasToBlob(canvas, format, quality);

      const duration = performance.now() - startTime;
      const compressionRatio = ((1 - result.size / blob.size) * 100).toFixed(1);

      this.logger.debug(
        `Image compressed: ${blob.size} bytes -> ${result.size} bytes (${compressionRatio}% reduction, ${duration.toFixed(2)}ms)`,
        { originalSize: blob.size, compressedSize: result.size, compressionRatio, duration },
        'ImageUtilService'
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to compress image', error, 'ImageUtilService');
      throw error;
    }
  }

  /**
   * Get image dimensions from a blob without loading the full image.
   * @param blob The image blob
   * @returns A promise that resolves to the image dimensions
   */
  async getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }

  /**
   * Convert an image to a different format.
   * @param blob The source image blob
   * @param format The target format
   * @param quality The quality (0-1) for lossy formats
   * @returns A promise that resolves to the converted blob
   */
  async convertFormat(
    blob: Blob,
    format: 'image/jpeg' | 'image/png' | 'image/webp',
    quality: number = 0.9
  ): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const { canvas, ctx } = await this.createCanvasWithBitmap(
      blob,
      bitmap.width,
      bitmap.height,
      format !== 'image/jpeg'
    );
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    return this.canvasToBlob(canvas, format, quality);
  }

  /**
   * Create a placeholder/blur preview of an image for progressive loading.
   * @param blob The source image blob
   * @returns A promise that resolves to a tiny blurred preview
   */
  async createPlaceholder(blob: Blob): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);

    // Create a very small preview (20px on the longest side)
    const scale = 20 / Math.max(bitmap.width, bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.filter = 'blur(2px)';
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return this.canvasToBlob(canvas, 'image/jpeg', 0.5);
  }
}
