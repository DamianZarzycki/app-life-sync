import { Injectable } from '@angular/core';
import { ErrorResponseDto, AddNoteError } from '../../types';

/**
 * AddNoteErrorMapperService
 * Maps backend error responses to user-friendly AddNoteError objects
 */
@Injectable({
  providedIn: 'root',
})
export class AddNoteErrorMapperService {
  /**
   * Map backend error response to user-friendly AddNoteError
   * @param error Backend error response
   * @returns Mapped AddNoteError with user-friendly message
   */
  mapError(error: unknown): AddNoteError {
    // Handle network errors or errors without response
    if (!error || typeof error !== 'object' || !('error' in error)) {
      return {
        code: 'NETWORK_ERROR',
        message:
          'Network connection failed. Please check your connection and try again.',
        status: 0,
      };
    }

    const typedError = error as { error?: ErrorResponseDto };
    const backendError = typedError.error as ErrorResponseDto;
    const errorCode = backendError.error?.code || 'UNKNOWN_ERROR';

    switch (errorCode) {
      case 'VALIDATION_ERROR':
        return {
          code: 'VALIDATION_ERROR',
          message: this.getValidationMessage(backendError.error?.details),
          status: this.getStatusCode(typedError, 422),
          details: backendError.error?.details,
        };

      case 'CATEGORY_NOT_ACTIVE':
        return {
          code: 'CATEGORY_NOT_ACTIVE',
          message:
            'This category is no longer available. Please refresh the page.',
          status: this.getStatusCode(typedError, 403),
        };

      case 'DAILY_LIMIT_REACHED':
        return {
          code: 'DAILY_LIMIT_REACHED',
          message:
            "You've reached your daily limit for this category. Try again tomorrow.",
          status: this.getStatusCode(typedError, 409),
          details: backendError.error?.details,
        };

      case 'UNAUTHORIZED':
        return {
          code: 'UNAUTHORIZED',
          message: 'Please log in again.',
          status: this.getStatusCode(typedError, 401),
        };

      case 'SERVER_ERROR':
      case 'INTERNAL_SERVER_ERROR':
        return {
          code: 'SERVER_ERROR',
          message: 'Something went wrong. Please try again later.',
          status: this.getStatusCode(typedError, 500),
        };

      case 'BAD_REQUEST':
        return {
          code: 'BAD_REQUEST',
          message: 'Invalid request format.',
          status: this.getStatusCode(typedError, 400),
        };

      default:
        return {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred. Please try again.',
          status: this.getStatusCode(typedError, 500),
        };
    }
  }

  /**
   * Get HTTP status code from error object
   * @param error Typed error object
   * @param defaultStatus Default status if not found
   * @returns HTTP status code
   */
  private getStatusCode(
    error: { error?: ErrorResponseDto; status?: number },
    defaultStatus: number
  ): number {
    return typeof error === 'object' &&
      'status' in error &&
      typeof error.status === 'number'
      ? error.status
      : defaultStatus;
  }

  /**
   * Get validation-specific error message
   * @param details Error details from backend
   * @returns User-friendly validation error message
   */
  private getValidationMessage(
    details: Record<string, unknown> | undefined
  ): string {
    if (!details) {
      return 'Invalid input. Please check your entries.';
    }

    if (details['content']) {
      const contentError = details['content'];
      if (typeof contentError === 'string') {
        if (contentError.includes('exceed')) {
          return 'Content must not exceed 1000 characters.';
        }
        if (contentError.includes('required')) {
          return 'Content is required.';
        }
      }
      return `Content: ${contentError}`;
    }

    if (details['title']) {
      const titleError = details['title'];
      if (typeof titleError === 'string') {
        if (titleError.includes('exceed')) {
          return 'Title must not exceed 255 characters.';
        }
      }
      return `Title: ${titleError}`;
    }

    if (details['category_id']) {
      return 'The specified category does not exist.';
    }

    return 'Invalid input. Please check your entries.';
  }
}
