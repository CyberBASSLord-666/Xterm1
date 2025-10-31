import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { GalleryService } from '../../services/gallery.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';
import { LoggerService } from '../../services/logger.service';
import JSZip from 'jszip';
import { FormsModule } from '@angular/forms';
import { createLoadingState, createFormField } from '../../utils';

@Component({
  selector: 'pw-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class SettingsComponent implements OnInit, OnDestroy {
  settingsService = inject(SettingsService);
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);
  private keyboardShortcuts = inject(KeyboardShortcutsService);
  private logger = inject(LoggerService);

  // Professional loading states
  exportState = createLoadingState();
  importState = createLoadingState();
  isExporting = this.exportState.loading;

  // Professional form validation for file import
  importFile = createFormField<File | null>(null, [
    (file: File | null): string | null => (file ? null : 'Please select a file'),
    (file: File | null): string | null => (file?.name.endsWith('.zip') ? null : 'Only .zip files are allowed'),
    (file: File | null): string | null => (file && file.size <= 50 * 1024 * 1024 ? null : 'File must be under 50MB'),
  ]);

  ngOnInit(): void {
    // Register keyboard shortcuts
    this.keyboardShortcuts.registerDefaultShortcuts({
      save: () => {
        if (!this.isExporting()) {
          this.exportGallery();
        }
      },
    });
  }

  ngOnDestroy(): void {
    // Unregister shortcuts
    this.keyboardShortcuts.unregister('save');
  }

  // --- Type-safe event handlers ---
  public onReferrerInput(event: Event): void {
    this.settingsService.referrer.set((event.target as HTMLInputElement).value);
  }

  public onReferrerBlur(): void {
    this.toastService.show('Referrer setting saved.');
  }

  public onNologoChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settingsService.nologo.set(checked);
    this.toastService.show(`Logo overlays ${checked ? 'disabled' : 'enabled'}.`);
  }

  public onPrivateChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settingsService.private.set(checked);
    this.toastService.show(`Private generations ${checked ? 'enabled' : 'disabled'}.`);
  }

  public onSafeChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settingsService.safe.set(checked);
    this.toastService.show(`Strict safety filters ${checked ? 'enabled' : 'disabled'}.`);
  }

  public onThemeChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.settingsService.themeDark.set(checked);
    this.toastService.show(`Dark mode ${checked ? 'enabled' : 'disabled'}.`);
  }
  // --- End of type-safe event handlers ---

  public async exportGallery(): Promise<void> {
    await this.exportState.execute(async () => {
      this.toastService.show('Preparing gallery for export...');
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
      this.toastService.show('Export complete!');
    });

    if (this.exportState.error()) {
      this.toastService.show(`Export failed: ${this.exportState.error()}`);
    }
  }

  public async importGallery(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.toastService.show('No file selected.');
      return;
    }

    // Validate file
    this.importFile.value.set(file);
    this.importFile.validate();

    if (this.importFile.error()) {
      this.toastService.show(this.importFile.error() || 'Invalid file.');
      return;
    }

    await this.importState.execute(async () => {
      this.toastService.show('Reading ZIP file...');

      try {
        const zip = await JSZip.loadAsync(file);

        // Read metadata.json
        const metadataFile = zip.file('metadata.json');
        if (!metadataFile) {
          throw new Error('Invalid format: metadata.json not found.');
        }

        const metadataText = await metadataFile.async('text');
        const metadata = JSON.parse(metadataText) as Array<{
          id: string;
          createdAt: string;
          width: number;
          height: number;
          aspect: string;
          mode: 'exact' | 'constrained';
          model: string;
          prompt: string;
          presetName?: string;
          isFavorite: boolean;
          collectionId: string | null;
          seed?: number;
          lineage?: { parentId?: string; kind?: 'variant' | 'restyle' };
        }>;

        if (!Array.isArray(metadata)) {
          throw new Error('Invalid format: metadata must be an array.');
        }

        this.toastService.show(`Found ${metadata.length} wallpaper(s). Importing...`);

        let imported = 0;
        let skipped = 0;

        for (const meta of metadata) {
          try {
            // Check if item already exists
            const existing = await this.galleryService.get(meta.id);
            if (existing) {
              skipped++;
              continue;
            }

            // Read image files
            const imageFile = zip.file(`images/${meta.id}.jpg`);
            const thumbFile = zip.file(`thumbnails/${meta.id}.jpg`);

            if (!imageFile || !thumbFile) {
              throw new Error(`Missing image files for ${meta.id}`);
            }

            const imageBlob = await imageFile.async('blob');
            const thumbBlob = await thumbFile.async('blob');

            // Add to gallery
            await this.galleryService.add({
              ...meta,
              blob: imageBlob,
              thumb: thumbBlob,
            });

            imported++;
          } catch (error) {
            this.logger.error(`Failed to import ${meta.id}`, error, 'SettingsComponent');
            // Continue with next item
          }
        }

        this.toastService.show(
          `Import complete! Added ${imported} wallpaper(s). ${skipped > 0 ? `Skipped ${skipped} duplicate(s).` : ''}`
        );
      } catch (error) {
        const err = error as Error;
        throw new Error(`Import failed: ${err.message || 'Unknown error'}`);
      }
    });

    if (this.importState.error()) {
      this.toastService.show(`${this.importState.error()}`);
    }

    // Reset file input
    input.value = '';
  }
}
