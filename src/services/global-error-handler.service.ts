import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AppError, ErrorHandlerService } from './error-handler.service';
import { LoggerService } from './logger.service';

/**
 * Global error handler for Angular application.
 * Catches all unhandled errors and routes them through our error handling system.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorHandler = inject(ErrorHandlerService);
  private logger = inject(LoggerService);

  public handleError(error: Error | unknown): void {
    // Check if error is from chunk loading failure (common in Angular lazy loading)
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    const errorObj = error as { message?: string; rejection?: unknown };

    if (errorObj?.message && chunkFailedMessage.test(errorObj.message)) {
      this.logger.error('Chunk loading failed - app may need refresh', error, 'GlobalErrorHandler');
      const userError = new AppError('Component failed to load, please refresh.', 'chunk-load', true, error);
      this.errorHandler.handleError(userError, 'GlobalErrorHandler');
      return;
    }

    // Check if it's a zone.js error (wrap the original error)
    const zoneAwareError = errorObj?.rejection || error;

    // Log to console in development for debugging
    if (typeof error === 'object' && error !== null) {
      this.logger.error('Unhandled error', zoneAwareError, 'GlobalErrorHandler');
    }

    // Route through our error handling system
    this.errorHandler.handleError(zoneAwareError, 'GlobalErrorHandler', true);
  }
}
