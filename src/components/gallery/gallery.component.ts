import { Component, ChangeDetectionStrategy, signal, OnInit, inject, computed, OnDestroy, effect } from '@angular/core';
import { GalleryService } from '../../services/gallery.service';
import { Collection, GalleryItem } from '../../services/idb';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'pw-gallery',
  templateUrl: './gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class GalleryComponent implements OnInit, OnDestroy {
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);
  
  allItems = signal<GalleryItem[]>([]);
  collections = signal<Collection[]>([]);
  loading = signal(false);

  // Thumbnail URL management to prevent memory leaks
  thumbUrls = new Map<string, string>();

  // Filtering and Search
  searchQuery = signal('');
  filterModel = signal('all');
  filterAspect = signal('all');
  filterDate = signal('all'); // 'all', 'today', '7days', '30days'

  // Selection Mode
  isSelecting = signal(false);
  selectedIds = signal<Set<string>>(new Set());
  
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const model = this.filterModel();
    const aspect = this.filterAspect();
    const dateFilter = this.filterDate();
    const now = new Date();

    return this.allItems().filter(item => {
      // Query filter
      if (!item.prompt.toLowerCase().includes(query)) return false;

      // Model filter
      if (model !== 'all' && item.model !== model) return false;

      // Aspect filter
      if (aspect !== 'all' && item.aspect !== aspect) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.createdAt);
        const dateThreshold = new Date(now);
        
        if (dateFilter === 'today') {
          dateThreshold.setDate(now.getDate() - 1);
        } else if (dateFilter === '7days') {
          dateThreshold.setDate(now.getDate() - 7);
        } else if (dateFilter === '30days') {
          dateThreshold.setDate(now.getDate() - 30);
        }

        if (itemDate < dateThreshold) return false;
      }

      return true;
    });
  });
  
  availableModels = computed(() => {
      const models = new Set(this.allItems().map(item => item.model).filter(Boolean) as string[]);
      return Array.from(models).sort();
  });

  availableAspects = computed(() => {
      const aspects = new Set(this.allItems().map(item => item.aspect).filter(Boolean) as string[]);
      // A simple sort might put '9:16' after '16:9'. A better sort might be needed if many ratios exist.
      return Array.from(aspects).sort();
  });

  constructor() {
    effect(() => {
      // This effect runs whenever allItems changes.
      // It cleans up old URLs and creates new ones.
      this.revokeAllThumbUrls();
      const newUrls = new Map<string, string>();
      for (const item of this.allItems()) {
        newUrls.set(item.id, URL.createObjectURL(item.thumb));
      }
      this.thumbUrls = newUrls;
    });
  }

  async ngOnInit() {
    this.loading.set(true);
    const [items, collections] = await Promise.all([
        this.galleryService.list(),
        this.galleryService.listCollections()
    ]);
    this.allItems.set(items);
    this.collections.set(collections);
    this.loading.set(false);
  }

  ngOnDestroy() {
    this.revokeAllThumbUrls();
  }
  
  // --- Type-safe event handlers ---
  onSearchInput(event: Event) {
      this.searchQuery.set((event.target as HTMLInputElement).value);
  }
  
  onModelFilterChange(event: Event) {
      this.filterModel.set((event.target as HTMLSelectElement).value);
  }
  
  onAspectFilterChange(event: Event) {
      this.filterAspect.set((event.target as HTMLSelectElement).value);
  }
  
  onDateFilterChange(event: Event) {
      this.filterDate.set((event.target as HTMLSelectElement).value);
  }
  // --- End of type-safe event handlers ---

  private revokeAllThumbUrls() {
    this.thumbUrls.forEach(url => URL.revokeObjectURL(url));
    this.thumbUrls.clear();
  }
  
  async toggleFavorite(event: MouseEvent, id: string) {
      event.preventDefault(); // prevent navigation
      event.stopPropagation();
      const isFav = await this.galleryService.toggleFavorite(id);
      this.allItems.update(items => items.map(i => i.id === id ? {...i, isFavorite: isFav} : i));
      this.toastService.show(isFav ? 'Added to favorites.' : 'Removed from favorites.');
  }

  toggleSelectionMode() {
      this.isSelecting.update(v => !v);
      this.selectedIds.set(new Set());
  }
  
  toggleItemSelection(event: MouseEvent, id: string) {
      event.preventDefault();
      event.stopPropagation();
      this.selectedIds.update(ids => {
          if (ids.has(id)) {
              ids.delete(id);
          } else {
              ids.add(id);
          }
          return new Set(ids);
      });
  }
  
  selectAll() {
      this.selectedIds.set(new Set(this.filteredItems().map(i => i.id)));
  }

  deselectAll() {
      this.selectedIds.set(new Set());
  }

  async deleteSelected() {
      const ids = Array.from(this.selectedIds());
      if (confirm(`Are you sure you want to delete ${ids.length} item(s)?`)) {
          await this.galleryService.bulkRemove(ids);
          this.allItems.update(items => items.filter(i => !ids.includes(i.id)));
          this.toggleSelectionMode();
          this.toastService.show(`${ids.length} item(s) deleted.`);
      }
  }

  async moveSelected(event: Event) {
      const target = event.target as HTMLSelectElement;
      const collectionId = target.value;
      if (collectionId === '') return;

      const ids = Array.from(this.selectedIds());
      const newCollectionId = collectionId === 'none' ? null : collectionId;
      
      await this.galleryService.moveItemsToCollection(ids, newCollectionId);
      this.allItems.update(items => items.map(item => {
          if (ids.includes(item.id)) {
              return { ...item, collectionId: newCollectionId };
          }
          return item;
      }));
      
      const collection = this.collections().find(c => c.id === newCollectionId);
      const message = newCollectionId === null 
        ? `${ids.length} item(s) removed from collection.`
        : `${ids.length} item(s) moved to "${collection?.name}".`;
        
      this.toastService.show(message);
      this.toggleSelectionMode();
  }
}