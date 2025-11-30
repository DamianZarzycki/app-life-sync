import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse,
  HttpEventType,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * HTTP Interceptor for displaying status notifications
 * - Displays success notifications for 2xx responses
 * - Displays warning notifications for 4xx client errors
 * - Displays error notifications for 5xx server errors
 * - Auto-dismisses or keeps based on status type
 */
export function notificationInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const notificationService = inject(NotificationService);
  const method = req.method; // Capture method from request

  return next(req).pipe(
    tap(event => {
      // Handle successful responses (2xx)
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        handleSuccessResponse(event, notificationService, method);
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle error responses (4xx and 5xx)
      handleErrorResponse(error, notificationService, method);
      return throwError(() => error);
    })
  );
}

/**
 * Handle 2xx successful responses
 */
function handleSuccessResponse(
  response: HttpResponse<any>,
  notificationService: NotificationService,
  method: string
): void {
  // Skip certain endpoints that don't need notifications
  if (shouldSkipSuccessNotification(response.url ?? '')) {
    return;
  }

  const statusCode = response.status;

  // Only show notifications for mutations (POST, PUT, DELETE, PATCH)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    notificationService.success(
      'Success',
      '',
      4000
    );
  }
}

/**
 * Handle 4xx and 5xx error responses
 */
function handleErrorResponse(
  error: HttpErrorResponse,
  notificationService: NotificationService,
  method: string
): void {
  const statusCode = error.status;
  const url = error.url || 'Unknown endpoint';

  let title = '';
  let message = '';
  let details: Record<string, any> | undefined;

  if (statusCode >= 400 && statusCode < 500) {
    // 4xx Client Errors
    message = getClientErrorMessage(statusCode);
    notificationService.warning(message, '', 7000);
  } else if (statusCode >= 500 && statusCode < 600) {
    // 5xx Server Errors
    message = getServerErrorMessage(statusCode);
    notificationService.error(message, '', undefined, 7000);
  } else if (statusCode === 0) {
    // Network error or timeout
    notificationService.error('Connection Failed', '', undefined, 7000);
  } else {
    // Unknown error
    notificationService.error('Error', '', undefined, 7000);
  }
}

/**
 * Get human-readable message for 4xx errors
 */
function getClientErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    429: 'Rate Limited',
    422: 'Invalid Data',
  };

  return messages[status] || `Error ${status}`;
}

/**
 * Get human-readable message for 5xx errors
 */
function getServerErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    500: 'Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Timeout',
    505: 'HTTP Not Supported',
  };

  return messages[status] || `Server Error ${status}`;
}

/**
 * Check if we should skip showing a success notification for this endpoint
 */
function shouldSkipSuccessNotification(url: string): boolean {
  // Skip notifications for sign-up and sign-in endpoints
  const skipPatterns = [
    /\/api\/auth\/sign-up/i,
    /\/api\/auth\/sign-in/i,
  ];

  return skipPatterns.some(pattern => pattern.test(url));
}

