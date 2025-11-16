# Login View Implementation Plan

## 1. Overview

The Login View is a public-facing authentication interface that enables registered users to access their LifeSync accounts. The view accepts email and password credentials, validates them against the backend API (`POST /api/auth/sign-in`), and upon successful authentication, stores JWT tokens (access and refresh) and redirects the user to the dashboard. The view handles multiple error scenarios including validation errors, invalid credentials, unverified emails, server errors, and rate limiting. It provides clear user feedback, maintains accessibility standards, and implements keyboard navigation for enhanced usability.

---

## 2. View Routing

**Route Path**: `/login`

**Protected**: No (public route, accessible before authentication)

**Route Configuration**:
```typescript
{
  path: 'login',
  component: LoginComponent,
  data: { title: 'Login - LifeSync' }
}
```

**Navigation**:
- Unauthenticated users accessing protected routes are redirected here (via auth interceptor)
- After logout, users are redirected to this route
- Users can navigate from the registration page using a link

---

## 3. Component Structure

```
LoginComponent (Main Container)
├── LoginFormComponent (Form Wrapper)
│   ├── FormErrorAlertComponent (Error Display)
│   ├── EmailInputComponent (Email Field)
│   ├── PasswordInputComponent (Password Field)
│   ├── SignInButtonComponent (Submit Button)
│   └── VerifyEmailPromptComponent (Conditional)
├── RegistrationLinkComponent (Bottom Navigation)
└── LoadingOverlayComponent (Loading State)
```

**Component Relationships**:
- `LoginComponent` is the smart/container component managing overall state and API calls
- `LoginFormComponent` is a presentational component displaying the form UI
- Child components are presentational, receiving data via @Input() and emitting events via @Output()

---

## 4. Component Details

### LoginComponent

**Component Description**: 
The main container component that orchestrates the login flow. It manages authentication state, coordinates API communication, handles routing and token storage, and manages error states. This smart component contains all business logic and state management, while delegating UI rendering to child components.

**Main Elements**:
- Form wrapper (LoginFormComponent)
- Loading overlay (conditional)
- Error states management

**Handled Interactions**:
- Form submission (`onSubmit` event)
- Form value changes (email/password input)
- Error dismissal
- Retry after error
- Navigation to dashboard on success
- Navigation to registration page

**Handled Validation**:
- Frontend validation delegated to LoginFormComponent; main component handles API validation responses
- Validates API response structure before processing
- Checks for required fields in response (access_token, refresh_token, user data)
- Verifies email_confirmed_at for unverified email handling

**Types**:
- `SignInResponseDto` (API response)
- `LoginError` (custom error model)
- `LoginFormValue` (form data model)

**Props** (None - root component):
```typescript
// Input properties
@Input() returnUrl?: string; // Optional return URL from query params (redirects after login)

// Output properties
@Output() loginSuccess = new EventEmitter<SignInResponseDto>();
@Output() loginError = new EventEmitter<LoginError>();
```

**Template**:
```html
<div class="login-container">
  <!-- Loading Overlay -->
  <div *ngIf="isLoading" class="loading-overlay">
    <nz-spin [nzSimple]="true"></nz-spin>
  </div>

  <!-- Main Form -->
  <app-login-form
    [isLoading]="isLoading"
    [error]="error"
    [email]="formValue.email"
    [password]="formValue.password"
    (onSubmit)="onSubmit($event)"
    (onErrorDismiss)="onErrorDismiss()">
  </app-login-form>

  <!-- Registration Link -->
  <div class="registration-link">
    <p>Don't have an account? 
      <a routerLink="/register">Sign up here</a>
    </p>
  </div>
</div>
```

---

### LoginFormComponent

**Component Description**: 
A presentational component that renders the login form UI using Ng-zorro components. It encapsulates form layout, field styling, and interactive elements while delegating state management to the parent component. This component focuses purely on display logic and user interactions, emitting events for parent handling.

**Main Elements**:
- NzForm wrapper with reactive form group
- NzFormControl for email field (with NzInput)
- NzFormControl for password field (with NzInput)
- FormErrorAlertComponent for error messages
- NzButton for form submission
- VerifyEmailPromptComponent (conditional, for unverified emails)
- Links to registration and password recovery

**Handled Interactions**:
- Email input blur validation
- Password input (no real-time validation)
- Sign In button click
- Error alert dismissal
- Resend verification email click
- Form submission (prevent default)

**Handled Validation**:
- Email format validation (Ng-zorro built-in email validator + custom)
- Email required validation
- Password required validation
- Password minimum length (6 characters frontend validation)
- Disable submit button until form is valid
- Show validation error messages beneath fields

**Types**:
- `FormGroup` (Reactive Forms)
- `LoginError` (error state)
- `SignInRequest` (form payload)

**Props**:
```typescript
@Input() isLoading: boolean = false;
@Input() error: LoginError | null = null;
@Input() email: string = '';
@Input() password: string = '';

@Output() onSubmit = new EventEmitter<SignInRequest>();
@Output() onErrorDismiss = new EventEmitter<void>();
@Output() onResendVerification = new EventEmitter<string>();
```

**Template Structure**:
```html
<div class="login-form-wrapper">
  <h1>Welcome to LifeSync</h1>
  <p class="subtitle">Sign in to continue your reflection journey</p>

  <!-- Error Alert -->
  <app-form-error-alert
    *ngIf="error"
    [error]="error"
    (onDismiss)="onErrorDismiss.emit()">
  </app-form-error-alert>

  <!-- Login Form -->
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit.emit(loginForm.value)">
    
    <!-- Email Field -->
    <nz-form-item>
      <nz-form-label [nzSpan]="24">Email Address</nz-form-label>
      <nz-form-control [nzSpan]="24">
        <input
          nz-input
          type="email"
          formControlName="email"
          placeholder="Enter your email"
          (blur)="validateEmail()">
        <nz-form-explain 
          *ngIf="getEmailError()">
          {{ getEmailError() }}
        </nz-form-explain>
      </nz-form-control>
    </nz-form-item>

    <!-- Password Field -->
    <nz-form-item>
      <nz-form-label [nzSpan]="24">Password</nz-form-label>
      <nz-form-control [nzSpan]="24">
        <input
          nz-input
          type="password"
          formControlName="password"
          placeholder="Enter your password">
        <nz-form-explain 
          *ngIf="getPasswordError()">
          {{ getPasswordError() }}
        </nz-form-explain>
      </nz-form-control>
    </nz-form-item>

    <!-- Sign In Button -->
    <nz-form-item>
      <nz-form-control [nzSpan]="24">
        <button
          nz-button
          nzType="primary"
          nzSize="large"
          [disabled]="!loginForm.valid || isLoading"
          nzBlock
          type="submit">
          <span *ngIf="!isLoading">Sign In</span>
          <span *ngIf="isLoading">
            <nz-spin [nzSimple]="true"></nz-spin> Signing In...
          </span>
        </button>
      </nz-form-control>
    </nz-form-item>
  </form>

  <!-- Verify Email Prompt -->
  <app-verify-email-prompt
    *ngIf="error?.code === 'UNVERIFIED_EMAIL'"
    [email]="email"
    (onResend)="onResendVerification.emit($event)">
  </app-verify-email-prompt>
</div>
```

---

### FormErrorAlertComponent

**Component Description**: 
A reusable presentational component that displays contextual error messages. It handles different error types with appropriate messaging and styling. Provides dismissible alerts with optional retry or additional actions based on error type.

**Main Elements**:
- NzAlert component with error icon and styling
- Error message text
- Close/dismiss button
- Contextual help text for specific error types

**Handled Interactions**:
- Dismiss button click
- Close icon click

**Handled Validation**:
- Error code validation (displays appropriate message for each code)
- Error message length validation (truncate if too long)

**Types**:
- `LoginError`
- `ErrorCode` enum

**Props**:
```typescript
@Input() error: LoginError;
@Input() dismissible: boolean = true;

@Output() onDismiss = new EventEmitter<void>();
```

**Template**:
```html
<nz-alert
  [nzType]="getAlertType()"
  [nzMessage]="getErrorTitle()"
  [nzDescription]="error.message"
  [nzShowIcon]="true"
  [nzCloseable]="dismissible"
  (nzOnClose)="onDismiss.emit()">
</nz-alert>
```

---

### VerifyEmailPromptComponent

**Component Description**: 
A contextual component that appears when a user attempts to sign in with an unverified email. It provides information about email verification and offers a button to resend the verification email. Only displayed when the error code is `UNVERIFIED_EMAIL`.

**Main Elements**:
- Informational text about email verification
- "Resend Verification Email" button
- Optional link to update email address

**Handled Interactions**:
- Resend verification email button click
- Email update link click (optional)

**Handled Validation**:
- Email format validation if user can change email
- Rate limiting on resend (prevent spam)

**Types**:
- None (simple component)

**Props**:
```typescript
@Input() email: string;

@Output() onResend = new EventEmitter<string>();
@Output() onChangeEmail = new EventEmitter<void>();
```

**Template**:
```html
<div class="verify-email-prompt">
  <nz-alert
    nzType="warning"
    nzMessage="Email Not Verified"
    [nzDescription]="'Please verify your email before signing in. Check your inbox for the verification link.'"
    [nzShowIcon]="true">
  </nz-alert>
  <button nz-button nzType="primary" (click)="onResend.emit(email)">
    Resend Verification Email
  </button>
</div>
```

---

## 5. Types

### Request DTOs

#### SignInRequest
```typescript
export type SignInRequest = {
  email: string;
  password: string;
};
```
- **email**: User's email address (string, required, valid email format)
- **password**: User's plaintext password (string, required, non-empty)

### Response DTOs

#### SignInSessionDto
```typescript
export type SignInSessionDto = {
  access_token: string;        // JWT bearer token for API requests
  refresh_token: string;       // Token for obtaining new access tokens
  expires_in: number;          // Seconds until access token expiration (typically 3600)
  token_type: 'bearer';        // HTTP authentication scheme type
};
```

#### SignInUserDto
```typescript
export type SignInUserDto = {
  id: UUID;                     // User's unique identifier (UUID string)
  email: string;                // User's email address
  email_confirmed_at: string | null;  // ISO 8601 timestamp of email confirmation, or null if unconfirmed
};
```

#### SignInResponseDto
```typescript
export type SignInResponseDto = {
  user: SignInUserDto;
  session: SignInSessionDto;
};
```

### Error DTOs

#### ErrorResponseDto
```typescript
export type ErrorResponseDto = {
  error: {
    code: string;                           // Error classification code
    message: string;                        // User-friendly error message
    details?: Record<string, unknown>;      // Optional detailed error information
  };
};
```

### Frontend View Models

#### LoginError
```typescript
export type LoginError = {
  code: 'VALIDATION_ERROR' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | 'UNVERIFIED_EMAIL' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  message: string;
  details?: {
    field?: string;           // For validation errors, which field
    reason?: string;          // Specific reason code
    retryAfter?: number;      // For rate limiting, seconds to wait
  };
};
```

#### LoginFormValue
```typescript
export type LoginFormValue = {
  email: string;
  password: string;
};
```

#### LoginViewState
```typescript
export type LoginViewState = {
  isLoading: boolean;                    // Form submission in progress
  error: LoginError | null;              // Current error state
  formValue: LoginFormValue;             // Current form values
  emailValidated: boolean;               // Email field has been validated
  isUnverifiedEmailState: boolean;       // User is in unverified email state
  lastAttemptTime?: Date;                // Time of last login attempt (for rate limiting)
};
```

---

## 6. State Management

**State Location**: Component-level state in `LoginComponent`

**State Variables**:
```typescript
// Loading and Error States
isLoading: boolean = false;                    // API call in progress
error: LoginError | null = null;               // Current error state
lastAttemptTime: Date | null = null;           // Track for rate limiting

// Form State
formValue: LoginFormValue = { email: '', password: '' };
emailValidated: boolean = false;

// UI State
returnUrl: string = '/dashboard';              // Where to redirect after login
```

**State Management Approach**:

1. **No Custom Hook Required**: Use component-level state management with reactive patterns via RxJS Subject/BehaviorSubject for state updates
2. **Reactive Forms**: Use Angular's Reactive Forms for form control and validation state
3. **Services for Side Effects**: Authentication service handles API calls and token storage

**State Updates**:

```typescript
// Example state transitions
onFormValueChange(value: LoginFormValue): void {
  this.formValue = value;
}

onStartLoading(): void {
  this.isLoading = true;
  this.error = null;
}

onLoginSuccess(response: SignInResponseDto): void {
  this.isLoading = false;
  this.error = null;
  // Store tokens (via authService)
  // Redirect to dashboard
}

onLoginError(error: LoginError): void {
  this.isLoading = false;
  this.error = error;
  this.lastAttemptTime = new Date();
}

onErrorDismiss(): void {
  this.error = null;
}
```

---

## 7. API Integration

### API Endpoint

**Endpoint**: `POST /api/auth/sign-in`

**Request**:
```typescript
const request: SignInRequest = {
  email: "user@example.com",
  password: "securePassword123"
};
```

**Response** (200 OK):
```typescript
const response: SignInResponseDto = {
  user: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "user@example.com",
    email_confirmed_at: "2025-01-01T10:00:00Z"
  },
  session: {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refresh_token: "sbr_1234567890abcdef...",
    expires_in: 3600,
    token_type: "bearer"
  }
};
```

### Error Responses

#### 400 Bad Request (Validation Error)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email must be a valid email address",
    "details": {
      "field": "email",
      "reason": "invalid_email"
    }
  }
}
```

#### 401 Unauthorized (Invalid Credentials)
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

#### 429 Too Many Requests (Rate Limited)
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many login attempts. Please try again in 15 minutes.",
    "details": {
      "retryAfter": 900
    }
  }
}
```

#### 500 Server Error
```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "Unexpected server error"
  }
}
```

### Frontend Implementation

**AuthService** (to be created or extended):
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  signIn(email: string, password: string): Observable<SignInResponseDto> {
    return this.http.post<SignInResponseDto>('/auth/sign-in', {
      email,
      password
    }).pipe(
      tap(response => {
        // Store tokens
        localStorage.setItem('access_token', response.session.access_token);
        localStorage.setItem('refresh_token', response.session.refresh_token);
        localStorage.setItem('user_id', response.user.id);
        localStorage.setItem('user_email', response.user.email);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
  }
}
```

**Component Integration**:
```typescript
onSubmit(formValue: LoginFormValue): void {
  this.isLoading = true;
  this.error = null;

  this.authService.signIn(formValue.email, formValue.password)
    .subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = this.mapApiErrorToLoginError(error);
      }
    });
}

private mapApiErrorToLoginError(error: HttpErrorResponse): LoginError {
  // Handle different HTTP status codes and map to LoginError
  switch (error.status) {
    case 400:
      return {
        code: 'VALIDATION_ERROR',
        message: error.error?.error?.message || 'Invalid input',
        details: error.error?.error?.details
      };
    case 401:
      return {
        code: 'INVALID_CREDENTIALS',
        message: error.error?.error?.message || 'Invalid email or password'
      };
    case 429:
      return {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Please try again later.',
        details: { retryAfter: error.error?.error?.details?.retryAfter }
      };
    default:
      return {
        code: 'SERVER_ERROR',
        message: 'An error occurred. Please try again later.'
      };
  }
}
```

---

## 8. User Interactions

### Interaction 1: User Opens Login Page
**Trigger**: User navigates to `/login`

**Expected Behavior**:
- Form is displayed with empty email and password fields
- Sign In button is disabled (form invalid)
- No error messages shown
- Page has keyboard focus on email input

**Implementation**:
```typescript
ngOnInit(): void {
  // If already logged in, redirect to dashboard
  if (this.authService.isAuthenticated()) {
    this.router.navigate(['/dashboard']);
    return;
  }

  // Extract return URL from query params
  this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

  // Initialize form
  this.initializeForm();

  // Set focus to email input
  setTimeout(() => {
    const emailInput = document.querySelector('[formControlName="email"]');
    if (emailInput instanceof HTMLInputElement) {
      emailInput.focus();
    }
  }, 100);
}
```

---

### Interaction 2: User Enters Email
**Trigger**: User types in email field

**Expected Behavior**:
- Email value updates in form control
- Real-time format validation
- Email field shows error icon on blur if invalid
- Sign In button remains disabled until email is valid

**Implementation**:
```typescript
// Reactive Forms handles this automatically
// Validation triggers on blur via nzFormControl

private buildForm(): FormGroup {
  return this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      this.customEmailValidator()
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(1)
    ]]
  });
}

private customEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(control.value) ? null : { invalidEmail: true };
  };
}
```

---

### Interaction 3: User Enters Password
**Trigger**: User types in password field

**Expected Behavior**:
- Password value updates in form control
- No real-time validation feedback
- Password characters are masked (input type="password")
- Sign In button becomes enabled when form is valid

**Implementation**:
```typescript
// Template handles password masking via input type="password"
// Form validation handles enabling/disabling button
```

---

### Interaction 4: User Clicks Sign In Button
**Trigger**: User clicks Sign In button (form is valid)

**Expected Behavior**:
- Form submission is prevented
- Loading state is activated (button shows spinner, form inputs disabled)
- API call to `POST /api/auth/sign-in` is made
- While loading, user cannot interact with form

**Implementation**:
```typescript
onSubmit(formValue: LoginFormValue): void {
  // Prevent multiple submissions
  if (this.isLoading) return;

  // Validate form
  if (!this.loginForm.valid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  this.error = null;

  this.authService.signIn(formValue.email, formValue.password)
    .pipe(
      timeout(10000), // 10 second timeout
      catchError(error => this.handleSignInError(error))
    )
    .subscribe({
      next: (response) => {
        this.handleSignInSuccess(response);
      },
      error: (error) => {
        this.isLoading = false;
        this.error = this.mapApiErrorToLoginError(error);
      }
    });
}

private handleSignInSuccess(response: SignInResponseDto): void {
  this.isLoading = false;
  this.error = null;

  // Check if email is verified
  if (!response.user.email_confirmed_at) {
    this.error = {
      code: 'UNVERIFIED_EMAIL',
      message: 'Please verify your email address to continue.',
      details: { email: response.user.email }
    };
    return;
  }

  // Navigate to dashboard or return URL
  this.router.navigate([this.returnUrl]);
}
```

---

### Interaction 5: API Returns Error
**Trigger**: API responds with error status code (400, 401, 429, 500)

**Expected Behavior**:
- Loading state is deactivated
- Error message is displayed in FormErrorAlertComponent
- Form remains visible for retry
- Sign In button is re-enabled
- For 401 with unverified email, show VerifyEmailPromptComponent

**Implementation**:
```typescript
private mapApiErrorToLoginError(error: HttpErrorResponse): LoginError {
  switch (error.status) {
    case 400:
      const validationError = error.error?.error;
      return {
        code: 'VALIDATION_ERROR',
        message: validationError?.message || 'Invalid input',
        details: validationError?.details
      };
    case 401:
      // Check if unverified email based on context
      if (this.isUnverifiedEmailError(error)) {
        return {
          code: 'UNVERIFIED_EMAIL',
          message: 'Email not verified. Please check your inbox for verification link.'
        };
      }
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      };
    case 429:
      return {
        code: 'RATE_LIMITED',
        message: 'Too many login attempts. Please try again later.',
        details: { retryAfter: 900 }
      };
    case 0:
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection error. Please check your internet connection.'
      };
    default:
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again.'
      };
  }
}
```

---

### Interaction 6: User Dismisses Error
**Trigger**: User clicks close/dismiss button on error alert

**Expected Behavior**:
- Error message disappears
- Form is visible and ready for retry
- Previous form values are retained

**Implementation**:
```typescript
onErrorDismiss(): void {
  this.error = null;
}
```

---

### Interaction 7: User Clicks "Don't have an account?"
**Trigger**: User clicks registration link

**Expected Behavior**:
- User is navigated to `/register` route
- Current form state is not saved

**Implementation**:
```html
<p class="mt-4 text-center">
  Don't have an account? 
  <a routerLink="/register" class="text-primary font-semibold">Sign up here</a>
</p>
```

---

### Interaction 8: Unverified Email - Resend Verification
**Trigger**: User clicks "Resend Verification Email" button (appears only when email is unverified)

**Expected Behavior**:
- Resend endpoint is called (future implementation)
- Success message is shown
- Button is disabled for 60 seconds to prevent spam

**Implementation**:
```typescript
onResendVerificationEmail(email: string): void {
  // To be implemented with resend endpoint
  this.authService.resendVerificationEmail(email).subscribe({
    next: () => {
      this.error = {
        code: 'SUCCESS',
        message: 'Verification email sent. Please check your inbox.'
      };
      // Disable button for 60 seconds
      this.disableResendButton = true;
      setTimeout(() => {
        this.disableResendButton = false;
      }, 60000);
    },
    error: (error) => {
      this.error = this.mapApiErrorToLoginError(error);
    }
  });
}
```

---

## 9. Conditions and Validation

### Form-Level Conditions

#### Email Field Validation
**Condition**: Email must be a valid email format

**Components Affected**: LoginFormComponent, Email Input field

**How Verified**:
```typescript
email: [
  '',
  [
    Validators.required,
    Validators.email,
    this.customEmailValidator()
  ]
]
```

**Interface Impact**:
- If invalid: Show error message "Please enter a valid email address" below field
- If valid: Field appears with green border (or default)
- Sign In button: Disabled until all fields are valid

**Related User Story**: US-002 (Correct credentials must have valid format)

---

#### Password Field Validation
**Condition**: Password must be non-empty

**Components Affected**: LoginFormComponent, Password Input field

**How Verified**:
```typescript
password: ['', [Validators.required, Validators.minLength(1)]]
```

**Interface Impact**:
- If empty: Show error message "Password is required" below field
- If filled: Field appears normal
- Sign In button: Disabled until both fields are valid

**Related User Story**: US-002

---

### Form-Level Conditions

#### Form Validity
**Condition**: Form must be valid before submission

**Components Affected**: LoginFormComponent, Sign In Button

**How Verified**:
```typescript
[disabled]="!loginForm.valid || isLoading"
```

**Interface Impact**:
- Sign In button is disabled (grayed out, not clickable) when form is invalid
- Button text changes to "Signing In..." while loading
- Button shows spinner icon during submission

**Related User Story**: US-002

---

### API Response Conditions

#### Successful Authentication
**Condition**: Response includes valid user and session data

**Components Affected**: LoginComponent

**How Verified**:
```typescript
if (response.user && response.user.id && 
    response.session && response.session.access_token) {
  // Valid response
}
```

**Interface Impact**:
- Tokens are stored in localStorage
- User is redirected to dashboard
- Component unmounts

**Related User Story**: US-002 (Correct credentials redirect to dashboard)

---

#### Email Unverified
**Condition**: `response.user.email_confirmed_at === null`

**Components Affected**: LoginComponent, VerifyEmailPromptComponent

**How Verified**:
```typescript
if (!response.user.email_confirmed_at) {
  // Email is unverified
  return error state 'UNVERIFIED_EMAIL'
}
```

**Interface Impact**:
- Error is displayed: "Email not verified. Please verify your email to continue."
- VerifyEmailPromptComponent appears with "Resend Verification Email" button
- User is not logged in or redirected
- Form remains visible for retry

**Related User Story**: US-002 (Specific error for unverified emails)

---

#### Invalid Credentials
**Condition**: HTTP 401 response from API

**Components Affected**: LoginComponent, FormErrorAlertComponent

**How Verified**:
```typescript
if (error.status === 401) {
  return error code 'INVALID_CREDENTIALS'
}
```

**Interface Impact**:
- Error message displays: "Invalid email or password"
- Error alert is dismissible
- Form remains visible for retry
- All fields retain their values

**Related User Story**: US-002 (Incorrect credentials display an error message)

---

#### Validation Error
**Condition**: HTTP 400 response with field-specific error details

**Components Affected**: LoginComponent, FormErrorAlertComponent

**How Verified**:
```typescript
if (error.status === 400) {
  return error code 'VALIDATION_ERROR' with details
}
```

**Interface Impact**:
- Error message displays specific validation failure
- If specific field identified, show inline field error
- Form remains visible for correction

**Related User Story**: US-002

---

#### Rate Limited
**Condition**: HTTP 429 response (too many login attempts)

**Components Affected**: LoginComponent, FormErrorAlertComponent

**How Verified**:
```typescript
if (error.status === 429) {
  return error code 'RATE_LIMITED'
}
```

**Interface Impact**:
- Error message displays: "Too many login attempts. Please try again later."
- Sign In button is disabled for duration specified in response
- Countdown timer shows remaining wait time (optional enhancement)

**Related User Story**: US-002 (Security: Rate limiting prevents brute force)

---

#### Server Error
**Condition**: HTTP 5xx response or network error

**Components Affected**: LoginComponent, FormErrorAlertComponent

**How Verified**:
```typescript
if (error.status >= 500 || error.status === 0) {
  return error code 'SERVER_ERROR'
}
```

**Interface Impact**:
- Generic error message displays: "An unexpected error occurred. Please try again."
- Form remains visible for retry
- No sensitive information revealed

**Related User Story**: US-002 (Error handling for server issues)

---

### Authentication State Conditions

#### Already Authenticated
**Condition**: Valid JWT token exists in localStorage

**Components Affected**: LoginComponent ngOnInit

**How Verified**:
```typescript
if (this.authService.isAuthenticated()) {
  this.router.navigate(['/dashboard']);
}
```

**Interface Impact**:
- User is redirected to dashboard immediately
- Login form is never displayed

**Related User Story**: US-002 (Prevents authenticated users from accessing login)

---

## 10. Error Handling

### Error Scenario 1: Invalid Email Format (Client-side)
**Trigger**: User enters invalid email and blurs field

**Error Message**: "Please enter a valid email address"

**Handling**:
- Inline error display below email field
- Sign In button remains disabled
- No API call is made
- User can correct and retry

**Implementation**:
```typescript
getEmailError(): string | null {
  const emailControl = this.loginForm.get('email');
  if (!emailControl || !emailControl.touched) return null;
  
  if (emailControl.hasError('required')) {
    return 'Email is required';
  }
  if (emailControl.hasError('email') || emailControl.hasError('invalidEmail')) {
    return 'Please enter a valid email address';
  }
  return null;
}
```

---

### Error Scenario 2: Empty Password (Client-side)
**Trigger**: User attempts to submit form with empty password

**Error Message**: "Password is required"

**Handling**:
- Inline error display below password field
- Sign In button remains disabled
- User can correct and retry

**Implementation**:
```typescript
getPasswordError(): string | null {
  const passwordControl = this.loginForm.get('password');
  if (!passwordControl || !passwordControl.touched) return null;
  
  if (passwordControl.hasError('required')) {
    return 'Password is required';
  }
  return null;
}
```

---

### Error Scenario 3: Invalid Credentials (API Error)
**Trigger**: User enters correct email format but wrong password or non-existent email

**Error Code**: 401 INVALID_CREDENTIALS

**Error Message**: "Invalid email or password"

**Handling**:
- Display error alert at top of form
- Alert is dismissible
- Form values are retained
- User can retry with different credentials
- No sensitive information reveals whether email exists

**Implementation**:
```typescript
if (error.status === 401) {
  return {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password' // Generic for security
  };
}
```

---

### Error Scenario 4: Unverified Email
**Trigger**: Valid credentials but email not verified

**Error Code**: 401 UNVERIFIED_EMAIL

**Error Message**: "Please verify your email address to continue"

**Handling**:
- Display error alert
- Show VerifyEmailPromptComponent with resend button
- User can request verification email resend
- Form remains visible for retry after verification

**Implementation**:
```typescript
// Detect unverified email based on context
// (in real implementation, backend should include specific error code)
if (!response.user.email_confirmed_at) {
  this.error = {
    code: 'UNVERIFIED_EMAIL',
    message: 'Please verify your email address to continue.'
  };
  return;
}
```

---

### Error Scenario 5: Too Many Login Attempts (Rate Limited)
**Trigger**: User exceeds rate limit (5 attempts per 15 minutes per backend spec)

**Error Code**: 429 RATE_LIMITED

**Error Message**: "Too many login attempts. Please try again later."

**Handling**:
- Display error alert with wait time
- Disable Sign In button for duration specified
- Optional: Show countdown timer
- User must wait before retrying

**Implementation**:
```typescript
if (error.status === 429) {
  const retryAfter = error.error?.error?.details?.retryAfter || 900;
  
  this.error = {
    code: 'RATE_LIMITED',
    message: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
    details: { retryAfter }
  };

  // Disable button for retry period
  this.disableSubmit = true;
  this.retryCountdown = retryAfter;
  
  const countdown = setInterval(() => {
    this.retryCountdown--;
    if (this.retryCountdown <= 0) {
      clearInterval(countdown);
      this.disableSubmit = false;
    }
  }, 1000);
}
```

---

### Error Scenario 6: Network Error / Timeout
**Trigger**: User loses internet connection or API timeout occurs

**Error Code**: 0 or NETWORK_ERROR

**Error Message**: "Network connection error. Please check your internet connection."

**Handling**:
- Display error alert
- Suggest checking internet connection
- Provide retry button
- Form remains visible and editable

**Implementation**:
```typescript
if (error.status === 0 || error instanceof TimeoutError) {
  return {
    code: 'NETWORK_ERROR',
    message: 'Network connection error. Please check your internet connection and try again.'
  };
}
```

---

### Error Scenario 7: Server Error (5xx)
**Trigger**: Backend service unavailable or unexpected server error

**Error Code**: 500+ or SERVER_ERROR

**Error Message**: "An unexpected error occurred. Please try again."

**Handling**:
- Display generic error alert (don't reveal server details)
- Log full error to console for debugging
- Suggest retry after short delay
- Form remains visible

**Implementation**:
```typescript
if (error.status >= 500) {
  console.error('Server error during login:', error);
  
  return {
    code: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.'
  };
}
```

---

### Error Scenario 8: Malformed API Response
**Trigger**: API returns 200 but response structure is invalid

**Error Message**: "An unexpected error occurred. Please try again."

**Handling**:
- Log error details to console for debugging
- Display generic error to user
- Do not attempt to store invalid tokens

**Implementation**:
```typescript
// Validate response structure
if (!response?.user?.id || !response?.session?.access_token) {
  console.error('Invalid response structure from auth API:', response);
  
  this.error = {
    code: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again.'
  };
  return;
}
```

---

## 11. Implementation Steps

### Step 1: Create Auth Service

**File**: `src/app/services/auth.service.ts`

**Action**: Create service for authentication API calls and token management

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SignInRequest, SignInResponseDto } from '../types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_ID: 'user_id',
    USER_EMAIL: 'user_email'
  };

  signIn(request: SignInRequest): Observable<SignInResponseDto> {
    return this.http.post<SignInResponseDto>('/auth/sign-in', request).pipe(
      tap(response => this.storeTokens(response)),
      catchError(error => throwError(() => error))
    );
  }

  private storeTokens(response: SignInResponseDto): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, response.session.access_token);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, response.session.refresh_token);
    localStorage.setItem(this.STORAGE_KEYS.USER_ID, response.user.id);
    localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, response.user.email);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  logout(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
```

---

### Step 2: Update App Routes

**File**: `src/app/app.routes.ts`

**Action**: Add login route to application routes

```typescript
export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login - LifeSync' }
  },
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  }
];
```

---

### Step 3: Create Types

**File**: `src/app/types/login.types.ts` (or add to existing `src/types.ts`)

**Action**: Add login-specific types and error models

```typescript
export type LoginError = {
  code: 'VALIDATION_ERROR' | 'INVALID_CREDENTIALS' | 'SERVER_ERROR' | 
        'UNVERIFIED_EMAIL' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  message: string;
  details?: {
    field?: string;
    reason?: string;
    retryAfter?: number;
  };
};

export type LoginFormValue = {
  email: string;
  password: string;
};

export type LoginViewState = {
  isLoading: boolean;
  error: LoginError | null;
  formValue: LoginFormValue;
  emailValidated: boolean;
  lastAttemptTime?: Date;
};
```

---

### Step 4: Create FormErrorAlertComponent

**File**: `src/app/views/login/components/form-error-alert/form-error-alert.component.ts`

**Action**: Create reusable error alert component

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { LoginError } from '../../../../types';

@Component({
  selector: 'app-form-error-alert',
  standalone: true,
  imports: [CommonModule, NzAlertModule],
  template: `
    <nz-alert
      *ngIf="error"
      [nzType]="getAlertType()"
      [nzMessage]="getErrorTitle()"
      [nzDescription]="error.message"
      [nzShowIcon]="true"
      [nzCloseable]="dismissible"
      (nzOnClose)="onDismiss.emit()">
    </nz-alert>
  `
})
export class FormErrorAlertComponent {
  @Input() error: LoginError | null = null;
  @Input() dismissible: boolean = true;
  @Output() onDismiss = new EventEmitter<void>();

  getAlertType(): 'success' | 'info' | 'warning' | 'error' {
    switch (this.error?.code) {
      case 'VALIDATION_ERROR':
        return 'warning';
      case 'INVALID_CREDENTIALS':
      case 'UNVERIFIED_EMAIL':
        return 'error';
      case 'RATE_LIMITED':
      case 'NETWORK_ERROR':
        return 'warning';
      case 'SERVER_ERROR':
        return 'error';
      default:
        return 'info';
    }
  }

  getErrorTitle(): string {
    switch (this.error?.code) {
      case 'VALIDATION_ERROR':
        return 'Validation Error';
      case 'INVALID_CREDENTIALS':
        return 'Sign In Failed';
      case 'UNVERIFIED_EMAIL':
        return 'Email Not Verified';
      case 'RATE_LIMITED':
        return 'Too Many Attempts';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'SERVER_ERROR':
        return 'Server Error';
      default:
        return 'Error';
    }
  }
}
```

---

### Step 5: Create VerifyEmailPromptComponent

**File**: `src/app/views/login/components/verify-email-prompt/verify-email-prompt.component.ts`

**Action**: Create component for unverified email handling

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-verify-email-prompt',
  standalone: true,
  imports: [CommonModule, NzAlertModule, NzButtonModule],
  template: `
    <div class="verify-email-prompt">
      <nz-alert
        nzType="warning"
        nzMessage="Email Not Verified"
        [nzDescription]="'Please verify your email before signing in. Check your inbox for the verification link.'"
        [nzShowIcon]="true"
        class="mb-4">
      </nz-alert>
      <button 
        nz-button 
        nzType="primary" 
        nzBlock
        (click)="onResend.emit(email)">
        Resend Verification Email to {{ email }}
      </button>
    </div>
  `,
  styles: [`
    .verify-email-prompt {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #f0f0f0;
    }
  `]
})
export class VerifyEmailPromptComponent {
  @Input() email: string = '';
  @Output() onResend = new EventEmitter<string>();
}
```

---

### Step 6: Create LoginFormComponent

**File**: `src/app/views/login/components/login-form/login-form.component.ts`

**Action**: Create main login form component

```typescript
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormErrorAlertComponent } from '../form-error-alert/form-error-alert.component';
import { VerifyEmailPromptComponent } from '../verify-email-prompt/verify-email-prompt.component';
import { LoginError, LoginFormValue, SignInRequest } from '../../../../types';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    FormErrorAlertComponent,
    VerifyEmailPromptComponent
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss'
})
export class LoginFormComponent implements OnInit {
  @Input() isLoading: boolean = false;
  @Input() error: LoginError | null = null;

  @Output() onSubmit = new EventEmitter<SignInRequest>();
  @Output() onErrorDismiss = new EventEmitter<void>();
  @Output() onResendVerification = new EventEmitter<string>();

  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.buildForm();
  }

  ngOnInit(): void {
    // Set focus to email input
    setTimeout(() => {
      const emailInput = document.querySelector('[formControlName="email"]') as HTMLInputElement;
      emailInput?.focus();
    }, 100);
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email, this.customEmailValidator()]],
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  private customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(control.value) ? null : { invalidEmail: true };
    };
  }

  getEmailError(): string | null {
    const control = this.loginForm.get('email');
    if (!control || !control.touched) return null;
    
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email') || control.hasError('invalidEmail')) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  getPasswordError(): string | null {
    const control = this.loginForm.get('password');
    if (!control || !control.touched) return null;
    
    if (control.hasError('required')) return 'Password is required';
    return null;
  }

  onFormSubmit(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.onSubmit.emit(this.loginForm.value as SignInRequest);
  }

  handleErrorDismiss(): void {
    this.onErrorDismiss.emit();
  }

  handleResendVerification(email: string): void {
    this.onResendVerification.emit(email);
  }
}
```

---

### Step 7: Create LoginFormComponent Template

**File**: `src/app/views/login/components/login-form/login-form.component.html`

**Action**: Create HTML template for login form

```html
<div class="login-form-wrapper">
  <div class="login-header">
    <h1 class="text-3xl font-bold mb-2">Welcome to LifeSync</h1>
    <p class="text-gray-600 mb-6">Sign in to continue your reflection journey</p>
  </div>

  <!-- Error Alert -->
  <app-form-error-alert
    *ngIf="error"
    [error]="error"
    (onDismiss)="handleErrorDismiss()">
  </app-form-error-alert>

  <!-- Login Form -->
  <form [formGroup]="loginForm" (ngSubmit)="onFormSubmit()" class="mt-6">
    
    <!-- Email Field -->
    <nz-form-item class="mb-4">
      <nz-form-label [nzSpan]="24" nzRequired>
        Email Address
      </nz-form-label>
      <nz-form-control [nzSpan]="24" [nzErrorTip]="getEmailError()">
        <input
          nz-input
          type="email"
          formControlName="email"
          placeholder="Enter your email"
          (blur)="loginForm.get('email')?.markAsTouched()">
      </nz-form-control>
    </nz-form-item>

    <!-- Password Field -->
    <nz-form-item class="mb-6">
      <nz-form-label [nzSpan]="24" nzRequired>
        Password
      </nz-form-label>
      <nz-form-control [nzSpan]="24" [nzErrorTip]="getPasswordError()">
        <input
          nz-input
          type="password"
          formControlName="password"
          placeholder="Enter your password"
          (blur)="loginForm.get('password')?.markAsTouched()">
      </nz-form-control>
    </nz-form-item>

    <!-- Sign In Button -->
    <nz-form-item class="mb-4">
      <nz-form-control [nzSpan]="24">
        <button
          nz-button
          nzType="primary"
          nzSize="large"
          [disabled]="!loginForm.valid || isLoading"
          nzBlock
          type="submit">
          <span *ngIf="!isLoading">Sign In</span>
          <span *ngIf="isLoading">
            <nz-spin [nzSimple]="true" nzSize="small"></nz-spin>
            Signing In...
          </span>
        </button>
      </nz-form-control>
    </nz-form-item>
  </form>

  <!-- Verify Email Prompt -->
  <app-verify-email-prompt
    *ngIf="error?.code === 'UNVERIFIED_EMAIL'"
    [email]="loginForm.get('email')?.value || ''"
    (onResend)="handleResendVerification($event)">
  </app-verify-email-prompt>
</div>
```

---

### Step 8: Create LoginFormComponent Styles

**File**: `src/app/views/login/components/login-form/login-form.component.scss`

**Action**: Add styles for login form

```scss
.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;

  .login-header {
    text-align: center;
    margin-bottom: 2rem;

    h1 {
      color: #1890ff;
      margin-bottom: 0.5rem;
    }

    p {
      font-size: 14px;
    }
  }

  nz-form-item {
    margin-bottom: 1rem;
  }

  nz-form-explain {
    color: #ff4d4f;
    font-size: 12px;
  }
}
```

---

### Step 9: Create Main LoginComponent

**File**: `src/app/views/login/login.component.ts`

**Action**: Create main login container component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { AuthService } from '../../services/auth.service';
import { LoginError, LoginFormValue, SignInRequest, SignInResponseDto } from '../../types';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  error: LoginError | null = null;
  formValue: LoginFormValue = { email: '', password: '' };
  returnUrl: string = '/dashboard';

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Extract return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
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

    this.authService.signIn(request)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError(error => {
          this.isLoading = false;
          this.error = this.mapApiErrorToLoginError(error);
          throw error;
        })
      )
      .subscribe({
        next: (response) => {
          this.handleSignInSuccess(response);
        }
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
        message: 'Please verify your email address to continue.'
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
        message: 'Network connection error. Please check your internet connection.'
      };
    }

    // Validation error (400)
    if (error.status === 400) {
      const apiError = error.error?.error;
      return {
        code: 'VALIDATION_ERROR',
        message: apiError?.message || 'Invalid input',
        details: apiError?.details
      };
    }

    // Unauthorized (401)
    if (error.status === 401) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      };
    }

    // Rate limited (429)
    if (error.status === 429) {
      const retryAfter = error.error?.error?.details?.retryAfter || 900;
      return {
        code: 'RATE_LIMITED',
        message: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        details: { retryAfter }
      };
    }

    // Server error (5xx)
    if (error.status >= 500) {
      console.error('Server error during login:', error);
      return {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred. Please try again later.'
      };
    }

    // Unknown error
    return {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.'
    };
  }
}
```

---

### Step 10: Create LoginComponent Template

**File**: `src/app/views/login/login.component.html`

**Action**: Create HTML template for login view

```html
<div class="login-container">
  <div class="login-content">
    <app-login-form
      [isLoading]="isLoading"
      [error]="error"
      (onSubmit)="onSubmit($event)"
      (onErrorDismiss)="onErrorDismiss()"
      (onResendVerification)="onResendVerification($event)">
    </app-login-form>

    <!-- Registration Link -->
    <div class="registration-footer">
      <p>Don't have an account? 
        <a routerLink="/register" class="text-primary font-semibold hover:underline">
          Sign up here
        </a>
      </p>
    </div>
  </div>
</div>
```

---

### Step 11: Create LoginComponent Styles

**File**: `src/app/views/login/login.component.scss`

**Action**: Add styles for login view

```scss
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;

  .login-content {
    width: 100%;
    max-width: 450px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    padding: 2rem;

    @media (max-width: 640px) {
      padding: 1.5rem;
      border-radius: 4px;
    }
  }

  .registration-footer {
    margin-top: 2rem;
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;

    p {
      color: #666;
      font-size: 14px;
      margin: 0;

      a {
        color: #1890ff;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
```

---

### Step 12: Update App Routes

**File**: `src/app/app.routes.ts`

**Action**: Add login route to application

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { LoginComponent } from './views/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Login - LifeSync' }
  },
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  }
];
```

---

### Step 13: Import LoginComponent in App Config (if needed)

**File**: `src/app/app.config.ts`

**Action**: Ensure proper HTTP interceptor and providers are configured

```typescript
// Already configured with authInterceptor
// No changes needed if authInterceptor is already registered
```

---

### Step 14: Test Login Functionality

**Manual Testing**:

1. Navigate to `http://localhost:4200/login`
2. Verify form displays with empty fields
3. Click Sign In without filling fields - button should be disabled
4. Enter invalid email format - show error
5. Enter valid email and password - button enables
6. Click Sign In - loading spinner appears
7. On success - redirected to dashboard
8. On error - error message displays
9. Click dismiss - error clears
10. Verify tokens stored in localStorage

---

### Step 15: Create Unit Tests

**File**: `src/app/views/login/login.component.spec.ts`

**Action**: Create tests for login component

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['signIn', 'isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } }
        }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard if already authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should call authService.signIn on form submit', () => {
    const response = {
      user: { id: 'uuid', email: 'test@example.com', email_confirmed_at: '2025-01-01T00:00:00Z' },
      session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer' as const }
    };
    authService.signIn.and.returnValue(of(response));

    component.onSubmit({ email: 'test@example.com', password: 'password123' });

    expect(authService.signIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('should redirect to dashboard on successful login', () => {
    const response = {
      user: { id: 'uuid', email: 'test@example.com', email_confirmed_at: '2025-01-01T00:00:00Z' },
      session: { access_token: 'token', refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer' as const }
    };
    authService.signIn.and.returnValue(of(response));

    component.onSubmit({ email: 'test@example.com', password: 'password123' });

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error on failed login', () => {
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    authService.signIn.and.returnValue(throwError(() => error));

    component.onSubmit({ email: 'test@example.com', password: 'wrongpassword' });

    expect(component.error?.code).toBe('INVALID_CREDENTIALS');
    expect(component.error?.message).toBe('Invalid email or password');
  });
});
```

---

### Step 16: Create Integration Tests (e2e)

**File**: `e2e/login.spec.ts` (if using Playwright)

**Action**: Create end-to-end tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4200/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Welcome to LifeSync');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });

  test('should disable sign in button when form is invalid', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should enable sign in button when form is valid', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('nz-alert')).toContainText('Invalid email or password');
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'correctpassword');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await expect(page).toHaveURL('http://localhost:4200/dashboard');
  });
});
```

---

### Step 17: Update Environment Configuration

**File**: `src/environments/environment.ts`

**Action**: Ensure environment is properly configured

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

### Step 18: Documentation

**File**: `docs/login-view.md` (optional)

**Action**: Create user-facing documentation

```markdown
# Login Page Documentation

## Overview
The login page allows users to authenticate with their email and password.

## Features
- Email validation
- Password input with masking
- Error handling and display
- Email verification prompt for unverified accounts
- Rate limiting protection
- Accessible form design

## User Flow
1. Enter email address
2. Enter password
3. Click "Sign In"
4. On success → redirected to dashboard
5. On error → error message displayed, retry available

## Error Messages
- "Please enter a valid email address" - Invalid email format
- "Invalid email or password" - Credentials don't match
- "Please verify your email address to continue" - Email not verified
- "Too many login attempts. Please try again later" - Rate limited
```

---

## Implementation Checklist

- [ ] Create AuthService (`src/app/services/auth.service.ts`)
- [ ] Create LoginError and related types
- [ ] Create FormErrorAlertComponent
- [ ] Create VerifyEmailPromptComponent
- [ ] Create LoginFormComponent with template and styles
- [ ] Create LoginComponent (main container) with template and styles
- [ ] Update app.routes.ts with login route
- [ ] Verify auth interceptor is configured in app.config.ts
- [ ] Create unit tests for LoginComponent
- [ ] Create unit tests for LoginFormComponent
- [ ] Create e2e tests with Playwright
- [ ] Test manual login flow with valid credentials
- [ ] Test manual login flow with invalid credentials
- [ ] Test email validation
- [ ] Test error dismissal
- [ ] Test already-authenticated redirect
- [ ] Test token storage in localStorage
- [ ] Verify accessibility (keyboard navigation, labels, focus management)
- [ ] Test responsive design on mobile and tablet
- [ ] Test rate limiting handling (429 response)
- [ ] Test network error handling
- [ ] Document API integration points
- [ ] Deploy to staging environment
- [ ] QA testing on staging
- [ ] Deploy to production
