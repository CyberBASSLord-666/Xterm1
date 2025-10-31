import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  OnDestroy,
  inject,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GalleryService } from '../../services/gallery.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { ImageUtilService } from '../../services/image-util.service';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';
import { GalleryItem } from '../../services/idb';
import {
  composeVariantPrompt,
  composeRestylePrompt,
  createDeviceWallpaper,
  textToSpeech,
} from '../../services/pollinations.client';
import { FormsModule } from '@angular/forms';
import { createLoadingState, createUndoRedo } from '../../utils';

@Component({
  selector: 'pw-editor',
  standalone: true,
  templateUrl: './editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule],
})
export class EditorComponent implements OnInit, OnDestroy {
  item = signal<GalleryItem | null>(null);

  // Professional undo/redo for restyle input
  restyleHistory = createUndoRedo<string>('Golden hour warmth, gentle grain, cinematic contrast');
  restyle = this.restyleHistory.current;
  canUndo = this.restyleHistory.canUndo;
  canRedo = this.restyleHistory.canRedo;

  // Professional loading states
  variantState = createLoadingState();
  restyleState = createLoadingState();
  audioState = createLoadingState();
  working = computed(() => this.variantState.loading() || this.restyleState.loading() || this.audioState.loading());
  audioWorking = this.audioState.loading;

  lineage = signal<{ parent: GalleryItem | null; children: GalleryItem[] }>({
    parent: null,
    children: [],
  });

  // Blob URL Management
  itemUrl = computed(() => (this.item() ? URL.createObjectURL(this.item()!.blob) : null));
  lineageUrls = computed(() => {
    const urls = new Map<string, string>();
    const l = this.lineage();
    if (l.parent) urls.set(l.parent.id, URL.createObjectURL(l.parent.thumb));
    l.children.forEach((c) => urls.set(c.id, URL.createObjectURL(c.thumb)));
    return urls;
  });

  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private gs = inject(GalleryService);
  private toast = inject(ToastService);
  private settingsService = inject(SettingsService);
  private imageUtilService = inject(ImageUtilService);
  private keyboardShortcuts = inject(KeyboardShortcutsService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Effect to clean up URLs when the signals change
    effect((onCleanup) => {
      const item = this.itemUrl();
      const lineage = this.lineageUrls();
      onCleanup(() => {
        if (item) URL.revokeObjectURL(item);
        lineage.forEach((url) => URL.revokeObjectURL(url));
      });
    });
  }

  public ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
      const id = params.get('id');
      if (!id) {
        await this.router.navigateByUrl('/gallery');
        return;
      }
      await this.loadItem(id);
    });

    // Register keyboard shortcuts
    this.keyboardShortcuts.registerDefaultShortcuts({
      undo: () => {
        if (this.canUndo()) {
          this.undo();
        }
      },
      redo: () => {
        if (this.canRedo()) {
          this.redo();
        }
      },
    });
  }

  public ngOnDestroy(): void {
    // Unregister shortcuts
    this.keyboardShortcuts.unregister('undo');
    this.keyboardShortcuts.unregister('redo');
  }

  public onRestyleInput(event: Event): void {
    const newValue = (event.target as HTMLInputElement).value;
    this.restyleHistory.commit(newValue);
  }

  public undo(): void {
    this.restyleHistory.undo();
  }

  public redo(): void {
    this.restyleHistory.redo();
  }

  public async loadItem(id: string): Promise<void> {
    const item = await this.gs.get(id);
    if (!item) {
      this.toast.show('Not found');
      await this.router.navigateByUrl('/gallery');
      return;
    }
    this.item.set(item);
    await this.loadLineage(item);
  }

  public async loadLineage(currentItem: GalleryItem): Promise<void> {
    let parent: GalleryItem | null = null;
    if (currentItem.lineage?.parentId) {
      parent = (await this.gs.get(currentItem.lineage.parentId)) ?? null;
    }

    const allItems = await this.gs.list();
    const children = allItems.filter((i) => i.lineage?.parentId === currentItem.id);
    this.lineage.set({ parent, children });
  }

  public async makeVariant(): Promise<void> {
    const base = this.item();
    if (!base) return;

    await this.variantState.execute(
      (async (): Promise<void> => {
        const generationSettings = this.settingsService.getGenerationOptions();
        const vprompt = await composeVariantPrompt(base.prompt, {
          private: generationSettings.private,
          referrer: generationSettings.referrer,
        });
        const { blob, width, height, aspect, mode } = await createDeviceWallpaper({
          device: { width: base.width, height: base.height, dpr: 1 },
          supported: { [base.aspect]: [{ w: base.width, h: base.height }] },
          prompt: vprompt,
          options: { ...generationSettings, model: base.model },
        });
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const thumb = await this.imageUtilService.makeThumbnail(blob);
        await this.gs.add({
          id,
          createdAt,
          width,
          height,
          aspect,
          mode,
          model: base.model,
          prompt: vprompt,
          blob,
          thumb,
          lineage: { parentId: base.id, kind: 'variant' },
          isFavorite: false,
          collectionId: base.collectionId,
        });
        this.toast.show('Variant added to gallery.');
        await this.router.navigate(['/edit', id]);
      })()
    );

    if (this.variantState.error()) {
      this.toast.show(`Variant failed: ${this.variantState.error()}`);
    }
  }

  public async makeRestyle(): Promise<void> {
    const base = this.item();
    if (!base) return;

    await this.restyleState.execute(
      (async (): Promise<void> => {
        const generationSettings = this.settingsService.getGenerationOptions();
        const rprompt = await composeRestylePrompt(base.prompt, this.restyle(), {
          private: generationSettings.private,
          referrer: generationSettings.referrer,
        });
        const { blob, width, height, aspect, mode } = await createDeviceWallpaper({
          device: { width: base.width, height: base.height, dpr: 1 },
          supported: { [base.aspect]: [{ w: base.width, h: base.height }] },
          prompt: rprompt,
          options: { ...generationSettings, model: base.model },
        });
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const thumb = await this.imageUtilService.makeThumbnail(blob);
        await this.gs.add({
          id,
          createdAt,
          width,
          height,
          aspect,
          mode,
          model: base.model,
          prompt: rprompt,
          blob,
          thumb,
          lineage: { parentId: base.id, kind: 'restyle' },
          isFavorite: false,
          collectionId: base.collectionId,
        });
        this.toast.show('Restyle added to gallery.');
        await this.router.navigate(['/edit', id]);
      })()
    );

    if (this.restyleState.error()) {
      this.toast.show(`Restyle failed: ${this.restyleState.error()}`);
    }
  }

  public async toggleFavorite(): Promise<void> {
    const item = this.item();
    if (!item) return;
    const isFav = await this.gs.toggleFavorite(item.id);
    this.item.update((i) => (i ? { ...i, isFavorite: isFav } : null));
    this.toast.show(isFav ? 'Added to favorites.' : 'Removed from favorites.');
  }

  public downloadImage(): void {
    const url = this.itemUrl();
    const item = this.item();
    if (!item || !url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `PolliWall-${item.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public async shareImage(): Promise<void> {
    const item = this.item();
    if (!item || !navigator.share) {
      this.toast.show('Web Share API not available on this browser.');
      return;
    }
    try {
      const file = new File([item.blob], `PolliWall-${item.id}.jpg`, { type: 'image/jpeg' });
      await navigator.share({
        title: 'PolliWall Wallpaper',
        text: `Check out this wallpaper I made: ${item.prompt}`,
        files: [file],
      });
    } catch (error: unknown) {
      const err = error as { name?: string };
      if (err.name !== 'AbortError') {
        this.toast.show('Failed to share image.');
        // eslint-disable-next-line no-console
        console.error('Share error:', error);
      }
    }
  }

  public previewAudio(): void {
    const item = this.item();
    if (!item) return;

    if (!('speechSynthesis' in window)) {
      this.toast.show('Audio not supported on this browser.');
      return;
    }

    if (this.audioState.loading()) {
      window.speechSynthesis.cancel();
      return;
    }

    this.audioState.execute(
      (async (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
          const utterance = textToSpeech(item.prompt);
          utterance.onend = (): void => resolve();
          utterance.onerror = (e): void => reject(new Error(e.error));
          window.speechSynthesis.speak(utterance);
        });
      })()
    );

    if (this.audioState.error()) {
      this.toast.show(`Audio failed: ${this.audioState.error()}`);
    }
  }
}
