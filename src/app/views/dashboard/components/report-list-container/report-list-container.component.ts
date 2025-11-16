import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  ReportListViewState,
  ReportListFilters,
  ReportDto,
  ListReportsResponseDto,
  ErrorResponseDto,
  UUID,
} from '../../../../../types';
import { ReportListService } from '../../../../services/report-list.service';
import { ReportListComponent } from '../report-list/report-list.component';

/**
 * ReportListContainerComponent
 * Main orchestrator component for the reports list view.
 * Manages state, API calls, filtering, pagination, and error handling.
 */
@Component({
  selector: 'app-report-list-container',
  standalone: true,
  imports: [CommonModule, ReportListComponent],
  templateUrl: './report-list-container.component.html',
  styleUrl: './report-list-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportListContainerComponent implements OnInit, OnDestroy {
  private readonly reportListService = inject(ReportListService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State signals
  viewState = signal<ReportListViewState>({
    reports: [],
    isLoading: false,
    isLoadingMore: false,
    hasMore: true,
    error: null,
    currentOffset: 0,
    totalCount: 0,
    filters: { sort: 'created_at_desc' },
  });

  // Computed signals for template
  displayReports = computed(() => this.viewState().reports);

  isInitialLoading = computed(
    () => this.viewState().isLoading && this.viewState().reports.length === 0
  );

  constructor() {}

  ngOnInit(): void {
    this.loadInitialReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load initial batch of reports
   */
  private loadInitialReports(): void {
    const state = this.viewState();

    this.viewState.update(s => ({
      ...s,
      isLoading: true,
      error: null,
    }));

    this.reportListService
      .getReports({
        limit: 20,
        offset: 0,
        sort: state.filters.sort,
        week_start_local: state.filters.weekStart,
      })
      .pipe(
        takeUntil(this.destroy$),
        tap(response => this.handleReportsResponse(response, false)),
        catchError(error => {
          this.handleError(error);
          return [];
        })
      )
      .subscribe();
  }

  /**
   * Handle filter change from ReportFiltersComponent
   */
  onFiltersChange(filters: ReportListFilters): void {
    this.viewState.update(s => ({
      ...s,
      filters,
      currentOffset: 0,
      reports: [],
      hasMore: true,
    }));

    this.loadInitialReports();
  }

  /**
   * Handle infinite scroll load more
   */
  onLoadMore(): void {
    const state = this.viewState();

    if (state.isLoadingMore || !state.hasMore) {
      return;
    }

    this.viewState.update(s => ({
      ...s,
      isLoadingMore: true,
    }));

    const nextOffset = this.reportListService.calculateNextOffset(
      state.currentOffset,
      20
    );

    this.reportListService
      .getReports({
        limit: 20,
        offset: nextOffset,
        sort: state.filters.sort,
        week_start_local: state.filters.weekStart,
      })
      .pipe(
        takeUntil(this.destroy$),
        tap(response => this.handleReportsResponse(response, true)),
        catchError(error => {
          this.handlePaginationError(error);
          return [];
        })
      )
      .subscribe();
  }

  /**
   * Handle report item click - navigate to detail view
   */
  onReportClick(reportId: UUID): void {
    this.router.navigate(['/reports', reportId]);
  }

  /**
   * Retry last failed action
   */
  retryLastAction(): void {
    const state = this.viewState();

    if (state.error) {
      this.viewState.update(s => ({
        ...s,
        error: null,
      }));

      // If no reports loaded, retry initial load
      if (state.reports.length === 0) {
        this.loadInitialReports();
      }
    }
  }

  /**
   * Dismiss error banner
   */
  dismissError(): void {
    this.viewState.update(s => ({
      ...s,
      error: null,
    }));
  }

  /**
   * Handle successful reports response
   */
  private handleReportsResponse(
    response: ListReportsResponseDto,
    isAppend: boolean
  ): void {
    const transformedReports = response.items.map(item =>
      this.reportListService.transformReportDto(item)
    );

    this.viewState.update(s => {
      const updatedReports = isAppend
        ? [...s.reports, ...transformedReports]
        : transformedReports;

      const nextOffset = isAppend
        ? response.offset + response.limit
        : response.offset;
      const hasMore = nextOffset < response.total;

      return {
        ...s,
        reports: updatedReports,
        totalCount: response.total,
        currentOffset: nextOffset,
        hasMore,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      };
    });
  }

  /**
   * Handle initial load error
   */
  private handleError(error: any): void {
    console.error('ReportListContainerComponent error:', error);

    const errorState = this.mapHttpErrorToErrorState(error);

    this.viewState.update(s => ({
      ...s,
      error: errorState,
      isLoading: false,
      isLoadingMore: false,
    }));
  }

  /**
   * Handle pagination error (only clears isLoadingMore)
   */
  private handlePaginationError(error: any): void {
    console.error('ReportListContainerComponent pagination error:', error);

    this.viewState.update(s => ({
      ...s,
      isLoadingMore: false,
    }));
  }

  /**
   * Map HTTP error to ErrorResponseDto
   */
  private mapHttpErrorToErrorState(error: any): ErrorResponseDto {
    let code = 'SERVER_ERROR';
    let message = 'An unexpected error occurred. Please try again.';

    if (error.status === 0 || error.name === 'TimeoutError') {
      code = 'NETWORK_ERROR';
      message = 'Failed to load reports. Please check your connection.';
    } else if (error.status === 401) {
      code = 'UNAUTHORIZED';
      message = 'Your session has expired. Please log in again.';
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else if (error.status === 400) {
      code = 'VALIDATION_ERROR';
      message = 'Invalid query parameters. Please try again.';
    } else if (error.status >= 500) {
      code = 'SERVER_ERROR';
      message = 'Unable to load reports. Please try again later.';
    }

    return {
      error: {
        code,
        message,
        details: error.error?.error?.details || {},
      },
    };
  }
}
