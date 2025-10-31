import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnInit,
  inject,
  computed,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { GalleryService } from '../../services/gallery.service';
import { Collection, GalleryItem } from '../../services/idb';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';
import { createSelectionState, createLoadingState } from '../../utils';

@Component({
  selector: 'pw-gallery',
  standalone: true,
  templateUrl: './gallery.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class GalleryComponent implements OnInit, OnDestroy {
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);
  private keyboardShortcuts = inject(KeyboardShortcutsService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  allItems = signal<GalleryItem[]>([]);
  collections = signal<Collection[]>([]);

  // Professional loading state management
  loadingState = createLoadingState();
  loading = this.loadingState.loading;

  // Thumbnail URL management to prevent memory leaks
  thumbUrls = new Map<string, string>();

  // Filtering and Search using professional filter state
  searchQuery = signal('');
  filterModel = signal('all');
  filterAspect = signal('all');
  filterDate = signal('all'); // 'all', 'today', '7days', '30days'

  // Professional selection state management
  isSelecting = signal(false);
  selection = createSelectionState<string>();
  selectedIds = this.selection.selectedItems;

  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const model = this.filterModel();
    const aspect = this.filterAspect();
    const dateFilter = this.filterDate();
    const now = new Date();

    return this.allItems().filter((item) => {
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
    const models = new Set(
      this.allItems()
        .map((item) => item.model)
        .filter(Boolean) as string[]
    );
    return Array.from(models).sort();
  });

  availableAspects = computed(() => {
    const aspects = new Set(
      this.allItems()
        .map((item) => item.aspect)
        .filter(Boolean) as string[]
    );
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

  public async ngOnInit(): Promise<void> {
    // Use professional loading state
    await this.loadingState.execute(async () => {
      const [items, collections] = await Promise.all([
        this.galleryService.list(),
        this.galleryService.listCollections(),
      ]);
      this.allItems.set(items);
      this.collections.set(collections);
    });

    // Register keyboard shortcuts
    this.keyboardShortcuts.registerDefaultShortcuts({
      delete: () => {
        if (this.isSelecting() && this.selectedCount > 0) {
          this.deleteSelected();
        }
      },
      search: () => {
        // Focus search input using ViewChild
        this.searchInput?.nativeElement.focus();
      },
    });
  }

  public ngOnDestroy(): void {
    this.revokeAllThumbUrls();
    // Unregister shortcuts
    this.keyboardShortcuts.unregister('delete');
    this.keyboardShortcuts.unregister('search');
  }

  // --- Type-safe event handlers ---
  public onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  public onModelFilterChange(event: Event): void {
    this.filterModel.set((event.target as HTMLSelectElement).value);
  }

  public onAspectFilterChange(event: Event): void {
    this.filterAspect.set((event.target as HTMLSelectElement).value);
  }

  public onDateFilterChange(event: Event): void {
    this.filterDate.set((event.target as HTMLSelectElement).value);
  }
  // --- End of type-safe event handlers ---

  private revokeAllThumbUrls(): void {
    this.thumbUrls.forEach((url) => URL.revokeObjectURL(url));
    this.thumbUrls.clear();
  }

  public async toggleFavorite(event: MouseEvent, id: string): Promise<void> {
    event.preventDefault(); // prevent navigation
    event.stopPropagation();
    const isFav = await this.galleryService.toggleFavorite(id);
    this.allItems.update((items) => items.map((i) => (i.id === id ? { ...i, isFavorite: isFav } : i)));
    this.toastService.show(isFav ? 'Added to favorites.' : 'Removed from favorites.');
  }

  public toggleSelectionMode(): void {
    this.isSelecting.update((v) => !v);
    this.selection.deselectAll();
  }

  public toggleItemSelection(event: MouseEvent, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.selection.toggle(id);
  }

  public selectAll(): void {
    const ids = this.filteredItems().map((i) => i.id);
    this.selection.selectAll(ids);
  }

  public deselectAll(): void {
    this.selection.deselectAll();
  }

  public isItemSelected(id: string): boolean {
    return this.selection.isSelected(id);
  }

  public get selectedCount(): number {
    return this.selection.selectedCount();
  }

  public async deleteSelected(): Promise<void> {
    const ids = Array.from(this.selection.selectedItems());
    const count = this.selection.selectedCount();
    if (confirm(`Are you sure you want to delete ${count} item(s)?`)) {
      await this.galleryService.bulkRemove(ids);
      this.allItems.update((items) => items.filter((i) => !ids.includes(i.id)));
      this.toggleSelectionMode();
      this.toastService.show(`${count} item(s) deleted.`);
    }
  }

  public async moveSelected(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    const collectionId = target.value;
    if (collectionId === '') return;

    const ids = Array.from(this.selection.selectedItems());
    const count = this.selection.selectedCount();
    const newCollectionId = collectionId === 'none' ? null : collectionId;

    await this.galleryService.moveItemsToCollection(ids, newCollectionId);
    this.allItems.update((items) =>
      items.map((item) => {
        if (ids.includes(item.id)) {
          return { ...item, collectionId: newCollectionId };
        }
        return item;
      })
    );

    const collection = this.collections().find((c) => c.id === newCollectionId);
    const message =
      newCollectionId === null
        ? `${count} item(s) removed from collection.`
        : `${count} item(s) moved to "${collection?.name}".`;

    this.toastService.show(message);
    this.toggleSelectionMode();
  }
}
