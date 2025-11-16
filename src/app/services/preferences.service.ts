import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import {
  PreferencesDto,
  UpdatePreferencesCommand,
  ListCategoriesResponseDto,
  ErrorResponseDto,
} from '../../types';

/**
 * PreferencesService
 * Handles all API communication for user preferences management
 * Provides methods to fetch and update user preferences and available categories
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = 'http://localhost:3000/api';

  /**
   * Fetch list of all available categories
   * @returns Observable with paginated category list
   * @throws HttpErrorResponse for 401, 500 errors
   */
  getCategories(): Observable<ListCategoriesResponseDto> {
    return this.http
      .get<ListCategoriesResponseDto>(`${this.API_BASE_URL}/categories`)
      .pipe(
        timeout(5000),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Fetch current user's preferences
   * @returns Observable with user's PreferencesDto
   * @throws HttpErrorResponse for 401, 404, 500 errors
   */
  getPreferences(): Observable<PreferencesDto> {
    return this.http
      .get<PreferencesDto>(`${this.API_BASE_URL}/preferences`)
      .pipe(
        timeout(5000),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Update user's preferences
   * Enforces constraints: max 3 categories, valid day (0-6), valid hour (0-23),
   * at least one delivery channel, max daily notes (1-10)
   *
   * @param command UpdatePreferencesCommand with all required fields
   * @returns Observable with updated PreferencesDto
   * @throws HttpErrorResponse for 400, 401, 404, 422, 500 errors
   */
  updatePreferences(
    command: UpdatePreferencesCommand
  ): Observable<PreferencesDto> {
    return this.http
      .put<PreferencesDto>(`${this.API_BASE_URL}/preferences`, command)
      .pipe(
        timeout(5000),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Handle HTTP errors and convert to proper error response
   * @param error HttpErrorResponse from API
   * @returns Observable that throws the error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Preferences API error:', error);
    return throwError(() => error);
  }
}
