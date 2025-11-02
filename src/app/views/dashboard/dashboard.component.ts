import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  Observable,
  Subject,
  combineLatest,
  of,
  Subscription,
} from 'rxjs';
import { takeUntil, map, switchMap } from 'rxjs/operators';
import { DashboardService, ErrorState } from '../../services/dashboard.service';
import {
  DashboardDto,
  DashboardQuery,
  UUID,
} from '../../../types';
import {
  CategoryCardViewModel,
  StreakData,
  getCategoryColorMapping,
  isValidUUID,
  DashboardLoadingState,
} from '../../models/dashboard.models';

/**
 * Main Dashboard Component
 * Orchestrates data fetching, state management, and layout composition
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // Observable streams from service
  dashboardData$: Observable<DashboardDto | null>;
  loading$: Observable<boolean>;
  error$: Observable<ErrorState | null> | null = null;
  lastRefreshTime$: Observable<Date | null>;

  // Combined observables for template
  loadingState$: Observable<DashboardLoadingState>;

  // Component state
  userTimezone: string = this.getUserTimezone();
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    // Initialize observables from service
    this.dashboardData$ = this.dashboardService.getDashboardData$();
    this.loading$ = this.dashboardService.getLoading$();
    this.error$ = this.dashboardService.getError$();
    this.lastRefreshTime$ = this.dashboardService.getLastRefreshTime$();

    // Create combined loading state
    this.loadingState$ = this.loading$.pipe(
      map((isLoading) =>
        isLoading
          ? DashboardLoadingState.LOADING
          : DashboardLoadingState.SUCCESS
      )
    );
  }

  ngOnInit(): void {
    // Initial data load
    this.loadDashboard();

    // Listen for cache invalidation events
    this.setupCacheInvalidationListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dashboard data from API
   */
  private loadDashboard(query?: DashboardQuery): void {
    const defaultQuery: DashboardQuery = {
      timezone: this.userTimezone,
      ...query,
    };

    this.dashboardService.fetchDashboard(defaultQuery).subscribe({
      next: (data) => {
        console.log('Dashboard data loaded successfully', data);
        this.retryCount = 0;
      },
      error: (error: ErrorState) => {
        console.error('Dashboard load error:', error);
        this.handleError(error);
      },
    });
  }

  /**
   * Retry loading dashboard data
   */
  retry(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.loadDashboard();
    } else {
      console.error('Max retries exceeded');
    }
  }

  /**
   * Handle errors from dashboard service
   */
  private handleError(error: ErrorState): void {
    switch (error.type) {
      case 'unauthorized':
        // 401 - Session expired, redirect to login
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/dashboard' },
        });
        break;
      case 'validation':
        // 400 - Invalid parameters, show to user
        console.warn('Validation error:', error.details);
        break;
      case 'network':
        // Network error, user can retry
        console.warn('Network error:', error.message);
        break;
      case 'server':
        // 5xx - Server error, user can retry
        console.error('Server error:', error.message);
        break;
      default:
        console.error('Unknown error:', error);
    }
  }

  /**
   * Set up listeners for cache invalidation events from other services
   */
  private setupCacheInvalidationListeners(): void {
    // TODO: When NotesService and ReportsService are implemented,
    // subscribe to their cache invalidation events here
    // Example:
    // this.notesService.noteCreated$.pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(() => {
    //   this.dashboardService.invalidateCache();
    //   this.loadDashboard();
    // });
  }

  /**
   * Get user's timezone from browser or profile
   */
  private getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }

  /**
   * Navigate to category notes view
   */
  onCategoryClick(categoryId: UUID): void {
    if (!isValidUUID(categoryId)) {
      console.error('Invalid category ID:', categoryId);
      return;
    }
    this.router.navigate(['/categories', categoryId, 'notes']);
  }

  /**
   * Navigate to report detail view
   */
  onReportClick(reportId: UUID): void {
    if (!isValidUUID(reportId)) {
      console.error('Invalid report ID:', reportId);
      return;
    }
    this.router.navigate(['/reports', reportId]);
  }

  /**
   * Navigate to report generation
   */
  onGenerateReportClick(): void {
    this.router.navigate(['/reports', 'generate']);
  }

  /**
   * Handle scroll event for infinite scroll
   */
  onLoadMoreReports(): void {
    // TODO: Implement pagination logic when ReportHistoryComponent is created
    console.log('Load more reports');
  }

  /**
   * Handle filter change for report history
   */
  onFilterChange(filter: string): void {
    // TODO: Implement filter logic when ReportHistoryComponent is created
    console.log('Filter changed:', filter);
  }

  /**
   * Dismiss error alert
   */
  dismissError(): void {
    this.dashboardService.clearError();
  }
}
