import { TestBed } from '@angular/core/testing';
import { GenerationService } from '../generation.service';
import { GalleryService } from '../gallery.service';
import { ToastService } from '../toast.service';
import { ImageUtilService } from '../image-util.service';
import { createDeviceWallpaper } from '../pollinations.client';
import type { DeviceInfo, SupportedResolutions } from '../pollinations.client';

jest.mock('../pollinations.client', () => ({
  createDeviceWallpaper: jest.fn(),
}));

describe('GenerationService', () => {
  const mockBlob = new Blob(['wallpaper'], { type: 'image/png' });

  class GalleryStub {
    add = jest.fn().mockResolvedValue(undefined);
  }

  class ToastStub {
    show = jest.fn();
  }

  class ImageUtilStub {
    makeThumbnail = jest.fn().mockResolvedValue(new Blob(['thumb'], { type: 'image/jpeg' }));
  }

  let service: GenerationService;
  let gallery: GalleryStub;
  let toast: ToastStub;
  let imageUtil: ImageUtilStub;
  const device: DeviceInfo = { width: 1920, height: 1080, dpr: 1 };
  const supported: SupportedResolutions = { portrait: [], landscape: [] };

  let setIntervalSpy: jest.SpyInstance;
  const createDeviceWallpaperMock = createDeviceWallpaper as jest.MockedFunction<typeof createDeviceWallpaper>;

  beforeEach(() => {
    jest.useFakeTimers();
    setIntervalSpy = jest.spyOn(window, 'setInterval');
    TestBed.configureTestingModule({
      providers: [
        GenerationService,
        { provide: GalleryService, useClass: GalleryStub },
        { provide: ToastService, useClass: ToastStub },
        { provide: ImageUtilService, useClass: ImageUtilStub },
      ],
    });

    service = TestBed.inject(GenerationService);
    gallery = TestBed.inject(GalleryService) as unknown as GalleryStub;
    toast = TestBed.inject(ToastService) as unknown as ToastStub;
    imageUtil = TestBed.inject(ImageUtilService) as unknown as ImageUtilStub;
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    createDeviceWallpaperMock.mockReset();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('generates and saves wallpapers successfully', async () => {
    createDeviceWallpaperMock.mockResolvedValue({
      blob: mockBlob,
      width: 1920,
      height: 1080,
      aspect: '16:9',
      mode: 'exact',
    });

    const generatePromise = service.generateWallpaper('Sunrise over dunes', { model: 'flux', seed: 42 }, device, supported, 'Default');

    await jest.runOnlyPendingTimersAsync();
    await generatePromise;

    expect(service.status()).toBe('success');
    expect(service.statusMessage()).toBe('Wallpaper saved to gallery.');
    expect(gallery.add).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'Sunrise over dunes', model: 'flux', blob: mockBlob })
    );
    expect(imageUtil.makeThumbnail).toHaveBeenCalledWith(mockBlob);
    expect(toast.show).toHaveBeenCalledWith('Wallpaper generated and saved to gallery.');
    const result = service.currentGenerationResult();
    expect(result?.galleryItem.id).toMatch(/^00000000-0000-4000-8000-/);
  });

  it('prevents concurrent generations and surfaces user feedback', async () => {
    createDeviceWallpaperMock.mockReturnValue(new Promise(() => {}));

    service.generateWallpaper('First run', { model: 'flux' }, device, supported, 'Preset');

    service.generateWallpaper('Second run', { model: 'flux' }, device, supported, 'Preset');

    expect(toast.show).toHaveBeenCalledWith('A generation is already in progress.');
    expect(createDeviceWallpaperMock.mock.calls).toHaveLength(1);
  });

  it('handles errors gracefully and resets state', async () => {
    createDeviceWallpaperMock.mockRejectedValue(new Error('Service unavailable'));

    await service.generateWallpaper('Failure scenario', { model: 'flux' }, device, supported, 'Preset').catch(() => undefined);

    expect(service.status()).toBe('error');
    expect(service.statusMessage()).toContain('Generation failed');
    expect(toast.show).toHaveBeenCalledWith(expect.stringContaining('Generation failed'));
    expect(gallery.add).not.toHaveBeenCalled();
  });

  it('resets active generation, clearing timers and revoking URLs', async () => {
    createDeviceWallpaperMock.mockResolvedValue({
      blob: mockBlob,
      width: 1920,
      height: 1080,
      aspect: '16:9',
      mode: 'exact',
    });

    await service.generateWallpaper('Reset example', { model: 'flux' }, device, supported, 'Preset');

    const revokeSpy = jest.spyOn(URL, 'revokeObjectURL');
    service.reset();

    expect(service.status()).toBe('idle');
    expect(service.currentGenerationResult()).toBeNull();
    expect(revokeSpy).toHaveBeenCalled();
    revokeSpy.mockRestore();
  });
});
