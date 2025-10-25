import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';

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
    const errorMessage = this.extractErrorMessage(error);
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
   * Extract a meaningful error message from various error types.
   */
  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      if (errorObj.error && typeof errorObj.error === 'object') {
        const nestedError = errorObj.error as Record<string, unknown>;
        if (nestedError.message && typeof nestedError.message === 'string') {
          return nestedError.message;
        }
      }
    }

    return 'An unexpected error occurred';
  }

  /**
   * Convert technical errors to user-friendly messages.
   */
  private getUserFriendlyMessage(error: unknown): string {
    const message = this.extractErrorMessage(error);

    // Network errors
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Network error. Please check your internet connection.';
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'The request took too long. Please try again.';
    }

    // API errors
    if (message.includes('429')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    if (message.includes('500') || message.includes('503')) {
      return 'The service is temporarily unavailable. Please try again later.';
    }

    if (message.includes('401') || message.includes('403')) {
      return 'Authentication failed. Please check your API key.';
    }

    // Default fallback
    return 'An error occurred. Please try again.';
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
  public async wrapAsync<T>(
    operation: () => Promise<T>,
    source: string,
    showToast: boolean = true
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, source, showToast);
      return null;
    }
  }
}
