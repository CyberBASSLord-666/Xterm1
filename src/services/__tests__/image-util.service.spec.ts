import { TestBed } from '@angular/core/testing';
import { ImageUtilService } from '../image-util.service';
import { LoggerService } from '../logger.service';

describe('ImageUtilService', () => {
  class LoggerStub {
    debug = jest.fn();
    error = jest.fn();
  }

  let service: ImageUtilService;
  let logger: LoggerStub;
  let originalCreateElement: typeof document.createElement;
  let createImageBitmapMock: jest.Mock;

  const createBitmap = (width: number, height: number) => ({
    width,
    height,
    close: jest.fn(),
  });

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
    createImageBitmapMock = global.createImageBitmap as unknown as jest.Mock;
    createImageBitmapMock.mockReset();

    TestBed.configureTestingModule({
      providers: [ImageUtilService, { provide: LoggerService, useClass: LoggerStub }],
    });
    service = TestBed.inject(ImageUtilService);
    logger = TestBed.inject(LoggerService) as unknown as LoggerStub;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function stubCanvas({
    width,
    height,
    toBlob,
  }: {
    width: number;
    height: number;
    toBlob: (callback: BlobCallback, type?: string, quality?: any) => void;
  }): HTMLCanvasElement {
    const context = {
      drawImage: jest.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
      filter: '',
    } as unknown as CanvasRenderingContext2D;

    const canvas = {
      width,
      height,
      getContext: jest.fn().mockReturnValue(context),
      toBlob: jest.fn(toBlob),
    } as unknown as HTMLCanvasElement;

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return canvas;
      }
      return originalCreateElement(tag);
    });

    return canvas;
  }

  it('creates thumbnails and logs compression metrics', async () => {
    const sourceBlob = new Blob(['original'], { type: 'image/png' });
    createImageBitmapMock.mockResolvedValue(createBitmap(800, 600));

    const thumbnailBlob = new Blob(['thumbnail'], { type: 'image/jpeg' });
    const canvas = stubCanvas({
      width: 320,
      height: 240,
      toBlob: (callback, type, quality) => {
        expect(type).toBe('image/jpeg');
        expect(quality).toBeCloseTo(0.85);
        callback(thumbnailBlob);
      },
    });

    const result = await service.makeThumbnail(sourceBlob, { size: 320, quality: 0.85 });

    expect(result).toBe(thumbnailBlob);
    expect(canvas.getContext).toHaveBeenCalledWith('2d', { alpha: false });
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Thumbnail created'),
      expect.objectContaining({ originalSize: sourceBlob.size, thumbnailSize: thumbnailBlob.size }),
      'ImageUtilService'
    );
  });

  it('rejects when canvas conversion fails and logs the error', async () => {
    const sourceBlob = new Blob(['broken'], { type: 'image/png' });
    createImageBitmapMock.mockResolvedValue(createBitmap(400, 400));

    stubCanvas({
      width: 320,
      height: 320,
      toBlob: (callback) => callback(null),
    });

    await expect(service.makeThumbnail(sourceBlob)).rejects.toThrow('Canvas toBlob failed');
    expect(logger.error).toHaveBeenCalledWith('Failed to create thumbnail', expect.any(Error), 'ImageUtilService');
  });

  it('compresses oversized images respecting target dimensions and format', async () => {
    const sourceBlob = new Blob(['source'], { type: 'image/png' });
    createImageBitmapMock.mockResolvedValue(createBitmap(4096, 2048));

    const compressedBlob = new Blob(['compressed'], { type: 'image/webp' });
    const canvas = stubCanvas({
      width: 2048,
      height: 1024,
      toBlob: (callback, type, quality) => {
        expect(type).toBe('image/webp');
        expect(quality).toBeCloseTo(0.75);
        callback(compressedBlob);
      },
    });

    const result = await service.compressImage(sourceBlob, {
      maxWidth: 2048,
      maxHeight: 1024,
      quality: 0.75,
      format: 'image/webp',
    });

    expect(result).toBe(compressedBlob);
    expect(canvas.getContext).toHaveBeenCalledWith('2d', { alpha: true });
  });

  it('preserves original dimensions when compression limits are larger than the source', async () => {
    const sourceBlob = new Blob(['small'], { type: 'image/png' });
    createImageBitmapMock.mockResolvedValue(createBitmap(640, 480));

    const outputBlob = new Blob(['small-result'], { type: 'image/jpeg' });
    const canvas = stubCanvas({
      width: 640,
      height: 480,
      toBlob: (callback, type, quality) => {
        expect(type).toBe('image/jpeg');
        expect(quality).toBeCloseTo(0.9);
        callback(outputBlob);
      },
    });

    const result = await service.compressImage(sourceBlob, {
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.9,
      format: 'image/jpeg',
    });

    expect(result).toBe(outputBlob);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(480);
  });

  it('converts between formats without resizing', async () => {
    const sourceBlob = new Blob(['convert'], { type: 'image/png' });
    createImageBitmapMock.mockResolvedValue(createBitmap(1024, 768));

    const convertedBlob = new Blob(['converted'], { type: 'image/jpeg' });
    stubCanvas({
      width: 1024,
      height: 768,
      toBlob: (callback, type, quality) => {
        expect(type).toBe('image/jpeg');
        expect(quality).toBeCloseTo(0.9);
        callback(convertedBlob);
      },
    });

    const result = await service.convertFormat(sourceBlob, 'image/jpeg');
    expect(result).toBe(convertedBlob);
  });

  it('generates blurred placeholders at low resolution', async () => {
    const sourceBlob = new Blob(['placeholder'], { type: 'image/png' });
    createImageBitmapMock.mockResolvedValue(createBitmap(1600, 800));

    const placeholderBlob = new Blob(['placeholder-result'], { type: 'image/jpeg' });
    const canvas = stubCanvas({
      width: 20,
      height: 10,
      toBlob: (callback) => callback(placeholderBlob),
    });

    const result = await service.createPlaceholder(sourceBlob);

    expect(result).toBe(placeholderBlob);
    const context = canvas.getContext('2d') as any;
    expect(context.filter).toBe('blur(2px)');
  });
});
