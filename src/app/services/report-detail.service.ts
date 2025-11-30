import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  UUID,
  ReportDetailViewData,
  ReportFeedbackFormValue,
  ReportDetailModalState,
  ErrorResponseDto,
  ReportDto,
} from '../../types';


/**
 * ReportDetailService
 * Manages the state and API interactions for the Report Detail modal view.
 * Uses Angular signals for reactive state management and computed properties.
 */
@Injectable({ providedIn: 'root' })
export class ReportDetailService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // State signals
  readonly isOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isFeedbackSubmitting = signal<boolean>(false);

  readonly reportId = signal<UUID | null>(null);
  readonly report = signal<ReportDetailViewData | null>(null);
  readonly showFeedback = signal<boolean>(false);

  readonly feedbackFormValue = signal<ReportFeedbackFormValue>({
    rating: null as any,
    comment: '',
  });

  readonly error = signal<ErrorResponseDto | null>(null);
  readonly feedbackError = signal<string | null>(null);

  /**
   * Computed state combining all signals into a single ReportDetailModalState object
   * Updates automatically when any dependent signal changes
   */
  readonly state = computed((): ReportDetailModalState => ({
    isOpen: this.isOpen(),
    isLoading: this.isLoading(),
    isFeedbackSubmitting: this.isFeedbackSubmitting(),
    reportId: this.reportId(),
    report: this.report(),
    showFeedback: this.showFeedback(),
    feedbackFormValue: this.feedbackFormValue(),
    error: this.error(),
    feedbackError: this.feedbackError(),
  }));

  /**
   * Opens the report detail modal and initiates data fetching
   * @param reportId - The UUID of the report to display
   */
  public openModal(reportId: UUID): void {
    this.reportId.set(reportId);
    this.isOpen.set(true);
    this.isLoading.set(true);
    this.error.set(null);
    this.fetchReport(reportId);
  }

  /**
   * Closes the modal and resets all state to initial values
   */
  public closeModal(): void {
    this.isOpen.set(false);
    this.reportId.set(null);
    this.report.set(null);
    this.showFeedback.set(false);
    this.feedbackFormValue.set({ rating: null as any, comment: '' });
    this.error.set(null);
    this.feedbackError.set(null);
    this.isLoading.set(false);
  }

  /**
   * Updates feedback form value for comment field
   * @param comment - The feedback comment text
   */
  public updateFeedbackComment(comment: string): void {
    const currentForm = this.feedbackFormValue();
    this.feedbackFormValue.set({ ...currentForm, comment });
  }

  /**
   * Updates feedback form value for rating field
   * @param rating - The selected rating (0-2)
   */
  public updateFeedbackRating(rating: number): void {
    const currentForm = this.feedbackFormValue();
    this.feedbackFormValue.set({ ...currentForm, rating });
  }

  /**
   * Submits feedback for the current report
   * @param reportId - The UUID of the report
   * @param feedback - The feedback form values
   */
  public submitFeedback(reportId: UUID, feedback: ReportFeedbackFormValue): void {
    this.isFeedbackSubmitting.set(true);
    this.feedbackError.set(null);

    this.http.post(`/api/reports/${reportId}/feedback`, feedback).subscribe({
      next: () => {
        this.isFeedbackSubmitting.set(false);
        this.showFeedback.set(false);
        // Close modal after brief delay to show success feedback
        setTimeout(() => this.closeModal(), 1000);
      },
      error: (err) => {
        const errorMsg =
          err.error?.error?.message || 'Failed to submit feedback';
        this.feedbackError.set(errorMsg);
        this.isFeedbackSubmitting.set(false);
      },
    });
  }

  /**
   * Retries fetching the report (for error recovery)
   * @param reportId - The UUID of the report to fetch
   */
  public retryFetchReport(reportId: UUID): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.fetchReport(reportId);
  }

  /**
   * Fetches a single report from the API
   * @private
   * @param reportId - The UUID of the report to fetch
   */
  private fetchReport(reportId: UUID): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<ReportDto>(`http://localhost:3000/api/reports/${reportId}`).subscribe({
      next: (dto) => {
        try {
          const viewData = this.mapToViewModel(dto);
          console.log(viewData)
          this.report.set(viewData);
          this.showFeedback.set(viewData.isFirstReport);
          this.isLoading.set(false);
        } catch (err) {
          const errorResponse = this.handleError(
            new Error('Failed to process report data')
          );
          this.error.set(errorResponse);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        const errorResponse = this.handleError(err);
        this.error.set(errorResponse);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Maps API ReportDto to ReportDetailViewData with formatted fields
   * @private
   * @param dto - The report data from API
   * @returns ReportDetailViewData with computed/formatted properties
   */
  private mapToViewModel(dto: ReportDto): ReportDetailViewData {
    // The API returns 'html' field, but we map it to 'content' for template compatibility
    const htmlContent = dto.html || '';
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('Report content is empty');
    }

    return {
      ...dto,
      content: htmlContent, // Map 'html' to 'content' for display in iframe
      createdAtFormatted: this.formatDate(dto.created_at),
      generatedByLabel:
        dto.generated_by === 'scheduled' ? 'Scheduled' : 'On-Demand',
      isFirstReport: (dto as any).is_first_report ?? false,
      categoriesSnapshot: (dto as any).categories_snapshot || [],
    };
  }

  /**
   * Formats an ISO date string to readable format
   * Example: "2025-01-06T14:30:00Z" → "Jan 6, 2025 at 2:00 AM"
   * @private
   * @param dateString - ISO datetime string
   * @returns Formatted date string
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Centralized error handler for all API calls
   * Maps HTTP status codes to user-friendly messages and error codes
   * @private
   * @param error - The error object from HttpClient or custom error
   * @returns ErrorResponseDto
   */
  private handleError(error: any): ErrorResponseDto {
    console.error('[ReportDetailService] Error:', error);

    if (error instanceof HttpErrorResponse) {
      const status = error.status;
      const message = error.error?.error?.message || error.message;

      const errorMap: Record<number, string> = {
        401: 'Session expired. Please log in.',
        403: 'Access denied.',
        404: 'Report not found or has been deleted.',
        500: 'Server error. Please try again later.',
        0: 'Connection failed. Please check your internet.',
      };

      // Handle 401 by redirecting to login
      if (status === 401) {
        this.router.navigate(['/login']);
      }

      // Auto-close modal for 404/403 after delay
      if (status === 404 || status === 403) {
        setTimeout(() => this.closeModal(), 3000);
      }

      return {
        error: {
          code: this.mapStatusToCode(status),
          message: errorMap[status] || message || 'Unknown error',
        },
      };
    }

    // Handle custom errors (e.g., from mapToViewModel)
    if (error instanceof Error) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      };
    }

    return {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
      },
    };
  }

  /**
   * Maps HTTP status codes to error codes
   * @private
   * @param status - HTTP status code
   * @returns Error code string
   */
  private mapStatusToCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      500: 'SERVER_ERROR',
      0: 'NETWORK_ERROR',
    };

    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}

