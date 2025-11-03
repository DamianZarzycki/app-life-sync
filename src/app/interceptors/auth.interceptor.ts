import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
  HttpEventType,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { Router } from '@angular/router';

const REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Functional HTTP Interceptor for authentication
 * - Automatically attaches JWT token to all requests
 * - Handles 401 Unauthorized responses by redirecting to login
 * - Adds request timeout protection
 * - Logs HTTP responses
 */
export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const router = inject(Router);

  // Get JWT token from localStorage or session storage
  const token = getAuthToken();

  // Clone request and add Authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Add timeout and error handling
  return next(authReq).pipe(
    timeout(REQUEST_TIMEOUT),
    tap((event) => {
      // Log responses for debugging
      if (event.type === HttpEventType.Response) {
        console.log(
          `[HTTP] ${req.method} ${req.url} - Status: ${event.status}`
        );
      }
    }),
    catchError((error: HttpErrorResponse) => {
      return handleAuthError(error, router);
    })
  );
}

/**
 * Get JWT token from storage
 */
function getAuthToken(): string | null {
  // Try to get from localStorage first, then sessionStorage
  let token = localStorage.getItem('access_token');
  if (!token) {
    token = sessionStorage.getItem('access_token');
  }
  return token;
}

/**
 * Handle authentication-related HTTP errors
 */
function handleAuthError(
  error: HttpErrorResponse,
  router: Router
): Observable<never> {
  // 401 Unauthorized - Session expired or invalid token
  if (error.status === 401) {
    console.warn('[AUTH] Unauthorized access - Session expired');

    // Clear stored tokens
    clearAuthTokens();

    // Redirect to login with return URL
    router.navigate(['/login'], {
      queryParams: { returnUrl: router.url },
    });

    return throwError(() => new Error('Unauthorized - Session expired'));
  }

  // 403 Forbidden - User lacks permissions
  if (error.status === 403) {
    console.error('[AUTH] Access forbidden');
    return throwError(() => error);
  }

  // Network timeout or connection error
  if (error.status === 0) {
    console.error('[AUTH] Network error or request timeout');
    return throwError(() => new Error('Network connection failed'));
  }

  // Other errors - log and pass through
  console.error(
    `[HTTP ERROR] ${error.status} ${error.statusText}:`,
    error.message
  );
  return throwError(() => error);
}

/**
 * Clear authentication tokens from storage
 */
function clearAuthTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
}
