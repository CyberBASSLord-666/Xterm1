import { TestBed } from '@angular/core/testing';
import { GalleryService } from '../gallery.service';
import { GalleryItem } from '../idb';

describe('GalleryService', () => {
  let service: GalleryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GalleryService],
    });
    service = TestBed.inject(GalleryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have add method', () => {
    expect(service.add).toBeDefined();
    expect(typeof service.add).toBe('function');
  });

  it('should have get method', () => {
    expect(service.get).toBeDefined();
    expect(typeof service.get).toBe('function');
  });

  it('should have update method', () => {
    expect(service.update).toBeDefined();
    expect(typeof service.update).toBe('function');
  });

  it('should have remove method', () => {
    expect(service.remove).toBeDefined();
    expect(typeof service.remove).toBe('function');
  });

  it('should have bulkRemove method', () => {
    expect(service.bulkRemove).toBeDefined();
    expect(typeof service.bulkRemove).toBe('function');
  });

  it('should have list method', () => {
    expect(service.list).toBeDefined();
    expect(typeof service.list).toBe('function');
  });

  it('should have toggleFavorite method', () => {
    expect(service.toggleFavorite).toBeDefined();
    expect(typeof service.toggleFavorite).toBe('function');
  });

  it('should handle gallery item structure', () => {
    const mockItem: GalleryItem = {
      id: 'test-id',
      prompt: 'test prompt',
      blob: new Blob(['test'], { type: 'image/png' }),
      thumb: new Blob(['thumb'], { type: 'image/png' }),
      createdAt: new Date().toISOString(),
      isFavorite: false,
      width: 1920,
      height: 1080,
      aspect: '16:9',
      mode: 'exact' as const,
      model: 'flux',
      collectionId: null,
    };

    expect(mockItem.id).toBe('test-id');
    expect(mockItem.prompt).toBe('test prompt');
  });
});
