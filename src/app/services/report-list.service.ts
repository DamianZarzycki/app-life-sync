import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, timeout, catchError, map } from 'rxjs/operators';
import {
  ReportDto,
  ListReportsQuery,
  ListReportsResponseDto,
  ReportListItemViewModel,
  ReportListItemDisplayData,
  WeekOption,
  UUID,
  ErrorResponseDto,
} from '../../types';

/**
 * ReportListService
 * Handles API communication for report listing, data transformations,
 * and business logic for pagination and date formatting.
 */
@Injectable({
  providedIn: 'root',
})
export class ReportListService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'http://localhost:3000/api';
  private readonly defaultLimit = 20;
  private readonly timezone = this.getUserTimezone();

  constructor() {}

  /**
   * Fetch reports from API with given query parameters
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns Observable of paginated reports response
   */
  getReports(query: ListReportsQuery): Observable<ListReportsResponseDto> {
    let params = new HttpParams();

    if (query.week_start_local) {
      params = params.set('week_start_local', query.week_start_local);
    }
    if (query.generated_by) {
      params = params.set('generated_by', query.generated_by);
    }
    if (query.include_deleted !== undefined) {
      params = params.set('include_deleted', query.include_deleted.toString());
    }
    if (query.limit !== undefined) {
      params = params.set('limit', query.limit.toString());
    } else {
      params = params.set('limit', this.defaultLimit.toString());
    }
    if (query.offset !== undefined) {
      params = params.set('offset', query.offset.toString());
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }

    return this.http
      .get<ListReportsResponseDto>(`${this.apiBaseUrl}/reports`, { params })
      .pipe(
        timeout(10000), // 10-second timeout
        retry({
          count: 2,
          delay: (error: any, retryCount: number) => {
            if (this.isRetryableError(error)) {
              const delayMs = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s
              console.log(
                `Retrying reports request, attempt ${retryCount}, delay ${delayMs}ms`
              );
              return timer(delayMs);
            }
            throw error;
          },
        }),
        catchError((error: any) => {
          console.error('ReportListService.getReports() error:', error);
          throw error;
        })
      );
  }

  /**
   * Transform ReportDto from API to ReportListItemViewModel for display
   * @param report - Raw report data from API
   * @returns Transformed report view model
   */
  transformReportDto(report: ReportDto): ReportListItemViewModel {
    // Handle categories_snapshot - it's stored as JSONB in DB
    const categoriesSnapshot = this.parseCategoriesSnapshot(
      report.categories_snapshot
    );

    return {
      id: report.id,
      generatedBy: report.generated_by,
      createdAt: new Date(report.created_at),
      deliveryChannel: 'in_app', // Default; would be enhanced with delivery data
      deliveryStatus: 'sent', // Default; would be enhanced with delivery data
      categoriesSnapshot,
    };
  }

  /**
   * Parse categories_snapshot from JSONB field
   * @param snapshot - Raw categories_snapshot field from ReportDto
   * @returns Parsed array of category objects
   */
  private parseCategoriesSnapshot(snapshot: any): { id: UUID; name: string }[] {
    try {
      // If it's already an array, return it
      if (Array.isArray(snapshot)) {
        return snapshot;
      }
      // If it's a string (shouldn't happen), try parsing it
      if (typeof snapshot === 'string') {
        const parsed = JSON.parse(snapshot);
        return Array.isArray(parsed) ? parsed : [];
      }
      // Otherwise return empty array
      return [];
    } catch (error) {
      console.warn('Error parsing categoriesSnapshot:', error);
      return [];
    }
  }

  /**
   * Transform ReportListItemViewModel to display data with formatted strings
   * @param item - Report view model
   * @returns Display data with formatted fields
   */
  transformToDisplayData(
    item: ReportListItemViewModel
  ): ReportListItemDisplayData {
    return {
      ...item,
      createdAtFormatted: this.formatDate(item.createdAt),
      generatedByLabel: this.getGeneratedByLabel(item.generatedBy),
      deliveryChannelLabel: this.getDeliveryChannelLabel(item.deliveryChannel),
      deliveryChannelIcon: this.getDeliveryChannelIcon(item.deliveryChannel),
      deliveryStatusLabel: this.getDeliveryStatusLabel(item.deliveryStatus),
      deliveryStatusColor: this.getDeliveryStatusColor(item.deliveryStatus),
    };
  }

  /**
   * Calculate if more reports are available to load
   * @param currentOffset - Current pagination offset
   * @param limit - Pagination limit (items per page)
   * @param total - Total reports available
   * @returns True if more reports available
   */
  hasMoreReports(currentOffset: number, limit: number, total: number): boolean {
    return currentOffset + limit < total;
  }

  /**
   * Calculate next pagination offset
   * @param currentOffset - Current pagination offset
   * @param limit - Pagination limit (items per page)
   * @returns Next offset value
   */
  calculateNextOffset(currentOffset: number, limit: number): number {
    return currentOffset + limit;
  }

  /**
   * Generate week options for filtering (current week + 4 previous weeks)
   * @returns Array of week options with labels and ISO date values
   */
  generateWeekOptions(): WeekOption[] {
    const options: WeekOption[] = [];
    const today = new Date();

    // Current week (week of today)
    const currentWeekStart = this.getWeekStart(today);
    options.push({
      label: `Week of ${this.formatDateForLabel(currentWeekStart)}`,
      value: this.dateToISOString(currentWeekStart),
    });

    // Previous 4 weeks
    for (let i = 1; i <= 4; i++) {
      const weekDate = new Date(today);
      weekDate.setDate(weekDate.getDate() - i * 7);
      const weekStart = this.getWeekStart(weekDate);
      options.push({
        label: `Week of ${this.formatDateForLabel(weekStart)}`,
        value: this.dateToISOString(weekStart),
      });
    }

    return options;
  }

  /**
   * Format date to display string (e.g., "Jan 06, 2025 at 2:00 AM")
   * @param date - Date to format
   * @param timezone - Optional timezone (defaults to user's timezone)
   * @returns Formatted date string
   */
  formatDate(date: Date, timezone?: string): string {
    try {
      const tz = timezone || this.timezone;
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      return formatter.format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toISOString();
    }
  }

  /**
   * Determine if an error is retryable (transient)
   * @param error - HTTP error object
   * @returns True if error should trigger a retry
   */
  private isRetryableError(error: any): boolean {
    return (
      error.status === 0 ||
      error.name === 'TimeoutError' ||
      (error.status && error.status >= 500)
    );
  }

  /**
   * Get user's timezone from browser
   * @returns Timezone string (e.g., "America/New_York")
   */
  private getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }

  /**
   * Get week start date (Monday) for a given date
   * @param date - Date to find week start for
   * @returns Date object for the Monday of that week
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Format date for label display (e.g., "Jan 6, 2025")
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDateForLabel(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return formatter.format(date);
  }

  /**
   * Convert date to ISO string (YYYY-MM-DD)
   * @param date - Date to convert
   * @returns ISO date string
   */
  private dateToISOString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get display label for generated_by enum
   */
  private getGeneratedByLabel(generatedBy: string): string {
    return generatedBy === 'scheduled' ? 'Scheduled' : 'On-Demand';
  }

  /**
   * Get display label for delivery channel
   */
  private getDeliveryChannelLabel(channel: string): string {
    return channel === 'email' ? 'Email' : 'In-App';
  }

  /**
   * Get icon for delivery channel
   */
  private getDeliveryChannelIcon(channel: string): string {
    return channel === 'email' ? 'mail' : 'inbox';
  }

  /**
   * Get display label for delivery status
   */
  private getDeliveryStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      queued: 'Queued',
      sent: 'Sent',
      opened: 'Opened',
    };
    return statusMap[status] || status;
  }

  /**
   * Get color for delivery status badge
   */
  private getDeliveryStatusColor(
    status: string
  ): 'default' | 'success' | 'warning' | 'error' {
    const colorMap: Record<
      string,
      'default' | 'success' | 'warning' | 'error'
    > = {
      queued: 'default',
      sent: 'success',
      opened: 'warning',
    };
    return colorMap[status] || 'default';
  }
}
