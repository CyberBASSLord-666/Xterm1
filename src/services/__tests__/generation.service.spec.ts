import { TestBed } from '@angular/core/testing';
import { GenerationService } from '../generation.service';
import { GalleryService } from '../gallery.service';
import { ToastService } from '../toast.service';
import { ImageUtilService } from '../image-util.service';
import { BlobUrlManagerService } from '../blob-url-manager.service';
import { createDeviceWallpaper } from '../pollinations.client';

jest.mock('../pollinations.client', () => ({
  createDeviceWallpaper: jest.fn(),
  textToSpeech: jest.fn(),
}));

describe('GenerationService', () => {
  class GalleryServiceStub {
    add = jest.fn().mockResolvedValue(undefined);
  }

  class ToastServiceStub {
    show = jest.fn();
  }

  class ImageUtilServiceStub {
    makeThumbnail = jest.fn().mockResolvedValue(new Blob(['thumb'], { type: 'image/jpeg' }));
  }

  class BlobUrlManagerStub {
    createUrl = jest.fn().mockReturnValue('blob:url');
    revokeUrl = jest.fn();
  }

  let service: GenerationService;
  let gallery: GalleryServiceStub;
  let blobManager: BlobUrlManagerStub;
  const createWallpaperMock = createDeviceWallpaper as jest.Mock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GenerationService,
        { provide: GalleryService, useClass: GalleryServiceStub },
        { provide: ToastService, useClass: ToastServiceStub },
        { provide: ImageUtilService, useClass: ImageUtilServiceStub },
        { provide: BlobUrlManagerService, useClass: BlobUrlManagerStub },
      ],
    });

    service = TestBed.inject(GenerationService);
    gallery = TestBed.inject(GalleryService) as unknown as GalleryServiceStub;
    blobManager = TestBed.inject(BlobUrlManagerService) as unknown as BlobUrlManagerStub;

    createWallpaperMock.mockResolvedValue({
      blob: new Blob(['image'], { type: 'image/jpeg' }),
      width: 1080,
      height: 1920,
      aspect: '9:16',
      mode: 'exact',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('adds generated wallpaper to the gallery and manages blob URLs', async () => {
    await service.generateWallpaper(
      'prompt',
      { model: 'flux' },
      { width: 1080, height: 1920, dpr: 1 },
      { '9:16': [{ w: 1080, h: 1920 }] },
      'preset'
    );

    expect(createWallpaperMock).toHaveBeenCalled();
    expect(gallery.add).toHaveBeenCalledTimes(1);
    expect(blobManager.createUrl).toHaveBeenCalledTimes(1);
    expect(service.status()).toBe('success');
    expect(service.currentGenerationResult()?.blobUrl).toBe('blob:url');

    service.reset();
    expect(blobManager.revokeUrl).toHaveBeenCalledWith('blob:url');
  });
});
