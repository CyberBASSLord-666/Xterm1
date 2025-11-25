/**
 * IDB (IndexedDB) Service Test Suite
 * Tests for database initialization and schema
 */

import { db, GalleryItem, Collection } from '../idb';

// Mock IndexedDB
const mockObjectStore = {
  createIndex: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
};

const mockDatabase = {
  createObjectStore: jest.fn(() => mockObjectStore),
};

jest.mock('idb', () => ({
  openDB: jest.fn(() => Promise.resolve(mockDatabase)),
}));

describe('IDB Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('db function', () => {
    it('should return a promise', () => {
      const result = db();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return the database instance', async () => {
      const database = await db();
      expect(database).toBeTruthy();
    });

    it('should be callable multiple times', async () => {
      const db1 = await db();
      const db2 = await db();
      // Both should resolve to the same mock
      expect(db1).toBeTruthy();
      expect(db2).toBeTruthy();
    });
  });

  describe('GalleryItem interface', () => {
    it('should have correct structure', () => {
      const item: GalleryItem = {
        id: 'test-id',
        createdAt: new Date().toISOString(),
        width: 1920,
        height: 1080,
        aspect: '16:9',
        mode: 'exact',
        model: 'flux',
        prompt: 'Test prompt',
        blob: new Blob(['test'], { type: 'image/png' }),
        thumb: new Blob(['thumb'], { type: 'image/png' }),
        isFavorite: false,
        collectionId: null,
      };

      expect(item.id).toBe('test-id');
      expect(item.mode).toBe('exact');
      expect(item.isFavorite).toBe(false);
    });

    it('should support optional fields', () => {
      const item: GalleryItem = {
        id: 'test-id',
        createdAt: new Date().toISOString(),
        width: 1920,
        height: 1080,
        aspect: '16:9',
        mode: 'constrained',
        model: 'flux',
        prompt: 'Test prompt',
        blob: new Blob(['test'], { type: 'image/png' }),
        thumb: new Blob(['thumb'], { type: 'image/png' }),
        isFavorite: true,
        collectionId: 'collection-1',
        seed: 12345,
        presetName: 'My Preset',
        lineage: { parentId: 'parent-1', kind: 'variant' },
        meta: { custom: 'data' },
      };

      expect(item.seed).toBe(12345);
      expect(item.presetName).toBe('My Preset');
      expect(item.lineage?.kind).toBe('variant');
      expect(item.meta?.custom).toBe('data');
    });
  });

  describe('Collection interface', () => {
    it('should have correct structure', () => {
      const collection: Collection = {
        id: 'collection-id',
        name: 'My Collection',
        createdAt: new Date().toISOString(),
      };

      expect(collection.id).toBe('collection-id');
      expect(collection.name).toBe('My Collection');
      expect(collection.createdAt).toBeTruthy();
    });
  });
});
