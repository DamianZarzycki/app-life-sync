import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { AuthService } from '../../services/auth.service';
import { LoginError, LoginFormValue, SignInRequest, SignInResponseDto } from '../../../types';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginFormComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  isLoading: boolean = false;
  error: LoginError | null = null;
  formValue: LoginFormValue = { email: '', password: '' };
  returnUrl: string = '/dashboard';

  ngOnInit(): void {
    console.log('LoginComponent ngOnInit');
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Extract return URL from query params
    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(request: SignInRequest): void {
    // Prevent multiple submissions
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = null;
    this.formValue = request;

    this.authService
      .signIn(request)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isLoading = false;
          this.error = this.mapApiErrorToLoginError(error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => {
          this.handleSignInSuccess(response);
        },
        error: () => {
          // Error already handled in catchError
        },
      });
  }

  onErrorDismiss(): void {
    this.error = null;
  }

  onResendVerification(email: string): void {
    // TODO: Implement resend verification email
    console.log('Resend verification email to:', email);
  }

  private handleSignInSuccess(response: SignInResponseDto): void {
    this.isLoading = false;
    this.error = null;

    // Check if email is verified
    if (!response.user.email_confirmed_at) {
      this.error = {
        code: 'UNVERIFIED_EMAIL',
        message: 'Please verify your email address to continue.',
      };
      return;
    }

    // Redirect to dashboard or return URL
    this.router.navigate([this.returnUrl]);
  }

  private mapApiErrorToLoginError(error: HttpErrorResponse): LoginError {
    // Network error
    if (error.status === 0) {
      return {
        code: 'NETWORK_ERROR',
        message:
          'Network connection error. Please check your internet connection.',
      };
    }

    // Validation error (400)
    if (error.status === 400) {
      const apiError = error.error?.error;
      return {
        code: 'VALIDATION_ERROR',
        message: apiError?.message || 'Invalid input',
        details: apiError?.details,
      };
    }

    // Unauthorized (401)
    if (error.status === 401) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };
    }

    // Rate limited (429)
    if (error.status === 429) {
      const retryAfter = error.error?.error?.details?.retryAfter || 900;
      return {
        code: 'RATE_LIMITED',
        message: `Too many login attempts. Please try again in ${Math.ceil(
          retryAfter / 60
        )} minutes.`,
        details: { retryAfter },
      };
    }

    // Server error (5xx)
    if (error.status >= 500) {
      console.error('Server error during login:', error);
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      };
    }

    // Unknown error
    return {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
