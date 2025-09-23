import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { GalleryService } from '../../services/gallery.service';
import { Collection } from '../../services/idb';
import { ToastService } from '../../services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'pw-collections',
  templateUrl: './collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class CollectionsComponent implements OnInit {
  private galleryService = inject(GalleryService);
  private toastService = inject(ToastService);

  collections = signal<Collection[]>([]);
  loading = signal(true);
  newCollectionName = signal('');
  
  async ngOnInit() {
    await this.loadCollections();
  }

  onNameInput(event: Event) {
      this.newCollectionName.set((event.target as HTMLInputElement).value);
  }

  async loadCollections() {
      this.loading.set(true);
      this.collections.set(await this.galleryService.listCollections());
      this.loading.set(false);
  }

  async createCollection() {
      const name = this.newCollectionName().trim();
      if (!name) {
          this.toastService.show('Please enter a collection name.');
          return;
      }
      try {
          await this.galleryService.addCollection(name);
          this.newCollectionName.set('');
          this.toastService.show(`Collection "${name}" created.`);
          await this.loadCollections();
      } catch (e: any) {
          this.toastService.show(`Error creating collection: ${e.message}`);
      }
  }

  async deleteCollection(collection: Collection) {
      if (confirm(`Are you sure you want to delete the "${collection.name}" collection? All wallpapers within it will be uncategorized.`)) {
          try {
            await this.galleryService.removeCollection(collection.id);
            this.toastService.show(`Collection "${collection.name}" deleted.`);
            await this.loadCollections();
          } catch(e: any) {
              this.toastService.show(`Error deleting collection: ${e.message}`);
          }
      }
  }
}
