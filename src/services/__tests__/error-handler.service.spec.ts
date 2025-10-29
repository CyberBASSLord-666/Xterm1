import { TestBed } from '@angular/core/testing';
import { ErrorHandlerService, AppError } from '../error-handler.service';
import { LoggerService } from '../logger.service';
import { ToastService } from '../toast.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let loggerService: jest.Mocked<LoggerService>;
  let toastService: jest.Mocked<ToastService>;

  beforeEach(() => {
    const loggerSpy = {
      error: jest.fn(),
    };
    const toastSpy = {
      show: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ErrorHandlerService,
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(ErrorHandlerService);
    loggerService = TestBed.inject(LoggerService) as jest.Mocked<LoggerService>;
    toastService = TestBed.inject(ToastService) as jest.Mocked<ToastService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleError', () => {
    it('should log error', () => {
      const error = new Error('test error');
      service.handleError(error, 'TestComponent', false);
      expect(loggerService.error).toHaveBeenCalled();
    });

    it('should show toast by default', () => {
      const error = new Error('test error');
      service.handleError(error, 'TestComponent');
      expect(toastService.show).toHaveBeenCalled();
    });

    it('should not show toast when disabled', () => {
      const error = new Error('test error');
      service.handleError(error, 'TestComponent', false);
      expect(toastService.show).not.toHaveBeenCalled();
    });

    it('should handle string errors', () => {
      service.handleError('string error', 'TestComponent', false);
      expect(loggerService.error).toHaveBeenCalledWith('string error', 'string error', 'TestComponent');
    });

    it('should handle AppError with user-friendly messages', () => {
      const error = new AppError('User friendly message', 'ERROR_CODE', true);
      service.handleError(error, 'TestComponent');
      expect(toastService.show).toHaveBeenCalledWith('User friendly message');
    });
  });

  describe('createError', () => {
    it('should create AppError', () => {
      const error = service.createError('test message', 'TEST_CODE', false);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
    });

    it('should show toast by default', () => {
      service.createError('test message');
      expect(toastService.show).toHaveBeenCalled();
    });
  });

  describe('wrapAsync', () => {
    it('should return result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await service.wrapAsync(operation, 'TestComponent', false);
      expect(result).toBe('success');
    });

    it('should handle errors and return null', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failed'));
      const result = await service.wrapAsync(operation, 'TestComponent', false);
      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should convert network errors', () => {
      const error = new Error('Failed to fetch');
      service.handleError(error, 'Test');
      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });

    it('should convert timeout errors', () => {
      const error = new Error('Request timed out');
      service.handleError(error, 'Test');
      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('took too long'));
    });

    it('should convert 429 errors', () => {
      const error = new Error('429 Too Many Requests');
      service.handleError(error, 'Test');
      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('Too many requests'));
    });

    it('should convert 500 errors', () => {
      const error = new Error('500 Internal Server Error');
      service.handleError(error, 'Test');
      expect(toastService.show).toHaveBeenCalledWith(expect.stringContaining('temporarily unavailable'));
    });
  });
});
