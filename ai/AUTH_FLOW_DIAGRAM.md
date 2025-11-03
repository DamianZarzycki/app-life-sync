# LifeSync Authentication Flow Diagram

## Complete Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
│   (User)     │
└──────────────┘
       │
       │ 1. Navigate to /dashboard
       ▼
┌──────────────────────────────────────────────────────┐
│              Angular Router                          │
│  ┌────────────────────────────────────────────────┐  │
│  │ Route Activation Check                         │  │
│  │ canActivate: [authGuard]                       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
       │
       │ 2. Auth Guard runs
       ▼
┌──────────────────────────────────────────────────────┐
│              Auth Guard (NEW)                        │
│  src/app/guards/auth.guard.ts                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ export const authGuard: CanActivateFn = (...) │  │
│  │  └─ Check: isAuthenticated()                  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
       │
       ├─────────────────────┬──────────────────────┐
       │                     │                      │
       │ Authenticated       │ Not Authenticated    │
       │ (token exists)      │ (no token)           │
       ▼                     ▼                      ▼
   ALLOW              CREATE URLTREE          ┌──────────────┐
   NAVIGATION         /login?returnUrl=...    │   REDIRECT   │
       │                     │                │   to /login  │
       │                     └─────────────────┘              │
       ▼                                                       ▼
┌──────────────────────────┐                    ┌──────────────────────┐
│  Dashboard Loads         │                    │  Login Component     │
│  (Protected Route)       │                    │  (Public Route)      │
└──────────────────────────┘                    └──────────────────────┘
       │                                              │
       │                                              │ 3. User enters credentials
       │                                              ▼
       │                                        ┌──────────────────────┐
       │                                        │  Login Form          │
       │                                        │  - Email input       │
       │                                        │  - Password input    │
       │                                        │  - Sign In button    │
       │                                        └──────────────────────┘
       │                                              │
       │                                              │ 4. Form submitted
       │                                              ▼
       │                                        ┌──────────────────────┐
       │                                        │  AuthService.signIn()│
       │                                        │  POST /api/auth/...  │
       │                                        └──────────────────────┘
       │                                              │
       │                          ┌───────────────────┴────────────────┐
       │                          │                                    │
       │                          │ 5a. Success                  5b. Error
       │                          ▼                                    ▼
       │                    ┌──────────────┐              ┌──────────────────┐
       │                    │ Store Tokens │              │ Show Error       │
       │                    │ - access_    │              │ - Invalid creds  │
       │                    │   token      │              │ - Unverified     │
       │                    │ - refresh_   │              │ - Rate limited   │
       │                    │   token      │              │ - Network error  │
       │                    │ - user_id    │              │ - Server error   │
       │                    │ - user_email │              └──────────────────┘
       │                    └──────────────┘                     │
       │                          │                              │
       │                          ▼                              │ Retry
       │                    ┌──────────────────┐                │
       │                    │ Verify Email?    │◄───────────────┘
       │                    │ email_confirmed_ │
       │                    │ at !== null      │
       │                    └──────────────────┘
       │                          │
       │              ┌───────────┴──────────┐
       │              │                      │
       │        Verified            Not Verified
       │              │                      │
       │              ▼                      ▼
       │         ┌────────────┐    ┌──────────────────┐
       │         │ Get        │    │ Show Error:      │
       │         │ returnUrl  │    │ "Verify Email"   │
       │         │ from route │    │ + Resend Button  │
       │         │ params     │    └──────────────────┘
       │         └────────────┘
       │              │
       │              ▼
       │         ┌──────────────────┐
       │         │ Navigate to:     │
       │         │ returnUrl or /..│
       │         │ dashboard       │
       │         └──────────────────┘
       │              │
       ├──────────────┘
       ▼
┌──────────────────────┐
│  Dashboard Loads     │
│  User is logged in   │
└──────────────────────┘
       │
       │ 6. API requests with token
       ▼
┌──────────────────────────────────────────────────────┐
│              HTTP Interceptor                        │
│  src/app/interceptors/auth.interceptor.ts            │
│  ┌────────────────────────────────────────────────┐  │
│  │ Attach token: Authorization: Bearer <token>   │  │
│  │ Handle 401: Clear tokens → Redirect to login  │  │
│  │ Handle timeout: 30 seconds                    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│              Backend API                             │
│  POST /api/auth/sign-in                              │
│  GET /api/dashboard                                  │
│  (Other authenticated endpoints)                     │
└──────────────────────────────────────────────────────┘
```

---

## Component Relationship Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     APPLICATION ROUTES                         │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  /login (PUBLIC - No Auth Guard)                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  LoginComponent                                                │ │
│  │  ├── LoginFormComponent (Presentational)                      │ │
│  │  │   ├── FormErrorAlertComponent                             │ │
│  │  │   ├── Email Input (NzInput)                               │ │
│  │  │   ├── Password Input (NzInput)                            │ │
│  │  │   └── VerifyEmailPromptComponent (Conditional)            │ │
│  │  └── Registration Link                                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           │ POST /api/auth/sign-in
                           │ (AuthService)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  /dashboard (PROTECTED - Auth Guard)                                │
│  canActivate: [authGuard] ◄─── NEW!                                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  DashboardComponent                                            │ │
│  │  ├── Dashboard Header                                          │ │
│  │  ├── Category Cards                                            │ │
│  │  ├── Progress Bars                                             │ │
│  │  └── Report History                                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  / (ROOT - PROTECTED - Auth Guard)                                  │
│  canActivate: [authGuard] ◄─── NEW!                                 │
│  Redirects to: /dashboard                                           │
└─────────────────────────────────────────────────────────────────────┘


SERVICES LAYER
──────────────

┌────────────────────────────────────────────────────────────┐
│  AuthService (src/app/services/auth.service.ts)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Signals:                                            │  │
│  │  - accessToken (from localStorage)                  │  │
│  │  - refreshToken                                     │  │
│  │  - userId                                           │  │
│  │  - userEmail                                        │  │
│  │                                                      │  │
│  │  Methods:                                            │  │
│  │  - signIn(email, password)          ◄─ Used by Login│  │
│  │  - isAuthenticated()                ◄─ Used by Guard│  │
│  │  - getAccessToken()                 ◄─ Used by Auth │  │
│  │  - logout()                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
            ▲
            │ Injected via inject()
            │
┌────────────────────────────────────────────────────────────┐
│  Auth Guard (src/app/guards/auth.guard.ts)  ◄─ NEW!        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  export const authGuard: CanActivateFn = (...)      │  │
│  │  - Checks isAuthenticated()                         │  │
│  │  - Returns true | UrlTree                           │  │
│  │  - Redirects to /login?returnUrl=...               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

INTERCEPTORS LAYER
──────────────────

┌────────────────────────────────────────────────────────────┐
│  Auth Interceptor (src/app/interceptors/auth.interceptor) │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - Attaches JWT token to all requests               │  │
│  │  - Handles 401 Unauthorized responses               │  │
│  │  - Timeout protection (30 seconds)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Login Success

```
USER INPUT
    │
    ├─ Email: user@example.com
    ├─ Password: secretPassword123
    │
    ▼
LoginFormComponent validates form
    │
    ├─ Email: required + format check ✓
    ├─ Password: required ✓
    ├─ Form valid: YES
    │
    ▼
LoginComponent.onSubmit() called
    │
    ├─ Set isLoading = true
    ├─ Clear previous errors
    │
    ▼
AuthService.signIn(request)
    │
    ├─ POST /api/auth/sign-in
    ├─ Request: { email, password }
    │
    ▼
Backend API processes request
    │
    ├─ Validate credentials
    ├─ Generate JWT tokens
    │
    ▼
API returns 200 OK
    │
    ├─ Response:
    │  ├─ user: { id, email, email_confirmed_at }
    │  └─ session: { access_token, refresh_token, expires_in, token_type }
    │
    ▼
AuthService.storeTokens()
    │
    ├─ localStorage.setItem('access_token', token)
    ├─ localStorage.setItem('refresh_token', token)
    ├─ Update signals with new values
    │
    ▼
LoginComponent.handleSignInSuccess()
    │
    ├─ Check: email_confirmed_at !== null
    │  ├─ IF YES: Proceed to dashboard
    │  └─ IF NO: Show unverified email error
    │
    ▼
Extract returnUrl from route params
    │
    ├─ Default: /dashboard
    ├─ Custom: /dashboard (or whatever path was requested)
    │
    ▼
Router.navigate([returnUrl])
    │
    ├─ Navigation event triggered
    │
    ▼
Auth Guard checks new route
    │
    ├─ authGuard runs again
    ├─ isAuthenticated() = true (token now in storage)
    ├─ Guard returns true
    │
    ▼
Dashboard Component loads
    │
    ├─ User is now authenticated
    └─ All subsequent API calls include JWT token
```

---

## Data Flow: Login Failure - Invalid Credentials

```
USER INPUT
    │
    ├─ Email: user@example.com
    ├─ Password: wrongPassword
    │
    ▼
LoginFormComponent validates form
    │
    ├─ Form valid: YES (syntax is valid)
    │
    ▼
LoginComponent.onSubmit() called
    │
    ├─ Set isLoading = true
    │
    ▼
AuthService.signIn(request)
    │
    ├─ POST /api/auth/sign-in
    │
    ▼
Backend API processes request
    │
    ├─ Validate credentials
    ├─ Credentials don't match
    │
    ▼
API returns 401 Unauthorized
    │
    ├─ Response:
    │  └─ error:
    │     ├─ code: "INVALID_CREDENTIALS"
    │     └─ message: "Invalid email or password"
    │
    ▼
AuthService.catchError()
    │
    ├─ Passes error to component
    │
    ▼
LoginComponent.mapApiErrorToLoginError()
    │
    ├─ error.status === 401
    ├─ Return LoginError:
    │  ├─ code: "INVALID_CREDENTIALS"
    │  └─ message: "Invalid email or password"
    │
    ▼
LoginComponent.error = loginError
    │
    ├─ Set isLoading = false
    │
    ▼
Change Detection triggers
    │
    ├─ FormErrorAlertComponent displays error
    ├─ Alert type: error (red)
    ├─ Alert message: "Invalid email or password"
    ├─ Alert is dismissible
    │
    ▼
User can:
    ├─ Dismiss error
    ├─ Retry with different credentials
    ├─ Navigate to register page
    └─ Try password recovery (future)
```

---

## Authentication State Transitions

```
                    ┌─────────────────────────┐
                    │  App Initializes        │
                    └─────────────────────────┘
                               │
                               │ AuthService created
                               │ Check localStorage for tokens
                               ▼
                    ┌─────────────────────────┐
                    │  NOT_AUTHENTICATED      │
                    │  (No tokens in storage) │
                    └─────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    │ User navigates to   │ User navigates to
                    │ /login (allowed)    │ /dashboard (blocked)
                    │                     │
         ┌──────────▼──────┐    ┌─────────▼────────┐
         │ Login Page      │    │ Auth Guard       │
         │ Loads           │    │ Redirects to     │
         │ (public)        │    │ /login with      │
         └─────────────────┘    │ returnUrl        │
                    │           └──────────────────┘
                    │                     │
                    │ User enters         │
                    │ credentials & signs │
                    │ in successfully     │
                    │                     │
                    ▼                     ▼
         ┌──────────────────────────────────┐
         │      AUTHENTICATED               │
         │  ✓ access_token in storage       │
         │  ✓ refresh_token in storage      │
         │  ✓ user_id in storage            │
         │  ✓ user_email in storage         │
         └──────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         │ User can access:    │ User can access:
         │ /dashboard (✓)      │ /api/dashboard (✓)
         │ / (redirects to     │ (with Bearer token)
         │ /dashboard) (✓)     │
         │ /login (but         │
         │ redirects to        │
         │ /dashboard)         │
         │                     │
         │                     │
         │ User clicks         │
         │ Logout              │
         └──────────┬──────────┘
                    │
                    │ AuthService.logout()
                    │ - Clear localStorage
                    │ - Reset signals
                    │
                    ▼
         ┌──────────────────────────────────┐
         │      NOT_AUTHENTICATED           │
         │  ✗ All tokens cleared            │
         │  ✗ Signals reset to null         │
         └──────────────────────────────────┘
                    │
                    │ User navigates to /dashboard
                    │ Auth Guard redirects to /login
                    │
                    ▼
         ┌──────────────────────┐
         │  Login Page          │
         │  (Ready for new      │
         │   login attempt)     │
         └──────────────────────┘
```

---

## Security Layers Summary

```
LAYER 1: Route Protection
┌─────────────────────────────────────────────┐
│  Auth Guard (authGuard: CanActivateFn)     │
│  - Prevents route activation without token  │
│  - Redirects to login with returnUrl        │
│  - Runs BEFORE component initialization    │
└─────────────────────────────────────────────┘

LAYER 2: API Request Protection
┌─────────────────────────────────────────────┐
│  Auth Interceptor                           │
│  - Attaches JWT token to all requests      │
│  - Validates token format                   │
│  - Handles token expiration (401)           │
└─────────────────────────────────────────────┘

LAYER 3: Backend Validation
┌─────────────────────────────────────────────┐
│  API Server                                  │
│  - Validates JWT signature                   │
│  - Checks token expiration                   │
│  - Enforces RLS (Row Level Security)        │
│  - Rate limiting (5 attempts/15 min)        │
└─────────────────────────────────────────────┘

LAYER 4: Token Storage
┌─────────────────────────────────────────────┐
│  localStorage (via AuthService)             │
│  - Persistent across page refreshes         │
│  - Automatically initialized on app start   │
│  - Cleared on logout                        │
└─────────────────────────────────────────────┘
```

