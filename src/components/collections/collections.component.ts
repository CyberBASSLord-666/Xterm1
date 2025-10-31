import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { GalleryService } from '../../services/gallery.service';
import { Collection } from '../../services/idb';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';
import { createLoadingState, createFormField } from '../../utils';

@Component({
  selector: 'pw-collections',
  templateUrl: './collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule],
})
export class CollectionsComponent implements OnInit {
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);

  collections = signal<Collection[]>([]);
  
  // Professional loading state management
  loadingState = createLoadingState();
  
  // Professional form field with validation
  newCollectionName = createFormField('', [
    (value: string) => (value.trim() ? null : 'Please enter a collection name'),
    (value: string) =>
      value.trim().length >= 2 ? null : 'Name must be at least 2 characters',
    (value: string) =>
      value.trim().length <= 50 ? null : 'Name must be 50 characters or less',
  ]);

  public async ngOnInit(): Promise<void> {
    await this.loadCollections();
  }

  public onNameInput(event: Event): void {
    this.newCollectionName.value.set((event.target as HTMLInputElement).value);
    this.newCollectionName.touched.set(true);
  }

  public async loadCollections(): Promise<void> {
    await this.loadingState.execute(async () => {
      this.collections.set(await this.galleryService.listCollections());
    });
  }

  public async createCollection(): Promise<void> {
    this.newCollectionName.touched.set(true);
    this.newCollectionName.validate();
    
    if (!this.newCollectionName.valid()) {
      this.toastService.show(this.newCollectionName.error() || 'Invalid collection name');
      return;
    }
    
    const name = this.newCollectionName.value().trim();
    try {
      await this.galleryService.addCollection(name);
      this.newCollectionName.reset();
      this.toastService.show(`Collection "${name}" created.`);
      await this.loadCollections();
    } catch (e: unknown) {
      const error = e as Error;
      this.toastService.show(`Error creating collection: ${error.message}`);
    }
  }

  public async deleteCollection(collection: Collection): Promise<void> {
    if (
      confirm(
        `Are you sure you want to delete the "${collection.name}" collection? All wallpapers within it will be uncategorized.`
      )
    ) {
      try {
        await this.galleryService.removeCollection(collection.id);
        this.toastService.show(`Collection "${collection.name}" deleted.`);
        await this.loadCollections();
      } catch (e: unknown) {
        const error = e as Error;
        this.toastService.show(`Error deleting collection: ${error.message}`);
      }
    }
  }
}
