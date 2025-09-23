import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageUtilService {
  async makeThumbnail(blob: Blob): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    const scale = 320 / Math.max(bitmap.width, bitmap.height);
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject('Canvas toBlob failed'), 'image/jpeg', 0.9);
    });
  }
}
