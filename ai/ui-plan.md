# UI Architecture for LifeSync

## 1. UI Structure Overview

The LifeSync application will be a Single-Page Application (SPA) built with Angular. The UI is divided into two main areas: a public area for authentication (login, registration) and a private, protected area for authenticated users. The private area is centered around a main dashboard that provides access to all core functionalities like note management and report generation. The architecture will use a main layout for authenticated users, featuring a persistent navigation element, and a separate, simpler layout for the public-facing authentication views. State management will be centralized using NgRx SignalStore to ensure a reactive and consistent user experience.

## 2. View List

### a. Login View
- **View Name**: Login
- **View Path**: `/login`
- **Main Purpose**: To allow existing users to authenticate and access their accounts.
- **Key Information to Display**: Email and password input fields, "Sign In" button, link to the registration view. It will also display specific error messages for invalid credentials or unverified emails.
- **Key View Components**: `NzForm` for the login form, `NzInput` for email/password, `NzButton` for submission, `NzAlert` for error messages.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Clear error feedback. "Resend Verification Email" button appears contextually for unverified users.
  - **Accessibility**: All form fields will have associated labels. Keyboard navigation and focus management will be implemented.
  - **Security**: The form will submit credentials over HTTPS. No sensitive data will be stored in the URL.

### b. Registration View
- **View Name**: Registration
- **View Path**: `/register`
- **Main Purpose**: To allow new users to create an account.
- **Key Information to Display**: Email and password input fields, password confirmation field, "Sign Up" button, link to the login view.
- **Key View Components**: `NzForm`, `NzInput`, `NzButton`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Real-time validation for password strength and email format. Clear success message upon registration, instructing the user to check their email for verification.
  - **Accessibility**: All form fields will have associated labels.
  - **Security**: Password strength indicators will be used.

### c. Email Verification Info View
- **View Name**: Email Verification Info
- **View Path**: `/verify-email`
- **Main Purpose**: To inform the user that a verification email has been sent and they need to check their inbox.
- **Key Information to Display**: A static message instructing the user to check their email for a verification link. It may include a "Resend Email" button.
- **Key View Components**: `NzResult` component to show success/info status.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Provides a clear next step for the user after registration, reducing confusion.

### d. Onboarding Wizard View
- **View Name**: Onboarding Wizard
- **View Path**: `/onboarding`
- **Main Purpose**: To guide new users through the initial setup of their profile (timezone) and preferences (focus categories). This is a mandatory step after their first login.
- **Key Information to Display**: A multi-step process: Step 1 for timezone selection, Step 2 for selecting 1-3 focus categories.
- **Key View Components**: `NzSteps` for the wizard flow, `NzSelect` for timezone, `NzCheckbox` or `NzCard` with a selected state for category selection.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: A guided, step-by-step process simplifies setup. The user cannot exit the wizard until it's complete, ensuring the account is properly configured.
  - **Accessibility**: All form controls will be properly labeled.

### e. Dashboard View
- **View Name**: Dashboard
- **View Path**: `/dashboard`
- **Main Purpose**: To serve as the central hub where users can add notes, view their progress, see streaks, and access their reports.
- **Key Information to Display**: Grid of 6 category cards, note counts per category, streak counter, list of recent reports (with infinite scroll), and a header with the "Generate Report" button.
- **Key View Components**: `CategoryCard` component for each of the 6 categories, `NzProgress` for progress bars, `NzList` for the report history, `NzSkeleton` for loading states.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: The UI will use optimistic updates for note actions. Skeleton loaders will be shown during initial data load. Focus categories are visually distinct with color.
  - **Accessibility**: The layout will be responsive. Cards and interactive elements will be keyboard accessible.
  - **Security**: All data is fetched based on the authenticated user's context.

### f. Preferences View
- **View Name**: Preferences
- **View Path**: `/preferences`
- **Main Purpose**: To allow users to manage their application settings.
- **Key Information to Display**: User's timezone, focus category selection, day and time for weekly reports, and communication channel preferences (in-app/email).
- **Key View Components**: `NzForm`, `NzSelect`, `NzCheckbox`, `NzSwitch`, `NzButton`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Changes are saved with an explicit "Save" action. Real-time validation for rules (e.g., max 3 focus categories).
  - **Accessibility**: All form controls will be clearly labeled.

### g. Report Detail View
- **View Name**: Report Detail
- **View Path**: `/reports/:id`
- **Main Purpose**: To display the full content of a single generated report.
- **Key Information to Display**: The HTML content of the report. It will also display the feedback modal for the user's first report.
- **Key View Components**: `<iframe>` for sandboxed HTML rendering, `FeedbackModal` component.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Clean, readable presentation of the report.
  - **Accessibility**: Ensure the rendered HTML content within the iframe is accessible.
  - **Security**: The report's HTML content will be rendered inside a sandboxed `<iframe>` to prevent XSS vulnerabilities.

## 3. User Journey Map

1.  **New User Registration**:
    - A user lands on the `/register` page.
    - They fill out the registration form and submit it.
    - The user is redirected to the `/verify-email` page and receives a verification email.
    - They click the link in the email, which verifies their account and directs them to the `/login` page.

2.  **First Login and Onboarding**:
    - The user logs in for the first time on the `/login` page.
    - The application detects it's their first time (`hasProfile` or `hasPreferences` is false).
    - The user is redirected to the mandatory `/onboarding` wizard.
    - They complete the wizard by setting their timezone and choosing their focus categories.
    - Upon completion, they are redirected to the main `/dashboard`.

3.  **Daily Usage (Adding a Note)**:
    - An authenticated user is on the `/dashboard`.
    - They click the "Add Note" button on any of the six category cards.
    - An "Add Note" modal appears.
    - The user fills in the note content and saves it.
    - The modal closes, and the dashboard UI updates optimistically to show the new note count.

4.  **Generating an On-Demand Report**:
    - The user is on the `/dashboard`.
    - They click the "Generate Report" button in the header.
    - A confirmation modal may appear if they have no recent notes.
    - The system generates the report in the background. A notification confirms its creation.
    - The new report appears at the top of the report history list on the dashboard.

## 4. Layout and Navigation Structure

- **Public Layout**: A simple, centered layout for the `Login` and `Registration` views, without any navigation elements apart from links between the two forms.
- **Private Layout**: A main layout for authenticated users that includes:
  - A **persistent top navigation bar** containing the application logo, a link to the `Dashboard`, a link to `Preferences`, and a "Logout" button.
  - A **main content area** where the router outlet will render the active view (`Dashboard`, `Preferences`, `Report Detail`).
- **Navigation Flow**:
  - Users navigate between `Login` and `Register` via direct links.
  - Unauthenticated users attempting to access a private route are redirected to `/login`.
  - Authenticated users navigate between `Dashboard` and `Preferences` using the main navigation bar.
  - Users access the `Report Detail` view by clicking on a report in the history list on the `Dashboard`.

## 5. Key Components

- **CategoryCard**: A reusable component displayed on the dashboard for each of the six categories. It shows the category name, a progress bar, and an "Add Note" button. It will have a different style if it's a "focus category."
- **NoteModal**: A modal component (`NzModal`) for creating and editing notes. It contains a form with fields for title and content.
- **ReportListItem**: A component used in the report history list on the dashboard. It displays a summary of a report (e.g., date, type) and links to the full `Report Detail` view.
- **FeedbackModal**: A modal that appears after the user views their first report, allowing them to provide a rating (emojis) and an optional comment.
- **GlobalErrorDisplay**: A non-view component, likely implemented in the `HttpInterceptor`, that uses `NzNotificationService` to display consistent error and success messages to the user.
