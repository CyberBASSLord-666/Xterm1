import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';
import { getErrorMessage } from '../utils/type-guards';
import { ERROR_MESSAGES } from '../constants';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly isUserFriendly: boolean = false,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Centralized error handling service that provides consistent
 * error processing, logging, and user notification.
 */
@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private logger = inject(LoggerService);
  private toast = inject(ToastService);

  /**
   * Handle an error with logging and optional user notification.
   * @param error The error to handle
   * @param source The source component or service where the error occurred
   * @param showToast Whether to show a toast notification to the user
   */
  public handleError(error: unknown, source: string, showToast: boolean = true): void {
    const errorMessage = getErrorMessage(error);
    const isUserFriendly = error instanceof AppError && error.isUserFriendly;

    // Log the error
    this.logger.error(errorMessage, error, source);

    // Show user notification if requested
    if (showToast) {
      const userMessage = isUserFriendly ? errorMessage : this.getUserFriendlyMessage(error);
      this.toast.show(userMessage);
    }
  }

  /**
   * Convert technical errors to user-friendly messages.
   */
  private getUserFriendlyMessage(error: unknown): string {
    const message = getErrorMessage(error);

    // Network errors
    if (this.isNetworkError(message)) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (this.isTimeoutError(message)) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    // API errors
    if (this.isRateLimitError(message)) {
      return ERROR_MESSAGES.RATE_LIMIT_ERROR;
    }

    if (this.isServerError(message)) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }

    if (this.isAuthError(message)) {
      return ERROR_MESSAGES.AUTH_ERROR;
    }

    // Default fallback
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(message: string): boolean {
    return message.includes('Failed to fetch') || message.includes('NetworkError');
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(message: string): boolean {
    return message.includes('timeout') || message.includes('timed out');
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(message: string): boolean {
    return message.includes('429');
  }

  /**
   * Check if error is a server error
   */
  private isServerError(message: string): boolean {
    return message.includes('500') || message.includes('503');
  }

  /**
   * Check if error is an authentication error
   */
  private isAuthError(message: string): boolean {
    return message.includes('401') || message.includes('403');
  }

  /**
   * Create a user-friendly error with automatic handling.
   */
  public createError(message: string, code?: string, showToast: boolean = true): AppError {
    const error = new AppError(message, code, true);
    if (showToast) {
      this.toast.show(message);
    }
    return error;
  }

  /**
   * Wrap an async operation with error handling.
   */
  public async wrapAsync<T>(operation: () => Promise<T>, source: string, showToast: boolean = true): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, source, showToast);
      return null;
    }
  }
}
