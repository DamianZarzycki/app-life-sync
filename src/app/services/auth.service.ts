import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SignInRequest, SignInResponseDto, SignUpRequest } from '../../types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = 'http://localhost:3000/api';

  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_ID: 'user_id',
    USER_EMAIL: 'user_email',
  };

  // Signal-based state for authentication
  private readonly accessTokenSignal = signal<string | null>(this.getStoredAccessToken());
  private readonly refreshTokenSignal = signal<string | null>(this.getStoredRefreshToken());
  private readonly userIdSignal = signal<string | null>(this.getStoredUserId());
  private readonly userEmailSignal = signal<string | null>(this.getStoredUserEmail());

  // Public signal accessors
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly userId = this.userIdSignal.asReadonly();
  readonly userEmail = this.userEmailSignal.asReadonly();

  signIn(request: SignInRequest): Observable<SignInResponseDto> {
    return this.http.post<SignInResponseDto>(`${this.API_BASE_URL}/sign-in`, request).pipe(
      tap((response) => this.storeTokens(response)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Register a new user with email and password
   * Creates a new account in Supabase Auth and stores JWT tokens on success
   *
   * @param request - SignUpRequest containing email and password
   * @returns Observable<SignInResponseDto> with user info and session tokens
   * @throws HttpErrorResponse for validation errors, duplicate email, weak password, etc.
   */
  signUp(request: SignUpRequest): Observable<SignInResponseDto> {
    return this.http.post<SignInResponseDto>(`${this.API_BASE_URL}/sign-up`, request).pipe(
      tap((response) => {
        console.log('Sign-up successful:', response.user.email);
        // Store session tokens from successful registration
        this.storeTokens(response);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  private storeTokens(response: SignInResponseDto): void {
    const { access_token, refresh_token } = response.session;
    const { id, email } = response.user;

    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, access_token);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    localStorage.setItem(this.STORAGE_KEYS.USER_ID, id);
    localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, email);

    // Update signals
    this.accessTokenSignal.set(access_token);
    this.refreshTokenSignal.set(refresh_token);
    this.userIdSignal.set(id);
    this.userEmailSignal.set(email);
  }

  private getStoredAccessToken(): string | null {
    console.log('getStoredAccessToken', this.STORAGE_KEYS);
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    }
    return null;
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    }
    return null;
  }

  private getStoredUserId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEYS.USER_ID);
    }
    return null;
  }

  private getStoredUserEmail(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEYS.USER_EMAIL);
    }
    return null;
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSignal();
  }

  isAuthenticated(): boolean {
    return !!this.accessTokenSignal();
  }

  logout(): void {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    // Update all signals
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.userIdSignal.set(null);
    this.userEmailSignal.set(null);
  }
}
