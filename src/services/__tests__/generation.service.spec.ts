import { TestBed } from '@angular/core/testing';
import { GenerationService } from '../generation.service';
import { GalleryService } from '../gallery.service';
import { ToastService } from '../toast.service';
import { ImageUtilService } from '../image-util.service';

describe('GenerationService', () => {
  let service: GenerationService;
  let galleryService: GalleryService;
  let toastService: ToastService;
  let imageUtilService: ImageUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GenerationService,
        GalleryService,
        ToastService,
        ImageUtilService
      ]
    });
    
    service = TestBed.inject(GenerationService);
    galleryService = TestBed.inject(GalleryService);
    toastService = TestBed.inject(ToastService);
    imageUtilService = TestBed.inject(ImageUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have status signal initialized to idle', () => {
    expect(service.status()).toBe('idle');
  });

  it('should have statusMessage signal', () => {
    expect(service.statusMessage).toBeDefined();
    expect(typeof service.statusMessage()).toBe('string');
  });

  it('should have currentGenerationResult signal', () => {
    expect(service.currentGenerationResult).toBeDefined();
    expect(service.currentGenerationResult()).toBeNull();
  });

  it('should have generateWallpaper method', () => {
    expect(service.generateWallpaper).toBeDefined();
    expect(typeof service.generateWallpaper).toBe('function');
  });

  it('should have reset method', () => {
    expect(service.reset).toBeDefined();
    expect(typeof service.reset).toBe('function');
  });

  it('should reset status to idle when reset is called', () => {
    // Set a non-idle status
    service.status.set('generating');
    expect(service.status()).toBe('generating');
    
    // Reset
    service.reset();
    
    // Should be back to idle
    expect(service.status()).toBe('idle');
  });

  it('should clear currentGenerationResult when reset is called', () => {
    // Set some result
    service.currentGenerationResult.set({
      galleryItem: {
        id: 'test',
        prompt: 'test',
        imageUrl: 'test',
        thumbnailUrl: 'test',
        createdAt: new Date().toISOString(),
        isFavorite: false,
        width: 1920,
        height: 1080,
        collectionIds: []
      },
      blobUrl: 'blob:test'
    });
    
    expect(service.currentGenerationResult()).not.toBeNull();
    
    // Reset
    service.reset();
    
    // Should be cleared
    expect(service.currentGenerationResult()).toBeNull();
  });

  it('should inject required services', () => {
    expect(galleryService).toBeTruthy();
    expect(toastService).toBeTruthy();
    expect(imageUtilService).toBeTruthy();
  });
});
