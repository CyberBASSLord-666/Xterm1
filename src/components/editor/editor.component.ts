import { Component, ChangeDetectionStrategy, signal, OnInit, inject, computed, effect, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GalleryService } from '../../services/gallery.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { ImageUtilService } from '../../services/image-util.service';
import { GalleryItem } from '../../services/idb';
import { composeVariantPrompt, composeRestylePrompt, createDeviceWallpaper, textToSpeech } from '../../services/pollinations.client';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pw-editor',
  templateUrl: './editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule]
})
export class EditorComponent implements OnInit {
  item = signal<GalleryItem | null>(null);
  restyle = signal('Golden hour warmth, gentle grain, cinematic contrast');
  working = signal(false);
  
  lineage = signal<{parent: GalleryItem | null, children: GalleryItem[]}>({parent: null, children: []});

  // Blob URL Management
  itemUrl = computed(() => this.item() ? URL.createObjectURL(this.item()!.blob) : null);
  lineageUrls = computed(() => {
      const urls = new Map<string, string>();
      const l = this.lineage();
      if (l.parent) urls.set(l.parent.id, URL.createObjectURL(l.parent.thumb));
      l.children.forEach(c => urls.set(c.id, URL.createObjectURL(c.thumb)));
      return urls;
  });
  
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private gs = inject(GalleryService);
  private toast = inject(ToastService);
  private settingsService = inject(SettingsService);
  private imageUtilService = inject(ImageUtilService);
  private destroyRef = inject(DestroyRef);

  constructor() {
      // Effect to clean up URLs when the signals change
      effect((onCleanup) => {
          const item = this.itemUrl();
          const lineage = this.lineageUrls();
          onCleanup(() => {
              if (item) URL.revokeObjectURL(item);
              lineage.forEach(url => URL.revokeObjectURL(url));
          });
      });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
        const id = params.get('id');
        if (!id) {
          this.router.navigateByUrl('/gallery');
          return;
        }
        await this.loadItem(id);
    });
  }
  
  onRestyleInput(event: Event) {
      this.restyle.set((event.target as HTMLInputElement).value);
  }

  async loadItem(id: string) {
    const item = await this.gs.get(id);
    if (!item) {
      this.toast.show('Not found');
      this.router.navigateByUrl('/gallery');
      return;
    }
    this.item.set(item);
    await this.loadLineage(item);
  }

  async loadLineage(currentItem: GalleryItem) {
    let parent: GalleryItem | null = null;
    if (currentItem.lineage?.parentId) {
        parent = await this.gs.get(currentItem.lineage.parentId) ?? null;
    }
    
    const allItems = await this.gs.list();
    const children = allItems.filter(i => i.lineage?.parentId === currentItem.id);
    this.lineage.set({ parent, children });
  }

  async makeVariant() {
    const base = this.item();
    if (!base) return;
    this.working.set(true);
    try {
      const generationSettings = this.settingsService.getGenerationOptions();
      const vprompt = await composeVariantPrompt(base.prompt, { private: generationSettings.private, referrer: generationSettings.referrer });
      const { blob, width, height, aspect, mode } = await createDeviceWallpaper({
        device: { width: base.width, height: base.height, dpr: 1 },
        supported: { [base.aspect]: [{ w: base.width, h: base.height }] },
        prompt: vprompt,
        options: { ...generationSettings, model: base.model }
      });
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const thumb = await this.imageUtilService.makeThumbnail(blob);
      await this.gs.add({ id, createdAt, width, height, aspect, mode, model: base.model, prompt: vprompt, blob, thumb, lineage: { parentId: base.id, kind: 'variant' }, isFavorite: false, collectionId: base.collectionId });
      this.toast.show('Variant added to gallery.');
      this.router.navigate(['/edit', id]);
    } catch (e: any) {
      this.toast.show(`Variant failed: ${e.message || e}`);
    } finally {
      this.working.set(false);
    }
  }

  async makeRestyle() {
    const base = this.item();
    if (!base) return;
    this.working.set(true);
    try {
      const generationSettings = this.settingsService.getGenerationOptions();
      const rprompt = await composeRestylePrompt(base.prompt, this.restyle(), { private: generationSettings.private, referrer: generationSettings.referrer });
      const { blob, width, height, aspect, mode } = await createDeviceWallpaper({
        device: { width: base.width, height: base.height, dpr: 1 },
        supported: { [base.aspect]: [{ w: base.width, h: base.height }] },
        prompt: rprompt,
        options: { ...generationSettings, model: base.model }
      });
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const thumb = await this.imageUtilService.makeThumbnail(blob);
      await this.gs.add({ id, createdAt, width, height, aspect, mode, model: base.model, prompt: rprompt, blob, thumb, lineage: { parentId: base.id, kind: 'restyle' }, isFavorite: false, collectionId: base.collectionId });
      this.toast.show('Restyle added to gallery.');
      this.router.navigate(['/edit', id]);
    } catch (e: any) {
      this.toast.show(`Restyle failed: ${e.message || e}`);
    } finally {
      this.working.set(false);
    }
  }

  async toggleFavorite() {
      const item = this.item();
      if (!item) return;
      const isFav = await this.gs.toggleFavorite(item.id);
      this.item.update(i => i ? {...i, isFavorite: isFav} : null);
  }
  
  downloadImage() {
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

  async shareImage() {
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
              files: [file]
          });
      } catch (error: any) {
          if (error.name !== 'AbortError') {
            this.toast.show('Failed to share image.');
            console.error('Share error:', error);
          }
      }
  }
  
  async previewAudio() {
    const item = this.item();
    if (!item) return;
    this.working.set(true);
    this.toast.show('Generating audio preview...');
    try {
        const blob = await textToSpeech(item.prompt);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
    } catch (e: any) {
        this.toast.show(`Audio preview failed: ${e.message}`);
    } finally {
        this.working.set(false);
    }
  }
}
