import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GenerateReportCommand, ReportDto } from '../../types';

/**
 * ReportGenerationService
 * Handles API communication for report generation operations
 * Provides methods to generate reports on-demand
 */
@Injectable({
  providedIn: 'root',
})
export class ReportGenerationService {
  private httpClient = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/reports/generate-auto';

  /**
   * Generate a new report on-demand
   * @param command GenerateReportCommand with include_categories array
   * @returns Observable<ReportDto> - Generated report with full details
   */
  generateAutoReport(): Observable<ReportDto> {
    return this.httpClient.post<ReportDto>(this.apiUrl, {});
  }
}
