import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import JSZip from 'jszip';
import { GalleryService } from '../../services/gallery.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { BlobUrlManagerService } from '../../services/blob-url-manager.service';
import { AppError, ErrorHandlerService } from '../../services/error-handler.service';
import { createLoadingState, createFormField } from '../../utils';
import type { GalleryItem } from '../../services/idb';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';

@Component({
  selector: 'pw-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule],
})
export class SettingsComponent implements OnInit, OnDestroy {
  settingsService = inject(SettingsService);
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);
  private blobUrlManager = inject(BlobUrlManagerService);
  private errorHandler = inject(ErrorHandlerService);
  private keyboardShortcuts = inject(KeyboardShortcutsService);

  @ViewChild('importInput') private importInput?: ElementRef<HTMLInputElement>;
  private disposeShortcuts: (() => void) | null = null;

  // Professional loading states
  exportState = createLoadingState();
  importState = createLoadingState();

  // Professional form validation for file import
  importFile = createFormField<File | null>(null, [
    (file: File | null) => (file ? null : 'Please select a file'),
    (file: File | null) => (file?.name.endsWith('.zip') ? null : 'Only .zip files are allowed'),
    (file: File | null) =>
      file && file.size <= 50 * 1024 * 1024 ? null : 'File must be under 50MB',
  ]);

  // --- Type-safe event handlers ---
  public onReferrerInput(event: Event): void {
    this.settingsService.referrer.set((event.target as HTMLInputElement).value);
  }

  public ngOnInit(): void {
    this.disposeShortcuts = this.keyboardShortcuts.registerScope('settings', [
      {
        key: 's',
        commandOrControl: true,
        description: 'Export gallery',
        handler: () => {
          void this.exportGallery();
        },
        preventDefault: true,
        guard: () => !this.isExporting(),
      },
    ]);
  }

  public ngOnDestroy(): void {
    this.disposeShortcuts?.();
    this.disposeShortcuts = null;
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
      const downloadUrl = this.blobUrlManager.createUrl(content);
      link.href = downloadUrl;
      link.download = `PolliWall_Export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.blobUrlManager.revokeUrl(downloadUrl);
      this.toastService.show('Export complete!');
    });

    if (this.exportState.error()) {
      this.toastService.show(`Export failed: ${this.exportState.error()}`);
    }
  }

  public isExporting(): boolean {
    return this.exportState.loading();
  }

  public exportError(): string | null {
    return this.exportState.error()?.message ?? null;
  }

  public isImporting(): boolean {
    return this.importState.loading();
  }

  public importError(): string | null {
    return this.importState.error()?.message ?? null;
  }

  public selectedImportFileName(): string | null {
    const file = this.importFile.value();
    return file ? file.name : null;
  }

  public onImportFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.importFile.value.set(file);
    this.importFile.touched.set(true);
    if (file) {
      this.importFile.validate();
    }
  }

  public clearImportSelection(): void {
    this.importFile.reset();
    if (this.importInput) {
      this.importInput.nativeElement.value = '';
    }
  }

  public async importGallery(): Promise<void> {
    try {
      await this.importState.execute(async () => {
        this.importFile.touched.set(true);
        this.importFile.validate();

        const file = this.importFile.value();
        if (!file) {
        throw new AppError('Please choose a ZIP export to import.', 'gallery.import.noFile', true);
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new AppError('The selected file is too large (50MB max).', 'gallery.import.tooLarge', true);
      }

      let archive: JSZip;
      try {
        archive = await JSZip.loadAsync(file);
      } catch (error) {
        throw new AppError('The selected file is not a valid PolliWall export.', 'gallery.import.invalid', true, error);
      }

      const metadataEntry = archive.file('metadata.json');
      if (!metadataEntry) {
        throw new AppError(
          'This export is missing required metadata.json.',
          'gallery.import.missingMetadata',
          true
        );
      }

      let metadataRaw: string;
      try {
        metadataRaw = await metadataEntry.async('string');
      } catch (error) {
        throw new AppError('Unable to read export metadata.', 'gallery.import.metadataRead', true, error);
      }

      let metadata: Array<Omit<GalleryItem, 'blob' | 'thumb'>>;
      try {
        metadata = JSON.parse(metadataRaw);
      } catch (error) {
        throw new AppError('Export metadata is corrupted.', 'gallery.import.metadataParse', true, error);
      }

      if (!Array.isArray(metadata) || metadata.length === 0) {
        throw new AppError('No wallpapers found in the selected export.', 'gallery.import.empty', true);
      }

      let importedCount = 0;

      for (const item of metadata) {
        if (!item?.id || !item.createdAt) {
          continue;
        }

        const imageEntry = archive.file(`images/${item.id}.jpg`);
        const thumbEntry = archive.file(`thumbnails/${item.id}.jpg`);

        if (!imageEntry || !thumbEntry) {
          continue;
        }

        const [blob, thumb] = await Promise.all([
          imageEntry.async('blob'),
          thumbEntry.async('blob'),
        ]);

        const galleryItem: GalleryItem = {
          ...item,
          id: item.id ?? crypto.randomUUID(),
          createdAt: item.createdAt ?? new Date().toISOString(),
          blob,
          thumb,
          isFavorite: item.isFavorite ?? false,
          collectionId: item.collectionId ?? null,
        } as GalleryItem;

        await this.galleryService.add(galleryItem);
        importedCount += 1;
      }

      if (importedCount === 0) {
        throw new AppError('No wallpapers could be imported from this file.', 'gallery.import.none', true);
      }

        this.toastService.show(`Imported ${importedCount} wallpaper${importedCount === 1 ? '' : 's'} successfully.`);
        this.clearImportSelection();
      });
    } catch (error) {
      this.errorHandler.handleError(error, 'SettingsComponent.importGallery', true);
    }
  }
}
