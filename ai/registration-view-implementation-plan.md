# Registration View Implementation Plan

## 1. Overview

The Registration View is a public-facing authentication interface that enables new users to create accounts for the LifeSync application. The view accepts email, password, and password confirmation inputs, validates them in real-time with visual feedback including a password strength indicator, and submits credentials to the backend API (`POST /api/auth/sign-up`). Upon successful registration, the view displays a success message instructing users to verify their email, stores JWT tokens, and prepares for automatic navigation to the dashboard once email verification is complete. The view handles multiple error scenarios including validation errors, duplicate email registration, weak passwords, server errors, and rate limiting. It provides clear user feedback, maintains accessibility standards, implements keyboard navigation, and delivers an intuitive UX that guides new users through account creation.

---

## 2. View Routing

**Route Path**: `/register`

**Protected**: No (public route, accessible before authentication)

**Route Configuration**:
```typescript
{
  path: 'register',
  component: RegistrationComponent,
  data: { title: 'Register - LifeSync' }
}
```

**Navigation**:
- Unauthenticated users can access this route to create new accounts
- After successful registration, the view shows a success message (no immediate redirect)
- Users can navigate from the login page using a "Create Account" link
- Users already authenticated will be redirected to dashboard (handled in component)

---

## 3. Component Structure

```
RegistrationComponent (Main Container/Smart Component)
├── RegistrationFormComponent (Form Wrapper)
│   ├── FormErrorAlertComponent (Error Display - reused from login)
│   ├── EmailInputField (Email Input with validation)
│   ├── PasswordInputField (Password Input with validation)
│   ├── PasswordStrengthIndicatorComponent (Visual feedback)
│   ├── ConfirmPasswordInputField (Password confirmation)
│   ├── SignUpButtonComponent (Submit Button)
│   └── LoginLinkComponent (Navigation to login)
├── SuccessMessageComponent (Conditional)
└── LoadingOverlayComponent (Loading State - conditional)
```

**Component Relationships**:
- `RegistrationComponent` is the smart/container component managing overall state and API calls
- `RegistrationFormComponent` is a presentational component displaying the form UI
- `PasswordStrengthIndicatorComponent` provides visual password strength feedback
- `SuccessMessageComponent` displays post-registration confirmation
- Child components are presentational, receiving data via @Input() and emitting events via @Output()

---

## 4. Component Details

### RegistrationComponent

**Component Description**: 
The main container component that orchestrates the registration flow. It manages authentication state, coordinates API communication, handles routing and token storage, manages error states, and tracks registration progress. This smart component contains all business logic and state management, while delegating UI rendering to child components.

**Main Elements**:
- Form wrapper (RegistrationFormComponent)
- Success message display (SuccessMessageComponent) - conditional, shown after successful registration
- Loading overlay (conditional, during API call)
- Error states management

**Handled Interactions**:
- Form submission (`onSubmit` event)
- Form value changes (email/password/confirmPassword input)
- Error dismissal
- Retry after error
- Navigation to login page
- Navigation to dashboard after email verification

**Handled Validation**:
- Frontend validation delegated to RegistrationFormComponent; main component handles API validation responses
- Validates API response structure before processing
- Checks for required fields in response (access_token, refresh_token, user data)
- Verifies session data integrity

**Types**:
- `SignUpRequest` (form data model)
- `SignInResponseDto` (API response)
- `LoginError` (custom error model)
- `SignUpFormValue` (extended form data with confirmPassword)
- `RegistrationViewState` (view state model)

**Props** (None - root component):
```typescript
// Input properties
@Input() returnUrl?: string; // Optional return URL after email verification

// Output properties
@Output() registrationSuccess = new EventEmitter<SignInResponseDto>();
@Output() registrationError = new EventEmitter<LoginError>();
```

**Template Outline**:
```html
<div class="registration-container">
  <!-- Loading Overlay -->
  <div *ngIf="isLoading && !isSuccess" class="loading-overlay">
    <nz-spin [nzSimple]="true"></nz-spin>
  </div>

  <!-- Success Message (shown after successful registration) -->
  <app-success-message 
    *ngIf="isSuccess && registeredEmail"
    [email]="registeredEmail"
    [user]="user"
    (navigateToDashboard)="onNavigateToDashboard()">
  </app-success-message>

  <!-- Registration Form (hidden when showing success) -->
  <app-registration-form 
    *ngIf="!isSuccess"
    [isLoading]="isLoading"
    [error]="error"
    (onSubmit)="onSubmit($event)"
    (onErrorDismiss)="onErrorDismiss()"
    (navigateToLogin)="navigateToLogin()">
  </app-registration-form>
</div>
```

---

### RegistrationFormComponent

**Component Description**: 
A presentational component that displays the registration form with all input fields (email, password, confirm password), real-time validation feedback, password strength indicator, and navigation links. This component is responsible for form UI layout and user input collection, while delegating business logic to the parent component.

**Main Elements**:
- NzForm wrapper (reactive form)
- Email input field with validation feedback
- Password input field with real-time strength indicator
- Password strength indicator component
- Confirm password input field with match validation
- Sign-up button (with loading state)
- Error alert component (for displaying error messages)
- Links to login page

**Handled Interactions**:
- Form field input changes (real-time)
- Form submission (button click or Enter key)
- Error dismissal
- Password visibility toggle (show/hide)
- Navigation to login page

**Handled Validation**:
- Email format validation (real-time feedback)
- Email required validation
- Password strength validation (real-time, visual indicator)
- Password required validation
- Confirm password match validation
- Confirm password required validation
- Enable/disable submit button based on form validity and loading state
- Display inline error messages for each field

**Validation Details**:
- **Email field**: 
  - Required: must not be empty
  - Format: must match valid email pattern (RFC 5322 simplified)
  - On change: validate format in real-time, show error/success icon
  
- **Password field**:
  - Required: must not be empty
  - Minimum length: 1 character (frontend), Supabase enforces min 6
  - Strength: analyzed in real-time, feedback via PasswordStrengthIndicator
  - Criteria: length, uppercase, lowercase, numbers, special characters
  
- **Confirm password field**:
  - Required: must not be empty
  - Match: must exactly match password field
  - On change: validate match, show error/success feedback

**Types**:
- `SignUpFormValue` (form values model)
- `LoginError` (error model)
- `PasswordStrengthResult` (password strength analysis)

**Props**:
```typescript
// Input properties
@Input() isLoading: boolean = false;
@Input() error: LoginError | null = null;
@Input() initialFormValue?: SignUpFormValue;

// Output properties
@Output() onSubmit = new EventEmitter<SignUpRequest>();
@Output() onErrorDismiss = new EventEmitter<void>();
@Output() navigateToLogin = new EventEmitter<void>();
```

---

### PasswordStrengthIndicatorComponent

**Component Description**: 
A presentational component that displays visual feedback about password strength. It analyzes password input and displays a color-coded bar, strength level text, and actionable feedback criteria.

**Main Elements**:
- Strength bar (visual progress indicator, color-coded)
- Strength level text (Weak, Fair, Good, Strong)
- Criteria checklist (visual feedback for met/unmet criteria)
- Feedback messages

**Handled Interactions**:
- None (receives password as input, purely presentational)

**Handled Validation**:
- Analyzes password strength based on:
  - Length (minimum 8 recommended, Supabase minimum 6)
  - Uppercase letters presence
  - Lowercase letters presence
  - Numbers presence
  - Special characters presence
- Calculates strength score (0-4)
- Displays appropriate feedback

**Types**:
- `PasswordStrengthResult` (strength analysis result)

**Props**:
```typescript
// Input properties
@Input() password: string = '';
@Input() showDetails: boolean = true; // Show/hide criteria checklist
@Input() minLength: number = 8; // Recommended minimum

// No outputs (purely presentational)
```

---

### SuccessMessageComponent

**Component Description**: 
A presentational component that displays a success message after successful registration. It confirms account creation, displays the registered email, provides instructions to verify email, and offers navigation options.

**Main Elements**:
- Success icon/heading
- Confirmation message
- Registered email display
- Verification instruction text
- Resend verification link (optional)
- Navigation button to login or dashboard

**Handled Interactions**:
- Emit event to navigate to dashboard (after user clicks button or verifies email)
- Display resend verification link (optional)

**Handled Validation**:
- None (purely presentational)

**Types**:
- `SignInUserDto` (user data to display)

**Props**:
```typescript
// Input properties
@Input() email: string = '';
@Input() user?: SignInUserDto;
@Input() autoNavigateSeconds?: number; // Optional: auto-navigate after delay

// Output properties
@Output() navigateToDashboard = new EventEmitter<void>();
@Output() resendVerificationEmail = new EventEmitter<string>();
```

---

### FormErrorAlertComponent (Reused from Login)

**Component Description**: 
A reusable presentational component for displaying error messages with proper formatting, icons, and dismissal capabilities. Already exists in the codebase and will be reused.

**Props**:
```typescript
@Input() error: LoginError | null = null;
@Output() onDismiss = new EventEmitter<void>();
```

---

## 5. Types

### New Types to Create or Extend

#### SignUpFormValue (View Model)
Extends form values with password confirmation field:
```typescript
export type SignUpFormValue = {
  email: string;           // User's email address, used for registration
  password: string;        // User's plaintext password
  confirmPassword: string; // Confirmation password field (frontend only)
};
```

#### PasswordStrengthResult (Analysis Model)
Provides password strength analysis:
```typescript
export type PasswordStrengthResult = {
  score: number;                    // 0-4 strength score
  level: 'weak' | 'fair' | 'good' | 'strong';  // Strength level
  feedback: string[];               // Array of improvement suggestions
  criteria: {
    hasMinLength: boolean;          // Meets minimum length (6+ chars)
    hasUppercase: boolean;          // Contains uppercase letters
    hasLowercase: boolean;          // Contains lowercase letters
    hasNumbers: boolean;            // Contains numeric digits
    hasSpecialChars: boolean;       // Contains special characters
  };
};
```

#### RegistrationViewState (Component State)
Manages the complete view state:
```typescript
export type RegistrationViewState = {
  isLoading: boolean;                // True during API call
  error: LoginError | null;          // Current error, if any
  formValue: SignUpFormValue;        // Current form values
  isSuccess: boolean;                // True after successful registration
  registeredEmail: string | null;    // Email used for successful registration
  user: SignInUserDto | null;        // Registered user info from API response
  passwordStrength: PasswordStrengthResult | null; // Current password strength analysis
};
```

### Existing Types (Reused)

From `types.ts`:
- `SignUpRequest`: { email: string; password: string }
- `SignInResponseDto`: { user: SignInUserDto; session: SignInSessionDto }
- `SignInUserDto`: { id: UUID; email: string; email_confirmed_at: string | null }
- `SignInSessionDto`: { access_token: string; refresh_token: string; expires_in: number; token_type: 'bearer' }
- `LoginError`: { code: string; message: string; details?: Record<string, unknown> }
- `ErrorResponseDto`: { error: { code: string; message: string; details?: Record<string, unknown> } }

---

## 6. State Management

### State Location
The `RegistrationComponent` manages all state using simple class properties with change detection strategy `OnPush` for performance optimization.

### State Variables

**In RegistrationComponent**:
```typescript
isLoading: boolean = false;                    // Loading state during API call
error: LoginError | null = null;               // Current error message
formValue: SignUpFormValue = { email: '', password: '', confirmPassword: '' };
isSuccess: boolean = false;                    // Success state after registration
registeredEmail: string | null = null;         // Email registered
user: SignInUserDto | null = null;             // User from API response
sessionData: SignInSessionDto | null = null;   // Session tokens
returnUrl: string = '/dashboard';              // URL to return to after verification
passwordStrength: PasswordStrengthResult | null = null;  // Current password analysis
```

**In RegistrationFormComponent**:
```typescript
formGroup: FormGroup;                          // Reactive form group
emailTouched: boolean = false;                 // Email field touched
passwordTouched: boolean = false;              // Password field touched
confirmPasswordTouched: boolean = false;       // Confirm password field touched
showPasswordStrength: boolean = false;         // Show strength indicator
showPassword: boolean = false;                 // Toggle password visibility
```

### State Flow

1. **Initial State**: Form is empty, no errors, not loading, not success
2. **User Input**: Form values update in real-time, validation feedback updates
3. **Submission**: isLoading set to true, error cleared
4. **API Success**: isSuccess set to true, sessionData stored, user info saved
5. **API Error**: isLoading set to false, error populated
6. **Retry**: Error cleared, isLoading set to true again
7. **Navigation**: Component clears state and navigates

### Custom Hooks / Services

**No custom hooks required** - Angular's built-in reactive forms and RxJS operators are sufficient.

**Services to Inject**:
- `AuthService`: Provides `signUp()` method for API communication
- `Router`: Navigation after registration
- `ActivatedRoute`: Extract query parameters

---

## 7. API Integration

### Endpoint Details

**Method**: POST

**Endpoint**: `/api/auth/sign-up`

**Request Type**: `SignUpRequest`
```typescript
{
  email: string;     // Valid email address, must be unique
  password: string;  // Non-empty password, min 6 chars (enforced by Supabase)
}
```

**Response Type**: `SignInResponseDto`
```typescript
{
  user: {
    id: UUID;                           // Unique user identifier
    email: string;                      // Registered email address
    email_confirmed_at: string | null;  // ISO 8601 timestamp or null (typically null for new registrations)
  },
  session: {
    access_token: string;    // JWT token for authenticating requests
    refresh_token: string;   // Token for obtaining new access tokens
    expires_in: number;      // Seconds until access token expiration (typically 3600)
    token_type: 'bearer';    // Always 'bearer' for HTTP Bearer auth
  }
}
```

### API Call Implementation

**In AuthService** (already exists, may need extension):
```typescript
signUp(request: SignUpRequest): Observable<SignInResponseDto> {
  return this.http.post<SignInResponseDto>(`${this.apiUrl}/auth/sign-up`, request)
    .pipe(
      // Transformation and error handling
    );
}
```

**In RegistrationComponent.onSubmit()**:
```typescript
onSubmit(request: SignUpRequest): void {
  if (this.isLoading) return; // Prevent multiple submissions
  
  this.isLoading = true;
  this.error = null;
  
  this.authService.signUp(request)
    .pipe(
      timeout(10000),                    // 10 second timeout
      takeUntil(this.destroy$),          // Cleanup on component destroy
      catchError((error) => {
        this.isLoading = false;
        this.error = this.mapApiErrorToRegistrationError(error);
        return throwError(() => error);
      })
    )
    .subscribe({
      next: (response) => this.handleRegistrationSuccess(response),
      error: () => {
        // Error already handled in catchError
      }
    });
}
```

### Error Mapping

```typescript
private mapApiErrorToRegistrationError(error: HttpErrorResponse): LoginError {
  // Network error (status 0)
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

  // Email already exists (409)
  if (error.status === 409) {
    return {
      code: 'EMAIL_EXISTS',
      message: 'This email address is already registered. Please sign in instead.',
      details: { field: 'email' }
    };
  }

  // Weak password (422)
  if (error.status === 422) {
    return {
      code: 'WEAK_PASSWORD',
      message: 'Password does not meet strength requirements. Please choose a stronger password.',
      details: { field: 'password' }
    };
  }

  // Rate limited (429)
  if (error.status === 429) {
    const retryAfter = error.error?.error?.details?.retryAfter || 900;
    return {
      code: 'RATE_LIMITED',
      message: `Too many registration attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      details: { retryAfter }
    };
  }

  // Server error (5xx)
  if (error.status >= 500) {
    console.error('Server error during registration:', error);
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
```

### Token Storage

After successful registration:
```typescript
private handleRegistrationSuccess(response: SignInResponseDto): void {
  this.isLoading = false;
  this.error = null;
  
  // Store session tokens (via AuthService)
  this.authService.storeSession(response.session);
  
  // Update component state
  this.user = response.user;
  this.registeredEmail = response.user.email;
  this.sessionData = response.session;
  this.isSuccess = true;
  this.formValue = { email: '', password: '', confirmPassword: '' };
}
```

---

## 8. User Interactions

### Interaction Flows

**1. User Enters Email**
- Trigger: Input change in email field
- Expected: Real-time validation feedback
- Validation: Check format (RFC 5322)
- Feedback: Show checkmark if valid, error if invalid
- Effect: Debounce validation (300ms)

**2. User Enters Password**
- Trigger: Input change in password field
- Expected: Real-time password strength indicator update
- Validation: Analyze against criteria (length, case, numbers, special chars)
- Feedback: Show strength bar, level text, criteria checklist
- Effect: Instant feedback, no debounce

**3. User Enters Confirm Password**
- Trigger: Input change in confirm password field
- Expected: Real-time match validation
- Validation: Compare with password field
- Feedback: Show checkmark if match, error if mismatch
- Effect: Instant feedback

**4. User Clicks "Sign Up" Button**
- Trigger: Button click or Enter key in form
- Prerequisites: All fields valid, not already loading
- Expected: Form submits, loading overlay shows
- Validation: 
  - Email format valid
  - Email not empty
  - Password not empty
  - Passwords match
  - All fields touched for display errors
- Effect: Disable button, show loading spinner, call API

**5. API Returns 201 Created (Success)**
- Trigger: Successful API response
- Expected: Success message displays, instructions to verify email
- Feedback: Show registered email, resend link option
- Effect: Form hidden, success component visible, tokens stored

**6. API Returns 409 (Email Already Registered)**
- Trigger: Email already exists error from API
- Expected: Error message shows, link to sign in appears
- Feedback: "This email is already registered. Please sign in instead."
- Effect: Form remains visible, error persists until dismissed or cleared

**7. API Returns 400 (Validation Error)**
- Trigger: Invalid input format, missing fields, or other validation failure
- Expected: Relevant field error shows
- Feedback: Display API error message under affected field
- Effect: Form remains visible for correction

**8. API Returns 422 (Weak Password)**
- Trigger: Password doesn't meet Supabase strength requirements
- Expected: Password field shows error
- Feedback: "Password does not meet strength requirements"
- Effect: Form remains visible, user can strengthen password

**9. API Returns 429 (Rate Limited)**
- Trigger: Too many registration attempts in short time
- Expected: Error message with retry time
- Feedback: "Too many attempts. Please try again in X minutes."
- Effect: Form disabled, button disabled until retry window passes

**10. API Returns 500 (Server Error)**
- Trigger: Unexpected server error
- Expected: Generic error message shows
- Feedback: "An unexpected error occurred. Please try again later."
- Effect: Form remains visible, user can retry

**11. User Clicks "Sign In" Link**
- Trigger: Link click at bottom of form
- Expected: Navigate to login page
- Effect: Router navigates to `/login`

**12. User Dismisses Error Alert**
- Trigger: Click dismiss button on error alert
- Expected: Error message disappears
- Effect: Error cleared, form remains visible for retry

**13. User Clicks "Go to Dashboard" (After Success)**
- Trigger: Button click on success message
- Expected: Navigate to dashboard
- Effect: Router navigates to dashboard, but auth guard may still require email verification

**14. User Clicks "Resend Verification Email"**
- Trigger: Link click on success message (optional feature)
- Expected: Verification email resent to registered address
- Effect: Show confirmation, disable link temporarily

---

## 9. Conditions and Validation

### Frontend Validation Conditions

#### Email Field Validation
**Condition**: Email must be a valid email format
- **When**: Real-time as user types (after debounce)
- **Check**: Regex pattern matches RFC 5322 simplified format
- **Affected Components**: RegistrationFormComponent email input field
- **Visual Feedback**: Error icon + message under field if invalid; checkmark if valid
- **Effect on State**: Email field error state, submit button enable/disable
- **Regex Pattern**: `^[^\s@]+@[^\s@]+\.[^\s@]+$` or Angular's Email validator

**Condition**: Email must not be empty
- **When**: On form submission attempt
- **Check**: Email length > 0
- **Affected Components**: Form submit, email field
- **Visual Feedback**: Required error message appears
- **Effect on State**: Form validity, submit button disabled

#### Password Field Validation
**Condition**: Password must not be empty
- **When**: On form submission attempt
- **Check**: Password length > 0
- **Affected Components**: Form submit, password field
- **Visual Feedback**: Required error message appears
- **Effect on State**: Form validity, submit button disabled

**Condition**: Password strength must be adequate
- **When**: Real-time as user types (no debounce)
- **Check**: Analyze against strength criteria
  - Minimum 6 characters (Supabase enforced, frontend recommends 8)
  - Contains uppercase letters
  - Contains lowercase letters
  - Contains numbers
  - Contains special characters (recommended but not required)
- **Affected Components**: RegistrationFormComponent password field, PasswordStrengthIndicator
- **Visual Feedback**: Strength bar (color-coded), level text, criteria checklist
- **Effect on State**: Strength indicator updates, can be informational or block submission

#### Confirm Password Field Validation
**Condition**: Confirm password must match password field
- **When**: Real-time as user types (debounce 200ms)
- **Check**: confirmPassword === password (exact string match)
- **Affected Components**: Confirm password input field
- **Visual Feedback**: Error message if mismatch, checkmark if match
- **Effect on State**: Confirm password field error state, submit button enable/disable

**Condition**: Confirm password must not be empty
- **When**: On form submission attempt
- **Check**: confirmPassword length > 0
- **Affected Components**: Form submit, confirm password field
- **Visual Feedback**: Required error message appears
- **Effect on State**: Form validity, submit button disabled

#### Form-Level Validation
**Condition**: All fields must be valid before submission
- **When**: Continuously as user types
- **Check**: All field validations pass AND no validation errors exist
- **Affected Components**: Sign-up button
- **Visual Feedback**: Button disabled if form invalid, enabled if valid
- **Effect on State**: Submit button enable/disable

**Condition**: Passwords must match before submission
- **When**: Checked during form submission
- **Check**: password === confirmPassword
- **Affected Components**: Form, confirm password field
- **Visual Feedback**: Error message if mismatch prevents submission
- **Effect on State**: Block API call, show error

### API Response Validation Conditions

#### Success Response (201 Created)
**Condition**: Response must contain valid user and session data
- **When**: After successful API call
- **Check**: 
  - status === 201
  - response.user exists with id, email
  - response.session exists with access_token, refresh_token
- **Affected Components**: RegistrationComponent
- **Visual Feedback**: Success message component displays
- **Effect on State**: isSuccess = true, tokens stored, form hidden

#### Email Already Registered (409 Conflict)
**Condition**: Email address already exists in system
- **When**: API returns 409 status
- **Check**: error.status === 409
- **Affected Components**: RegistrationComponent, error alert
- **Visual Feedback**: Error message "Email already registered. Please sign in instead."
- **Effect on State**: error populated with EMAIL_EXISTS code, form remains visible

#### Validation Error (400 Bad Request)
**Condition**: Input validation failed (invalid email, empty password, etc.)
- **When**: API returns 400 status
- **Check**: error.status === 400
- **Affected Components**: RegistrationComponent, error alert, specific form fields
- **Visual Feedback**: Error message from API displayed in alert
- **Effect on State**: error populated with VALIDATION_ERROR code, form remains for correction

#### Weak Password (422 Unprocessable Entity)
**Condition**: Password doesn't meet Supabase strength requirements
- **When**: API returns 422 status
- **Check**: error.status === 422
- **Affected Components**: RegistrationComponent, password field, error alert
- **Visual Feedback**: Error message "Password does not meet strength requirements"
- **Effect on State**: error populated with WEAK_PASSWORD code, form remains for password update

#### Rate Limited (429 Too Many Requests)
**Condition**: Too many registration attempts from same IP/email in time window
- **When**: API returns 429 status
- **Check**: error.status === 429
- **Affected Components**: RegistrationComponent, form, submit button
- **Visual Feedback**: Error message with retry time "Try again in X minutes"
- **Effect on State**: error populated with RATE_LIMITED code, form/button disabled until retry window

#### Server Error (5xx)
**Condition**: Server encountered unexpected error
- **When**: API returns 500+ status
- **Check**: error.status >= 500
- **Affected Components**: RegistrationComponent, error alert
- **Visual Feedback**: Generic error message "Unexpected error. Try again later."
- **Effect on State**: error populated with SERVER_ERROR code, form remains for retry

#### Network Error (status 0)
**Condition**: Network connectivity issue
- **When**: API call fails with status 0 (network timeout)
- **Check**: error.status === 0
- **Affected Components**: RegistrationComponent, error alert
- **Visual Feedback**: Error message "Network connection error"
- **Effect on State**: error populated with NETWORK_ERROR code, form remains for retry

---

## 10. Error Handling

### Error Scenarios and Handling Strategies

#### Scenario 1: Invalid Email Format
**Trigger**: User enters "notanemail" or similar
**Frontend Detection**: Real-time regex validation
**User Experience**:
- Red error icon appears next to email field
- Error message: "Please enter a valid email address"
- Submit button remains disabled
- User can correct input immediately

**Handling Code**:
```typescript
// In RegistrationFormComponent
emailFormControl = new FormControl('', [
  Validators.required,
  Validators.email
]);
```

#### Scenario 2: Email Already Registered (409)
**Trigger**: User submits with email that already exists
**API Response**: 409 Conflict with code "EMAIL_EXISTS"
**User Experience**:
- Loading spinner disappears
- Error alert displays: "This email is already registered. Please sign in instead."
- Optional link to sign-in page appears
- Form remains visible and enabled
- User can try different email or navigate to login

**Handling Code**:
```typescript
if (error.status === 409) {
  this.error = {
    code: 'EMAIL_EXISTS',
    message: 'This email address is already registered. Please sign in instead.',
    details: { field: 'email', action: 'sign-in' }
  };
}
```

#### Scenario 3: Weak Password (422)
**Trigger**: User enters password that doesn't meet strength requirements
**API Response**: 422 Unprocessable Entity with code "WEAK_PASSWORD"
**User Experience**:
- Loading spinner disappears
- Error alert displays: "Password does not meet strength requirements"
- Password strength indicator shows current level
- Form remains visible and enabled
- User can strengthen password and resubmit

**Handling Code**:
```typescript
if (error.status === 422) {
  this.error = {
    code: 'WEAK_PASSWORD',
    message: 'Password does not meet strength requirements. Please choose a stronger password.',
    details: { field: 'password' }
  };
}
```

#### Scenario 4: Passwords Don't Match
**Trigger**: User enters different values in password and confirm password
**Frontend Detection**: Real-time validation on confirm password field
**User Experience**:
- Red error icon appears next to confirm password field
- Error message: "Passwords do not match"
- Submit button remains disabled
- User can correct confirm password
- Error disappears when fields match

**Handling Code**:
```typescript
// Custom validator for password match
passwordMatchValidator = (fg: FormGroup) => {
  return fg.get('password')?.value === fg.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
};
```

#### Scenario 5: Rate Limited (429)
**Trigger**: User (same IP) attempts sign-up 11+ times in 15 minutes
**API Response**: 429 Too Many Requests with retry-after info
**User Experience**:
- Loading spinner disappears
- Error alert displays: "Too many attempts. Please try again in X minutes."
- Submit button disabled for the duration
- Form remains visible but non-functional
- User must wait before trying again

**Handling Code**:
```typescript
if (error.status === 429) {
  const retryAfter = error.error?.error?.details?.retryAfter || 900;
  this.error = {
    code: 'RATE_LIMITED',
    message: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
    details: { retryAfter }
  };
  // Disable form
  this.formGroup.disable();
  // Optional: Re-enable after retry window
  setTimeout(() => this.formGroup.enable(), retryAfter * 1000);
}
```

#### Scenario 6: Network Error (Connection Lost)
**Trigger**: Network connection lost during API call
**Frontend Detection**: HTTP error with status 0
**User Experience**:
- Loading spinner disappears
- Error alert displays: "Network error. Check your internet connection."
- Form remains visible and enabled
- User can retry once connection is restored

**Handling Code**:
```typescript
if (error.status === 0) {
  this.error = {
    code: 'NETWORK_ERROR',
    message: 'Network connection error. Please check your internet connection.'
  };
}
```

#### Scenario 7: Server Error (500+)
**Trigger**: Backend server encounters unexpected error
**API Response**: 500+ Internal Server Error
**User Experience**:
- Loading spinner disappears
- Error alert displays: "An unexpected error occurred. Please try again later."
- Form remains visible and enabled
- User can retry submission
- Error is logged to console for debugging

**Handling Code**:
```typescript
if (error.status >= 500) {
  console.error('Server error during registration:', error);
  this.error = {
    code: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.'
  };
}
```

#### Scenario 8: Validation Error (400)
**Trigger**: Missing fields, malformed request, etc.
**API Response**: 400 Bad Request with validation details
**User Experience**:
- Loading spinner disappears
- Error alert displays with specific validation message
- Form remains visible for correction
- User can correct input and retry

**Handling Code**:
```typescript
if (error.status === 400) {
  const apiError = error.error?.error;
  this.error = {
    code: 'VALIDATION_ERROR',
    message: apiError?.message || 'Invalid input',
    details: apiError?.details
  };
}
```

#### Scenario 9: Multiple Submissions
**Trigger**: User rapid-clicks submit button
**Prevention**: Check isLoading flag before allowing submission
**User Experience**:
- First click initiates request, button disabled
- Subsequent clicks ignored
- Loading spinner shows
- Once response received, button re-enabled

**Handling Code**:
```typescript
onSubmit(request: SignUpRequest): void {
  if (this.isLoading) return; // Prevent multiple submissions
  // ... rest of submission logic
}
```

#### Scenario 10: Timeout (Long Request)
**Trigger**: API response takes longer than timeout threshold
**Timeout Duration**: 10 seconds
**User Experience**:
- Spinner stops after timeout
- Generic error message displays
- Form remains visible for retry

**Handling Code**:
```typescript
this.authService.signUp(request)
  .pipe(
    timeout(10000), // 10 second timeout
    catchError(error => {
      if (error.name === 'TimeoutError') {
        this.error = {
          code: 'NETWORK_ERROR',
          message: 'Request timed out. Please try again.'
        };
      }
      return throwError(() => error);
    })
  )
```

### Error Recovery Strategies

1. **Retry Mechanism**: Form remains visible and enabled; user can attempt submission again
2. **Error Dismissal**: Dismiss button clears error for clean form state
3. **Exponential Backoff**: Frontend could implement retry with increasing delays
4. **Rate Limit Handling**: Disable form temporarily, re-enable after retry window
5. **Helpful Links**: For EMAIL_EXISTS error, provide link to sign-in page
6. **Form State Preservation**: Keep form values if retrying same request

---

## 11. Implementation Steps

### Step 1: Create Types and Models

1. **Update `src/types.ts`** to add new registration-specific types:
   - Add `SignUpFormValue` type with email, password, confirmPassword
   - Add `PasswordStrengthResult` type with score, level, feedback, criteria
   - Add `RegistrationViewState` type for overall state management

**File**: `src/types.ts`
**Action**: Add types after existing auth types

```typescript
// Add to types.ts after SignInResponseDto

export type SignUpFormValue = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type PasswordStrengthResult = {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  criteria: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
};

export type RegistrationViewState = {
  isLoading: boolean;
  error: LoginError | null;
  formValue: SignUpFormValue;
  isSuccess: boolean;
  registeredEmail: string | null;
  user: SignInUserDto | null;
  passwordStrength: PasswordStrengthResult | null;
};
```

### Step 2: Create Password Strength Analysis Utility

1. **Create `src/app/utils/password-strength.ts`** for password analysis logic

**File**: `src/app/utils/password-strength.ts`
**Action**: Create new utility file with password strength analyzer

```typescript
import { PasswordStrengthResult } from '../../types';

export class PasswordStrengthAnalyzer {
  static analyze(password: string): PasswordStrengthResult {
    const criteria = {
      hasMinLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    let score = 0;
    Object.values(criteria).forEach(met => {
      if (met) score++;
    });

    const level = this.scoreToLevel(score);
    const feedback = this.generateFeedback(criteria);

    return { score, level, feedback, criteria };
  }

  private static scoreToLevel(score: number): 'weak' | 'fair' | 'good' | 'strong' {
    if (score <= 1) return 'weak';
    if (score <= 2) return 'fair';
    if (score <= 3) return 'good';
    return 'strong';
  }

  private static generateFeedback(criteria: Record<string, boolean>): string[] {
    const feedback = [];
    if (!criteria.hasMinLength) feedback.push('At least 6 characters');
    if (!criteria.hasUppercase) feedback.push('Include uppercase letter');
    if (!criteria.hasLowercase) feedback.push('Include lowercase letter');
    if (!criteria.hasNumbers) feedback.push('Include a number');
    if (!criteria.hasSpecialChars) feedback.push('Include special character');
    return feedback;
  }
}
```

### Step 3: Extend AuthService with signUp Method

1. **Update `src/app/services/auth.service.ts`** to add signUp method

**File**: `src/app/services/auth.service.ts`
**Action**: Add signUp method to existing service

```typescript
signUp(request: SignUpRequest): Observable<SignInResponseDto> {
  return this.http.post<SignInResponseDto>(`${this.apiUrl}/auth/sign-up`, request)
    .pipe(
      tap(response => {
        console.log('Sign-up successful:', response.user.email);
        // Store session in auth service
        this.storeSession(response.session);
      })
    );
}

private storeSession(session: SignInSessionDto): void {
  // Store tokens (implementation depends on token strategy)
  // Option 1: localStorage
  localStorage.setItem('access_token', session.access_token);
  localStorage.setItem('refresh_token', session.refresh_token);
  // Option 2: HTTP-only cookie (preferred, handled by backend)
}
```

### Step 4: Create PasswordStrengthIndicatorComponent

1. **Create `src/app/views/registration/components/password-strength-indicator/password-strength-indicator.component.ts`**
2. **Create `src/app/views/registration/components/password-strength-indicator/password-strength-indicator.component.html`**
3. **Create `src/app/views/registration/components/password-strength-indicator/password-strength-indicator.component.scss`**

**Purpose**: Display visual password strength feedback

**Template Structure**:
- Strength bar (color-coded by level)
- Strength text (Weak/Fair/Good/Strong)
- Criteria checklist (if showDetails true)

### Step 5: Create SuccessMessageComponent

1. **Create `src/app/views/registration/components/success-message/success-message.component.ts`**
2. **Create `src/app/views/registration/components/success-message/success-message.component.html`**
3. **Create `src/app/views/registration/components/success-message/success-message.component.scss`**

**Purpose**: Display success message after registration

**Template Structure**:
- Success icon/heading
- Confirmation message with registered email
- Instructions to verify email
- Link to resend verification (optional)
- Navigation button (auto-navigate or manual)

### Step 6: Create RegistrationFormComponent

1. **Create `src/app/views/registration/components/registration-form/registration-form.component.ts`**
2. **Create `src/app/views/registration/components/registration-form/registration-form.component.html`**
3. **Create `src/app/views/registration/components/registration-form/registration-form.component.scss`**

**Purpose**: Display registration form with email, password, confirm password fields

**Key Features**:
- Reactive form with FormGroup
- Real-time validation for all fields
- Email format validation
- Password strength analysis with visual feedback
- Password match validation
- Error messages for each field
- Submit button with loading state
- Link to login page

**Component Structure**:

```typescript
export class RegistrationFormComponent implements OnInit, OnDestroy {
  @Input() isLoading: boolean = false;
  @Input() error: LoginError | null = null;

  @Output() onSubmit = new EventEmitter<SignUpRequest>();
  @Output() onErrorDismiss = new EventEmitter<void>();
  @Output() navigateToLogin = new EventEmitter<void>();

  formGroup!: FormGroup;
  passwordStrength: PasswordStrengthResult | null = null;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.formGroup = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(1)]),
      confirmPassword: new FormControl('', [Validators.required])
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    if (!(group instanceof FormGroup)) return null;
    const pwd = group.get('password');
    const confirmPwd = group.get('confirmPassword');
    return pwd && confirmPwd && pwd.value === confirmPwd.value ? null : { passwordMismatch: true };
  }

  onPasswordChange(password: string): void {
    this.passwordStrength = PasswordStrengthAnalyzer.analyze(password);
  }

  submit(): void {
    if (this.formGroup.invalid || this.isLoading) return;

    const request: SignUpRequest = {
      email: this.formGroup.get('email')?.value,
      password: this.formGroup.get('password')?.value
    };

    this.onSubmit.emit(request);
  }
}
```

### Step 7: Create RegistrationComponent (Main Container)

1. **Create `src/app/views/registration/registration.component.ts`**
2. **Create `src/app/views/registration/registration.component.html`**
3. **Create `src/app/views/registration/registration.component.scss`**

**Purpose**: Main container component orchestrating registration flow

**Key Features**:
- State management for registration flow
- API error handling and mapping
- Token storage
- Navigation after success
- Loading state management
- Cleanup on component destroy

**Component Structure**:

```typescript
@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, RegistrationFormComponent, SuccessMessageComponent, RouterLink],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  isLoading: boolean = false;
  error: LoginError | null = null;
  isSuccess: boolean = false;
  registeredEmail: string | null = null;
  user: SignInUserDto | null = null;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(request: SignUpRequest): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = null;

    this.authService.signUp(request)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError((error) => {
          this.isLoading = false;
          this.error = this.mapApiErrorToRegistrationError(error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (response) => this.handleRegistrationSuccess(response),
        error: () => {}
      });
  }

  private handleRegistrationSuccess(response: SignInResponseDto): void {
    this.isLoading = false;
    this.user = response.user;
    this.registeredEmail = response.user.email;
    this.isSuccess = true;
    this.error = null;
  }

  private mapApiErrorToRegistrationError(error: HttpErrorResponse): LoginError {
    // Implementation of error mapping (see Error Handling section)
  }

  onErrorDismiss(): void {
    this.error = null;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  onNavigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
```

### Step 8: Add Registration Route to App Routes

1. **Update `src/app/app.routes.ts`** to add registration route

**File**: `src/app/app.routes.ts`
**Action**: Add registration route before dashboard route (to avoid auth guard interception)

```typescript
export const routes: Routes = [
  // ... existing routes
  {
    path: 'register',
    component: RegistrationComponent,
    data: { title: 'Register - LifeSync' }
  },
  // ... other routes
];
```

### Step 9: Add Registration Link to Login Component

1. **Update `src/app/views/login/login.component.html`** to add link to registration page

**File**: `src/app/views/login/login.component.html`
**Action**: Add link at bottom of login form

```html
<div class="text-center mt-4">
  Don't have an account?
  <a routerLink="/register" class="text-blue-600 hover:underline">Create one here</a>
</div>
```

### Step 10: Add Registration Link to Registration Component

1. **Update `src/app/views/registration/registration.component.html`** to add link to login page

**File**: `src/app/views/registration/registration.component.html`
**Action**: Add link at bottom of registration form

```html
<div class="text-center mt-4">
  Already have an account?
  <a (click)="navigateToLogin()" class="text-blue-600 hover:underline cursor-pointer">Sign in here</a>
</div>
```

### Step 11: Create Component Templates

#### RegistrationFormComponent Template

**File**: `src/app/views/registration/components/registration-form/registration-form.component.html`

```html
<div class="registration-form-container">
  <!-- Error Alert -->
  <app-form-error-alert 
    [error]="error"
    (onDismiss)="onErrorDismiss.emit()">
  </app-form-error-alert>

  <!-- Form -->
  <form [formGroup]="formGroup" (ngSubmit)="submit()" class="space-y-4">
    <!-- Email Field -->
    <div>
      <label nz-form-label [nzRequired]="true">Email Address</label>
      <input 
        nz-input 
        formControlName="email" 
        placeholder="your@email.com"
        type="email"
        (blur)="emailTouched = true"
        class="w-full"
      />
      <div class="text-red-500 text-sm mt-1" *ngIf="formGroup.get('email')?.errors?.['required'] && emailTouched">
        Email is required
      </div>
      <div class="text-red-500 text-sm mt-1" *ngIf="formGroup.get('email')?.errors?.['email'] && emailTouched">
        Please enter a valid email address
      </div>
    </div>

    <!-- Password Field -->
    <div>
      <label nz-form-label [nzRequired]="true">Password</label>
      <input 
        nz-input 
        formControlName="password" 
        placeholder="Enter password"
        [type]="showPassword ? 'text' : 'password'"
        (input)="onPasswordChange($event.target.value)"
        (blur)="passwordTouched = true"
        class="w-full"
      />
      <div class="text-red-500 text-sm mt-1" *ngIf="formGroup.get('password')?.errors?.['required'] && passwordTouched">
        Password is required
      </div>
    </div>

    <!-- Password Strength Indicator -->
    <app-password-strength-indicator 
      *ngIf="formGroup.get('password')?.value"
      [password]="formGroup.get('password')?.value"
      [showDetails]="true">
    </app-password-strength-indicator>

    <!-- Confirm Password Field -->
    <div>
      <label nz-form-label [nzRequired]="true">Confirm Password</label>
      <input 
        nz-input 
        formControlName="confirmPassword" 
        placeholder="Confirm password"
        [type]="showConfirmPassword ? 'text' : 'password'"
        (blur)="confirmPasswordTouched = true"
        class="w-full"
      />
      <div class="text-red-500 text-sm mt-1" *ngIf="formGroup.get('confirmPassword')?.errors?.['required'] && confirmPasswordTouched">
        Confirm password is required
      </div>
      <div class="text-red-500 text-sm mt-1" *ngIf="formGroup.errors?.['passwordMismatch'] && confirmPasswordTouched">
        Passwords do not match
      </div>
    </div>

    <!-- Sign Up Button -->
    <button 
      nz-button 
      nzType="primary" 
      nzBlock
      [disabled]="formGroup.invalid || isLoading"
      type="submit"
      class="mt-6">
      <span *ngIf="!isLoading">Create Account</span>
      <span *ngIf="isLoading">
        <nz-spin nzSimple [nzSize]="'small'"></nz-spin>
        Creating...
      </span>
    </button>
  </form>

  <!-- Sign In Link -->
  <div class="text-center mt-4 text-gray-600">
    Already have an account?
    <a (click)="navigateToLogin.emit()" class="text-blue-600 hover:underline cursor-pointer">
      Sign in
    </a>
  </div>
</div>
```

#### SuccessMessageComponent Template

**File**: `src/app/views/registration/components/success-message/success-message.component.html`

```html
<div class="success-message-container text-center">
  <!-- Success Icon -->
  <i nz-icon nzType="check-circle" nzTheme="fill" class="text-green-500 text-5xl mb-4"></i>

  <!-- Heading -->
  <h2 class="text-2xl font-bold mb-2">Account Created Successfully!</h2>

  <!-- Email Confirmation Message -->
  <p class="text-gray-600 mb-4">
    A verification link has been sent to <strong>{{ email }}</strong>
  </p>

  <!-- Instructions -->
  <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
    <p class="text-sm text-gray-700">
      <strong>Next step:</strong> Check your email inbox and click the verification link to activate your account. 
      Once verified, you'll have full access to LifeSync.
    </p>
  </div>

  <!-- Resend Link (Optional) -->
  <p class="text-sm text-gray-500 mb-6">
    Didn't receive the email?
    <a (click)="resendVerificationEmail.emit(email)" class="text-blue-600 hover:underline cursor-pointer">
      Resend verification link
    </a>
  </p>

  <!-- Navigation Buttons -->
  <div class="space-y-2">
    <button 
      nz-button 
      nzType="primary" 
      nzBlock
      (click)="navigateToDashboard.emit()"
      class="mt-4">
      Go to Dashboard
    </button>
  </div>
</div>
```

#### PasswordStrengthIndicatorComponent Template

**File**: `src/app/views/registration/components/password-strength-indicator/password-strength-indicator.component.html`

```html
<div class="password-strength-container mt-2" *ngIf="strengthResult">
  <!-- Strength Bar -->
  <div class="strength-bar-wrapper">
    <div class="strength-bar" [ngClass]="'strength-' + strengthResult.level">
      <div class="strength-progress" [style.width]="(strengthResult.score / 4) * 100 + '%'"></div>
    </div>
  </div>

  <!-- Strength Text -->
  <div class="text-sm mt-2" [ngClass]="getStrengthTextClass(strengthResult.level)">
    Strength: <strong>{{ strengthResult.level | titlecase }}</strong>
  </div>

  <!-- Criteria Details (if showDetails) -->
  <div class="criteria-list mt-3 text-sm" *ngIf="showDetails">
    <div class="criteria-item" *ngFor="let criterion of getCriteria()"
         [ngClass]="criterion.met ? 'text-green-600' : 'text-gray-400'">
      <i nz-icon 
         [nzType]="criterion.met ? 'check-circle' : 'exclamation-circle'" 
         class="mr-2">
      </i>
      {{ criterion.label }}
    </div>
  </div>

  <!-- Feedback (Remaining criteria) -->
  <div class="feedback mt-3" *ngIf="strengthResult.feedback.length > 0">
    <p class="text-xs text-gray-500">To strengthen: {{ strengthResult.feedback.join(', ') }}</p>
  </div>
</div>
```

### Step 12: Create Component Styles

Create SCSS files for styling components:
- `registration-form.component.scss`
- `success-message.component.scss`
- `password-strength-indicator.component.scss`

Ensure styles follow Tailwind conventions and align with existing LifeSync design patterns.

### Step 13: Add Form Validations and Error Handling

Implement comprehensive error handling in RegistrationComponent based on error mapping (see Error Handling section).

### Step 14: Test All Scenarios

1. **Unit Tests** for components
   - Form validation logic
   - Password strength analyzer
   - Error mapping

2. **Integration Tests**
   - Full registration flow
   - API error scenarios
   - Token storage
   - Navigation

3. **Manual Testing**
   - Successfully register with new email
   - Try duplicate email registration
   - Enter weak password
   - Enter mismatched confirm password
   - Test rate limiting
   - Test network error handling

### Step 15: Update App Configuration (if needed)

1. Ensure auth interceptor includes registration route in public routes
2. Ensure auth guard doesn't block `/register` route
3. Configure email verification flow with backend

### Step 16: Update Navigation in App Component

1. **Update `src/app/app.component.html`** if needed to show registration link before authentication

### Step 17: Documentation

1. Create user-facing documentation for registration flow
2. Add comments to complex validation logic
3. Update team wiki/runbook with implementation details
4. Document password strength requirements

---

## Implementation Checklist

- [ ] Update types.ts with new registration types (SignUpFormValue, PasswordStrengthResult, RegistrationViewState)
- [ ] Create password strength analyzer utility (src/app/utils/password-strength.ts)
- [ ] Add signUp method to AuthService
- [ ] Create PasswordStrengthIndicatorComponent (TS, HTML, SCSS)
- [ ] Create SuccessMessageComponent (TS, HTML, SCSS)
- [ ] Create RegistrationFormComponent (TS, HTML, SCSS) with reactive form
- [ ] Create RegistrationComponent (TS, HTML, SCSS) as main container
- [ ] Add registration route to app.routes.ts
- [ ] Add registration link to LoginComponent
- [ ] Implement comprehensive error handling and mapping
- [ ] Implement token storage logic
- [ ] Create unit tests for all components
- [ ] Create integration tests for registration flow
- [ ] Test successful registration with new email (expect 201)
- [ ] Test duplicate email registration (expect 409)
- [ ] Test weak password error (expect 422)
- [ ] Test invalid email format (expect 400)
- [ ] Test password mismatch validation
- [ ] Test rate limiting (expect 429 after 10 attempts)
- [ ] Test network error handling
- [ ] Test loading state during API call
- [ ] Test success message display and navigation
- [ ] Test form field validation and real-time feedback
- [ ] Test password strength indicator accuracy
- [ ] Test password visibility toggle
- [ ] Verify email verification flow integration
- [ ] Verify token storage and retrieval
- [ ] Test navigation to login from registration
- [ ] Test navigation to dashboard after success
- [ ] Test accessibility (keyboard navigation, screen reader support)
- [ ] Test mobile responsiveness
- [ ] Create documentation/runbook
- [ ] Deploy to staging environment
- [ ] QA testing in staging
- [ ] Deploy to production

---
