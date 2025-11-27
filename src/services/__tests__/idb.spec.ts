/**
 * IDB (IndexedDB) Service Test Suite
 * Tests for database initialization, schema, and upgrade logic
 */

import { db, GalleryItem, Collection } from '../idb';

// Store upgrade callback for testing
let capturedUpgradeCallback:
  | ((database: any, oldVersion: number, newVersion: number | null, transaction: any) => void)
  | undefined;

// Mock IndexedDB with upgrade callback capture
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
  openDB: jest.fn((name: string, version: number, options?: { upgrade?: Function }) => {
    // Capture the upgrade callback for testing
    if (options?.upgrade) {
      capturedUpgradeCallback = options.upgrade as typeof capturedUpgradeCallback;
    }
    return Promise.resolve(mockDatabase);
  }),
}));

describe('IDB Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedUpgradeCallback = undefined;
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

    it('should call openDB with correct parameters', async () => {
      const { openDB } = require('idb');
      await db();

      expect(openDB).toHaveBeenCalledWith('polliwall', 2, expect.any(Object));
    });
  });

  describe('Database upgrade logic', () => {
    it('should capture upgrade callback', async () => {
      await db();
      expect(capturedUpgradeCallback).toBeDefined();
    });

    it('should create images store on fresh install (oldVersion < 1)', async () => {
      await db();

      // Simulate fresh install (oldVersion = 0)
      if (capturedUpgradeCallback) {
        capturedUpgradeCallback(mockDatabase, 0, 2, mockTransaction);
      }

      expect(mockDatabase.createObjectStore).toHaveBeenCalledWith('images', { keyPath: 'id' });
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith('by_createdAt', 'createdAt');
    });

    it('should create collections store on upgrade to version 2 (oldVersion < 2)', async () => {
      await db();

      // Simulate upgrade from version 1 to 2
      if (capturedUpgradeCallback) {
        capturedUpgradeCallback(mockDatabase, 1, 2, mockTransaction);
      }

      expect(mockTransaction.objectStore).toHaveBeenCalledWith('images');
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith('by_collectionId', 'collectionId');
      expect(mockDatabase.createObjectStore).toHaveBeenCalledWith('collections', { keyPath: 'id' });
    });

    it('should run both upgrade paths on fresh install', async () => {
      await db();

      if (capturedUpgradeCallback) {
        capturedUpgradeCallback(mockDatabase, 0, 2, mockTransaction);
      }

      // Should have created both stores and indexes
      expect(mockDatabase.createObjectStore).toHaveBeenCalledTimes(2);
      expect(mockObjectStore.createIndex).toHaveBeenCalledTimes(3); // by_createdAt, by_collectionId, by_name
    });

    it('should not run upgrade paths if already at current version', async () => {
      await db();
      jest.clearAllMocks();

      if (capturedUpgradeCallback) {
        capturedUpgradeCallback(mockDatabase, 2, 2, mockTransaction);
      }

      // No stores should be created
      expect(mockDatabase.createObjectStore).not.toHaveBeenCalled();
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

    it('should support restyle lineage kind', () => {
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
        lineage: { kind: 'restyle' },
      };

      expect(item.lineage?.kind).toBe('restyle');
      expect(item.lineage?.parentId).toBeUndefined();
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

    it('should support various collection names', () => {
      const collections: Collection[] = [
        { id: '1', name: 'Landscapes', createdAt: new Date().toISOString() },
        { id: '2', name: 'Portraits', createdAt: new Date().toISOString() },
        { id: '3', name: 'Abstract Art', createdAt: new Date().toISOString() },
      ];

      expect(collections.length).toBe(3);
      expect(collections[0].name).toBe('Landscapes');
      expect(collections[2].name).toBe('Abstract Art');
    });
  });
});
