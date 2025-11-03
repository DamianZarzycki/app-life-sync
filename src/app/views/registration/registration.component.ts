import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';
import { SuccessMessageComponent } from './components/success-message/success-message.component';
import { LoginError, SignInUserDto, SignUpRequest, SignInResponseDto } from '../../../types';

/**
 * RegistrationComponent
 *
 * Main container component that orchestrates the user registration flow.
 * Responsibilities:
 * - Manage registration state (loading, error, success)
 * - Integrate with AuthService for API calls
 * - Handle all error scenarios with proper mapping
 * - Display appropriate UI based on current state
 * - Navigate on success
 *
 * This is a smart/container component that manages complex state and API logic.
 */
@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    RegistrationFormComponent,
    SuccessMessageComponent,
  ],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State signals using modern Angular 19 patterns
  isLoading = signal(false);
  error = signal<LoginError | null>(null);
  isSuccess = signal(false);
  registeredEmail = signal<string | null>(null);
  user = signal<SignInUserDto | null>(null);

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('RegistrationComponent initialized');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle form submission from RegistrationFormComponent
   * @param request - SignUpRequest with email and password
   */
  onSubmit(request: SignUpRequest): void {
    // Prevent multiple simultaneous submissions
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    console.log('Submitting registration for:', request.email);

    this.authService
      .signUp(request)
      .pipe(
        timeout(10000), // 10 second timeout
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isLoading.set(false);
          this.error.set(this.mapApiErrorToRegistrationError(error));
          console.error('Sign-up error:', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => this.handleRegistrationSuccess(response),
        error: () => {
          // Error already handled in catchError
        },
      });
  }

  /**
   * Handle successful registration
   * @param response - SignInResponseDto with user and session
   */
  private handleRegistrationSuccess(response: SignInResponseDto): void {
    this.isLoading.set(false);
    this.user.set(response.user);
    this.registeredEmail.set(response.user.email);
    this.isSuccess.set(true);
    this.error.set(null);

    console.log('Registration successful for:', response.user.email);
  }

  /**
   * Map HTTP error responses to user-friendly LoginError messages
   * Handles all possible error scenarios from the sign-up API
   * @param error - HttpErrorResponse from API
   * @returns LoginError with appropriate code and message
   */
  private mapApiErrorToRegistrationError(error: HttpErrorResponse): LoginError {
    // Network error (status 0) - no connection
    if (error.status === 0) {
      return {
        code: 'NETWORK_ERROR',
        message:
          'Network connection error. Please check your internet connection.',
      };
    }

    // Validation error (400) - invalid input format
    if (error.status === 400) {
      const apiError = error.error?.error;
      return {
        code: 'VALIDATION_ERROR',
        message: apiError?.message || 'Invalid input. Please check your entries.',
        details: apiError?.details,
      };
    }

    // Email already registered (409) - account exists
    if (error.status === 409) {
      return {
        code: 'EMAIL_EXISTS',
        message:
          'This email address is already registered. Please sign in instead.',
        details: { field: 'email', action: 'sign-in' },
      };
    }

    // Weak password (422) - password doesn't meet strength requirements
    if (error.status === 422) {
      return {
        code: 'WEAK_PASSWORD',
        message:
          'Password does not meet strength requirements. Please choose a stronger password.',
        details: { field: 'password' },
      };
    }

    // Rate limited (429) - too many attempts
    if (error.status === 429) {
      const retryAfter = error.error?.error?.details?.retryAfter || 900;
      return {
        code: 'RATE_LIMITED',
        message: `Too many registration attempts. Please try again in ${Math.ceil(
          retryAfter / 60
        )} minutes.`,
        details: { retryAfter },
      };
    }

    // Server error (5xx)
    if (error.status >= 500) {
      console.error('Server error during registration:', error);
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      };
    }

    // Unknown/unhandled error
    return {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }

  /**
   * Dismiss the error message
   */
  onErrorDismiss(): void {
    this.error.set(null);
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to dashboard after successful registration and email verification
   */
  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
