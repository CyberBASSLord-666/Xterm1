import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from '../settings/settings.component';
import { SettingsService } from '../../services/settings.service';
import { GalleryService } from '../../services/gallery.service';
import { ToastService } from '../../services/toast.service';
import { BlobUrlManagerService } from '../../services/blob-url-manager.service';
import { ErrorHandlerService, AppError } from '../../services/error-handler.service';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';
import JSZip from 'jszip';

class GalleryServiceStub {
  add = jest.fn().mockResolvedValue(undefined);
  list = jest.fn().mockResolvedValue([]);
}

class ToastServiceStub {
  show = jest.fn();
}

class BlobUrlManagerStub {
  createUrl = jest.fn().mockReturnValue('blob:url');
  revokeUrl = jest.fn();
}

class ErrorHandlerStub {
  handleError = jest.fn();
}

class KeyboardShortcutsStub {
  registerScope = jest.fn().mockReturnValue(() => {});
}

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;
  let galleryService: GalleryServiceStub;
  let toastService: ToastServiceStub;
  let errorHandler: ErrorHandlerStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        SettingsService,
        { provide: GalleryService, useClass: GalleryServiceStub },
        { provide: ToastService, useClass: ToastServiceStub },
        { provide: BlobUrlManagerService, useClass: BlobUrlManagerStub },
        { provide: ErrorHandlerService, useClass: ErrorHandlerStub },
        { provide: KeyboardShortcutsService, useClass: KeyboardShortcutsStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    galleryService = TestBed.inject(GalleryService) as unknown as GalleryServiceStub;
    toastService = TestBed.inject(ToastService) as unknown as ToastServiceStub;
    errorHandler = TestBed.inject(ErrorHandlerService) as unknown as ErrorHandlerStub;
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
    jest.clearAllMocks();
  });

  it('imports gallery items from a valid export archive', async () => {
    const metadata = [
      {
        id: 'abc',
        createdAt: new Date().toISOString(),
        width: 1080,
        height: 1920,
        aspect: '9:16',
        mode: 'exact',
        model: 'flux',
        prompt: 'Test prompt',
        isFavorite: false,
        collectionId: null,
      },
    ];

    const zip = new JSZip();
    zip.file('metadata.json', JSON.stringify(metadata));
    zip.file('images/abc.jpg', new Blob(['image'], { type: 'image/jpeg' }));
    zip.file('thumbnails/abc.jpg', new Blob(['thumb'], { type: 'image/jpeg' }));
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'export.zip', { type: 'application/zip' });

    component.importFile.value.set(file);

    await component.importGallery();

    expect(galleryService.add).toHaveBeenCalledTimes(1);
    expect(toastService.show).toHaveBeenCalledWith('Imported 1 wallpaper successfully.');
    expect(component.selectedImportFileName()).toBeNull();
  });

  it('surfaces errors from invalid archives', async () => {
    const file = new File([new Blob(['bad'])], 'invalid.zip', { type: 'application/zip' });
    component.importFile.value.set(file);

    await component.importGallery();

    expect(galleryService.add).not.toHaveBeenCalled();
    expect(errorHandler.handleError).toHaveBeenCalled();
    const handledError = errorHandler.handleError.mock.calls[0]?.[0] as AppError;
    expect(handledError).toBeInstanceOf(AppError);
    expect(handledError.isUserFriendly).toBe(true);
  });
});
