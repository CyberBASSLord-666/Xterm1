import { TestBed } from '@angular/core/testing';
import { GalleryService } from '../gallery.service';
import type { GalleryItem, Collection } from '../idb';

const images = new Map<string, GalleryItem>();
const collections = new Map<string, Collection>();

const createDbMock = () => ({
  put: jest.fn(async (store: string, value: any) => {
    if (store === 'images') {
      images.set(value.id, value);
    }
    if (store === 'collections') {
      collections.set(value.id, value);
    }
  }),
  get: jest.fn(async (store: string, id: string) => {
    if (store === 'images') {
      return images.get(id);
    }
    if (store === 'collections') {
      return collections.get(id);
    }
    return undefined;
  }),
  delete: jest.fn(async (store: string, id: string) => {
    if (store === 'images') {
      images.delete(id);
    }
    if (store === 'collections') {
      collections.delete(id);
    }
  }),
  getAllFromIndex: jest.fn(async (store: string, index: string, value?: string) => {
    if (store === 'images' && index === 'by_createdAt') {
      return Array.from(images.values());
    }
    if (store === 'images' && index === 'by_collectionId') {
      return Array.from(images.values()).filter((item) => item.collectionId === value);
    }
    return [];
  }),
  getAll: jest.fn(async (store: string) => {
    if (store === 'collections') {
      return Array.from(collections.values());
    }
    return [];
  }),
  add: jest.fn(async (_store: string, value: any) => {
    collections.set(value.id, value);
  }),
  transaction: jest.fn((_store: string) => ({
    store: {
      delete: jest.fn(async (id: string) => {
        images.delete(id);
      }),
      get: jest.fn(async (id: string) => images.get(id)),
      put: jest.fn(async (item: GalleryItem) => {
        images.set(item.id, item);
      }),
    },
    done: Promise.resolve(),
  })),
});

jest.mock('../idb', () => {
  const actual = jest.requireActual('../idb');
  return {
    ...actual,
    db: jest.fn(async () => createDbMock()),
  };
});

describe('GalleryService integration behaviour', () => {
  let service: GalleryService;

  beforeEach(() => {
    images.clear();
    collections.clear();
    TestBed.configureTestingModule({ providers: [GalleryService] });
    service = TestBed.inject(GalleryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('persists and retrieves gallery items', async () => {
    const item: GalleryItem = {
      id: 'id-1',
      createdAt: new Date().toISOString(),
      width: 1920,
      height: 1080,
      aspect: '16:9',
      mode: 'exact',
      model: 'flux',
      prompt: 'Sunset over ocean',
      blob: new Blob(),
      thumb: new Blob(),
      isFavorite: false,
      collectionId: null,
    };

    await service.add(item);
    const retrieved = await service.get('id-1');

    expect(retrieved).toEqual(item);
  });

  it('sorts images by createdAt in descending order', async () => {
    const timestamps = ['2024-07-01T10:00:00.000Z', '2024-07-01T11:00:00.000Z', '2024-07-01T12:00:00.000Z'];

    for (const [index, createdAt] of timestamps.entries()) {
      await service.add({
        id: `id-${index}`,
        createdAt,
        width: 1920,
        height: 1080,
        aspect: '16:9',
        mode: 'exact',
        model: 'flux',
        prompt: 'Prompt',
        blob: new Blob(),
        thumb: new Blob(),
        isFavorite: false,
        collectionId: null,
      });
    }

    const list = await service.list();
    expect(list.map((item) => item.createdAt)).toEqual([...timestamps].reverse());
  });

  it('toggles favorites and updates persistence', async () => {
    const createdAt = new Date().toISOString();
    await service.add({
      id: 'fav',
      createdAt,
      width: 1024,
      height: 768,
      aspect: '4:3',
      mode: 'exact',
      model: 'flux',
      prompt: 'Prompt',
      blob: new Blob(),
      thumb: new Blob(),
      isFavorite: false,
      collectionId: null,
    });

    const favorited = await service.toggleFavorite('fav');
    expect(favorited).toBe(true);
    const unfavorited = await service.toggleFavorite('fav');
    expect(unfavorited).toBe(false);
  });

  it('moves items between collections and removes collection metadata', async () => {
    await service.add({
      id: 'move-1',
      createdAt: new Date().toISOString(),
      width: 1200,
      height: 900,
      aspect: '4:3',
      mode: 'exact',
      model: 'flux',
      prompt: 'Move',
      blob: new Blob(),
      thumb: new Blob(),
      isFavorite: false,
      collectionId: null,
    });

    const firstCollection = globalThis.crypto.randomUUID();
    await service.moveItemsToCollection(['move-1'], firstCollection);
    expect(images.get('move-1')?.collectionId).toBe(firstCollection);

    await service.moveItemsToCollection(['move-1'], null);
    expect(images.get('move-1')?.collectionId).toBeNull();
  });

  it('creates, lists, and removes collections with cascade updates', async () => {
    await service.add({
      id: 'c-1',
      createdAt: new Date().toISOString(),
      width: 800,
      height: 600,
      aspect: '4:3',
      mode: 'exact',
      model: 'flux',
      prompt: 'Collection Item',
      blob: new Blob(),
      thumb: new Blob(),
      isFavorite: false,
      collectionId: globalThis.crypto.randomUUID(),
    });

    const collection = await service.addCollection('My Collection');
    await service.moveItemsToCollection(['c-1'], collection.id);

    const collectionsList = await service.listCollections();
    expect(collectionsList).toHaveLength(1);

    await service.removeCollection(collection.id);
    expect(collections.size).toBe(0);
    const updated = await service.get('c-1');
    expect(updated?.collectionId).toBeNull();
  });
});
