import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { GalleryService } from '../../services/gallery.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import JSZip from 'jszip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pw-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class SettingsComponent {
  settingsService = inject(SettingsService);
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);

  isExporting = signal(false);
  
  // --- Type-safe event handlers ---
  onReferrerInput(event: Event) {
    this.settingsService.referrer.set((event.target as HTMLInputElement).value);
  }

  onNologoChange(event: Event) {
    this.settingsService.nologo.set((event.target as HTMLInputElement).checked);
  }

  onPrivateChange(event: Event) {
    this.settingsService.private.set((event.target as HTMLInputElement).checked);
  }

  onSafeChange(event: Event) {
    this.settingsService.safe.set((event.target as HTMLInputElement).checked);
  }

  onThemeChange(event: Event) {
    this.settingsService.themeDark.set((event.target as HTMLInputElement).checked);
  }
  // --- End of type-safe event handlers ---

  async exportGallery() {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.toastService.show('Preparing gallery for export...');
    try {
        const items = await this.galleryService.list();
        if (items.length === 0) {
            this.toastService.show('Your gallery is empty.');
            return;
        }

        const zip = new JSZip();
        const metadata = [];

        for (const item of items) {
            const { blob, thumb, ...meta } = item;
            metadata.push(meta);
            zip.file(`images/${item.id}.jpg`, blob, { binary: true });
            zip.file(`thumbnails/${item.id}.jpg`, thumb, { binary: true });
        }
        
        zip.file('metadata.json', JSON.stringify(metadata, null, 2));

        this.toastService.show('Generating ZIP file...');
        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `PolliWall_Export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        this.toastService.show('Export started successfully!');
    } catch(e: any) {
        this.toastService.show(`Export failed: ${e.message}`);
    } finally {
        this.isExporting.set(false);
    }
  }
}
