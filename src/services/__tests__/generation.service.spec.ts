import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GenerationService } from '../generation.service';
import { GalleryService } from '../gallery.service';
import { ToastService } from '../toast.service';
import { ImageUtilService } from '../image-util.service';
import * as pollinationsClient from '../pollinations.client';

// Mock the pollinations client module
jest.mock('../pollinations.client', () => ({
  createDeviceWallpaper: jest.fn(),
}));

describe('GenerationService', () => {
  let service: GenerationService;
  let galleryService: jest.Mocked<GalleryService>;
  let toastService: jest.Mocked<ToastService>;
  let imageUtilService: jest.Mocked<ImageUtilService>;
  let createDeviceWallpaperMock: jest.Mock;

  const mockDevice = {
    name: 'Test Device',
    width: 1920,
    height: 1080,
    dpr: 1,
  };

  const mockSupported: Record<string, Array<{ w: number; h: number }>> = {
    '16:9': [{ w: 1920, h: 1080 }],
    '9:16': [{ w: 1080, h: 1920 }],
  };

  const mockOptions = {
    model: 'flux',
    seed: 12345,
  };

  beforeEach(() => {
    const galleryServiceMock = {
      add: jest.fn().mockResolvedValue(undefined),
    };

    const toastServiceMock = {
      show: jest.fn(),
    };

    const imageUtilServiceMock = {
      makeThumbnail: jest.fn().mockResolvedValue(new Blob(['thumb'], { type: 'image/png' })),
    };

    TestBed.configureTestingModule({
      providers: [
        GenerationService,
        { provide: GalleryService, useValue: galleryServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: ImageUtilService, useValue: imageUtilServiceMock },
      ],
    });

    service = TestBed.inject(GenerationService);
    galleryService = TestBed.inject(GalleryService) as jest.Mocked<GalleryService>;
    toastService = TestBed.inject(ToastService) as jest.Mocked<ToastService>;
    imageUtilService = TestBed.inject(ImageUtilService) as jest.Mocked<ImageUtilService>;
    createDeviceWallpaperMock = pollinationsClient.createDeviceWallpaper as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.reset();
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
      },
      blobUrl: 'blob:test',
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

  describe('generateWallpaper', () => {
    it('should show toast when already generating', async () => {
      service.status.set('generating');

      await service.generateWallpaper('test prompt', mockOptions, mockDevice, mockSupported, 'Test Preset');

      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('already'));
    });

    it('should show toast when already saving', async () => {
      service.status.set('saving');

      await service.generateWallpaper('test prompt', mockOptions, mockDevice, mockSupported, 'Test Preset');

      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('already'));
    });

    it('should set status to generating when starting', async () => {
      createDeviceWallpaperMock.mockImplementation(() => new Promise(() => {})); // Never resolves

      const generatePromise = service.generateWallpaper(
        'test prompt',
        mockOptions,
        mockDevice,
        mockSupported,
        'Test Preset'
      );

      // Wait for the promise to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(service.status()).toBe('generating');

      // Clean up - reset without waiting for the hung promise
      service.reset();
    });

    it('should successfully generate and save wallpaper', async () => {
      const mockBlob = new Blob(['test image'], { type: 'image/png' });
      createDeviceWallpaperMock.mockResolvedValue({
        blob: mockBlob,
        width: 1920,
        height: 1080,
        aspect: '16:9',
        mode: 'exact',
      });

      await service.generateWallpaper('test prompt', mockOptions, mockDevice, mockSupported, 'Test Preset');

      expect(service.status()).toBe('success');
      expect(galleryService.add).toHaveBeenCalled();
      expect(imageUtilService.makeThumbnail).toHaveBeenCalled();
      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('saved'));
      expect(service.currentGenerationResult()).not.toBeNull();
    });

    it('should handle generation error', async () => {
      createDeviceWallpaperMock.mockRejectedValue(new Error('Generation failed'));

      await service.generateWallpaper('test prompt', mockOptions, mockDevice, mockSupported, 'Test Preset');

      expect(service.status()).toBe('error');
      expect(service.statusMessage()).toContain('Generation failed');
      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('failed'));
    });

    it('should handle non-Error rejection', async () => {
      createDeviceWallpaperMock.mockRejectedValue('String error');

      await service.generateWallpaper('test prompt', mockOptions, mockDevice, mockSupported, 'Test Preset');

      expect(service.status()).toBe('error');
      expect(service.statusMessage()).toContain('String error');
    });

    it('should update status messages during generation', fakeAsync(() => {
      createDeviceWallpaperMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  blob: new Blob(['test'], { type: 'image/png' }),
                  width: 1920,
                  height: 1080,
                  aspect: '16:9',
                  mode: 'exact',
                }),
              5000
            );
          })
      );

      service.generateWallpaper('test prompt', mockOptions, mockDevice, mockSupported, 'Test Preset');

      // Check initial message
      tick(100);
      expect(service.statusMessage()).toBeTruthy();

      // Advance time to trigger message rotation
      tick(4000);

      // Complete the generation
      tick(1000);

      // Reset to clean up
      service.reset();
    }));
  });

  describe('reset', () => {
    it('should clear status message', () => {
      service.statusMessage.set('Some message');

      service.reset();

      expect(service.statusMessage()).toBe('');
    });

    it('should revoke blob URL when result exists', () => {
      const revokeObjectURL = jest.spyOn(URL, 'revokeObjectURL');

      service.currentGenerationResult.set({
        galleryItem: {
          id: 'test',
          prompt: 'test',
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
        },
        blobUrl: 'blob:test-url',
      });

      service.reset();

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
      revokeObjectURL.mockRestore();
    });
  });
});
