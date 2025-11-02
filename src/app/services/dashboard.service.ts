import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import {
  catchError,
  tap,
  timeout,
  retry,
  map,
} from 'rxjs/operators';
import {
  DashboardDto,
  DashboardQuery,
  UUID,
} from '../../types';

export interface ErrorState {
  code: string;
  message: string;
  details?: Record<string, string>;
  type: 'unauthorized' | 'validation' | 'server' | 'network';
  recoverable: boolean;
  timestamp: Date;
}

export interface DashboardViewModel {
  summary: DashboardDto['summary'];
  recent_reports: DashboardDto['recent_reports'];
  isLoading: boolean;
  error: ErrorState | null;
  lastRefreshTime: Date;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api';
  private readonly cacheExpiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Observable streams
  private dashboardData$ = new BehaviorSubject<DashboardDto | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<ErrorState | null>(null);
  private lastRefreshTime$ = new BehaviorSubject<Date | null>(null);

  constructor() {}

  /**
   * Get dashboard data observable
   */
  getDashboardData$(): Observable<DashboardDto | null> {
    return this.dashboardData$.asObservable();
  }

  /**
   * Get loading state observable
   */
  getLoading$(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  /**
   * Get error state observable
   */
  getError$(): Observable<ErrorState | null> {
    return this.error$.asObservable();
  }

  /**
   * Get last refresh time observable
   */
  getLastRefreshTime$(): Observable<Date | null> {
    return this.lastRefreshTime$.asObservable();
  }

  /**
   * Fetch dashboard data from API with optional query parameters
   */
  fetchDashboard(query?: DashboardQuery): Observable<DashboardDto> {
    this.loading$.next(true);
    this.error$.next(null);

    let url = `${this.apiBaseUrl}/dashboard`;
    let params = new HttpParams();

    // if (query?.timezone) {
    //   params = params.set('timezone', query.timezone);
    // }
    if (query?.since) {
      params = params.set('since', query.since);
    }  
    console.log('fetchDashboard', url, params);

    return this.http.get<DashboardDto>(url, { params }).pipe(
      timeout(5000), // 5-second timeout
      retry({
        count: 2,
        delay: (error: any, retryCount: number) => {
          if (this.isRetryableError(error)) {
            const delayMs = Math.pow(2, retryCount - 1) * 1000;
            console.log(
              `Retrying dashboard request, attempt ${retryCount}, delay ${delayMs}ms`
            );
            return timer(delayMs);
          }
          throw error;
        },
      }),
      tap((data) => {
        console.log('fetchDashboard success', data);
        this.dashboardData$.next(data);
        this.lastRefreshTime$.next(new Date());
        this.error$.next(null);
        this.loading$.next(false);
      }),
      catchError((error: any) => {
        const errorState = this.handleError(error);
        this.error$.next(errorState);
        this.loading$.next(false);
        throw errorState;
      })
    );
  }

  /**
   * Refresh dashboard data if cache is stale
   */
  refreshDashboardIfNeeded(query?: DashboardQuery): void {
    if (!this.isCacheValid()) {
      this.fetchDashboard(query).subscribe({
        error: (error) => {
          console.error('Dashboard refresh failed:', error);
        },
      });
    }
  }

  /**
   * Invalidate dashboard cache
   */
  invalidateCache(): void {
    this.lastRefreshTime$.next(null);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error$.next(null);
  }

  /**
   * Check if current cache is still valid (< 5 minutes old)
   */
  private isCacheValid(): boolean {
    const lastRefresh = this.lastRefreshTime$.value;
    if (!lastRefresh) return false;

    const now = new Date();
    const ageMs = now.getTime() - lastRefresh.getTime();
    return ageMs < this.cacheExpiryTime;
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    return (
      error.status === 0 ||
      error.name === 'TimeoutError' ||
      error.status >= 500
    );
  }

  /**
   * Handle HTTP errors and convert to ErrorState
   */
  private handleError(error: any): ErrorState {
    console.error('Dashboard service error:', error);

    // Network/timeout errors
    if (error.status === 0 || error.name === 'TimeoutError') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection lost. Please check your connection.',
        type: 'network',
        recoverable: true,
        timestamp: new Date(),
      };
    }

    // 401 Unauthorized
    if (error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please log in again.',
        type: 'unauthorized',
        recoverable: false,
        timestamp: new Date(),
      };
    }

    // 400 Bad Request / Validation Error
    if (error.status === 400) {
      const details = error.error?.error?.details || {};
      return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters. Please try again.',
        details: details,
        type: 'validation',
        recoverable: true,
        timestamp: new Date(),
      };
    }

    // 5xx Server errors
    if (error.status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        type: 'server',
        recoverable: true,
        timestamp: new Date(),
      };
    }

    // Unknown/other errors
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      type: 'server',
      recoverable: true,
      timestamp: new Date(),
    };
  }
}
