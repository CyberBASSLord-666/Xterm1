
import { Injectable } from '@angular/core';
import { db, GalleryItem, Collection } from './idb';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  
  // Gallery Item Methods
  async add(item: GalleryItem) {
    const d = await db();
    await d.put('images', item);
  }

  async get(id: string): Promise<GalleryItem | undefined> {
    const d = await db();
    return d.get('images', id);
  }
  
  async update(item: GalleryItem): Promise<void> {
      const d = await db();
      await d.put('images', item);
  }

  async remove(id: string) {
    const d = await db();
    await d.delete('images', id);
  }
  
  async bulkRemove(ids: string[]): Promise<void> {
      const d = await db();
      const tx = d.transaction('images', 'readwrite');
      await Promise.all(ids.map(id => tx.store.delete(id)));
      await tx.done;
  }

  async list(): Promise<GalleryItem[]> {
    const d = await db();
    const items = await d.getAllFromIndex('images', 'by_createdAt');
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async toggleFavorite(id: string): Promise<boolean> {
      const item = await this.get(id);
      if (item) {
          item.isFavorite = !item.isFavorite;
          await this.update(item);
          return item.isFavorite;
      }
      return false;
  }
  
  async moveItemsToCollection(ids: string[], collectionId: string | null): Promise<void> {
      const d = await db();
      const tx = d.transaction('images', 'readwrite');
      const items = await Promise.all(ids.map(id => tx.store.get(id)));
      
      const updatedItems = items.map(item => {
          if (item) {
              item.collectionId = collectionId;
              return tx.store.put(item);
          }
          return Promise.resolve();
      });
      
      await Promise.all(updatedItems);
      await tx.done;
  }

  // Collection Methods
  async addCollection(name: string): Promise<Collection> {
      const d = await db();
      const collection: Collection = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString()
      };
      await d.add('collections', collection);
      return collection;
  }
  
  async listCollections(): Promise<Collection[]> {
      const d = await db();
      return (await d.getAll('collections')).sort((a,b) => a.name.localeCompare(b.name));
  }
  
  async getCollection(id: string): Promise<Collection | undefined> {
      const d = await db();
      return d.get('collections', id);
  }
  
  async removeCollection(id: string): Promise<void> {
      const d = await db();
      // Unset collectionId for all items in this collection first
      const items = await d.getAllFromIndex('images', 'by_collectionId', id);
      const tx = d.transaction('images', 'readwrite');
      const updates = items.map(item => {
          item.collectionId = null;
          return tx.store.put(item);
      });
      await Promise.all(updates);
      await tx.done;
      
      await d.delete('collections', id);
  }
}