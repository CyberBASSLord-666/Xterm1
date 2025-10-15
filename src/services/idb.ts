import { openDB, DBSchema, IDBPDatabase } from 'idb';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { IDBPTransaction } from 'idb';

export interface GalleryItem {
  id: string;
  createdAt: string; // ISO
  width: number;
  height: number;
  aspect: string;
  mode: 'exact' | 'constrained';
  model: string;
  seed?: number;
  prompt: string;
  presetName?: string;
  blob: Blob; // original asset
  thumb: Blob; // generated thumbnail
  lineage?: { parentId?: string; kind?: 'variant' | 'restyle' };
  isFavorite: boolean;
  collectionId: string | null;
  meta?: Record<string, unknown>;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
}

interface WallSchema extends DBSchema {
  images: {
    key: string; // id
    value: GalleryItem;
    indexes: { by_createdAt: string; by_collectionId: string };
  };
  collections: {
    key: string; //id
    value: Collection;
    indexes: { by_name: string };
  };
}

let dbp: Promise<IDBPDatabase<WallSchema>> | null = null;

export function db(): Promise<IDBPDatabase<WallSchema>> {
  if (!dbp) {
    dbp = openDB<WallSchema>('polliwall', 2, {
      upgrade(database, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const imageStore = database.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('by_createdAt', 'createdAt');
        }
        if (oldVersion < 2) {
          const imageStore = transaction.objectStore('images');
          imageStore.createIndex('by_collectionId', 'collectionId');
          database
            .createObjectStore('collections', { keyPath: 'id' })
            .createIndex('by_name', 'name');
        }
      },
    });
  }
  return dbp;
}
