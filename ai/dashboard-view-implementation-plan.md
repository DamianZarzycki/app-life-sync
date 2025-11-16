# Dashboard View Implementation Plan

## 1. Overview

The Dashboard view is the central hub of LifeSync where authenticated users can manage their weekly reflection activities. This view displays:
- **Category Cards**: Six interactive cards representing life categories (Family, Friends, Pets, Body, Mind, Passions) with note counts and progress visualization
- **Streak Counter**: Visual display of consecutive days with at least one note entry
- **Progress Tracking**: Per-category progress bars showing activity levels
- **Report History**: Infinite-scrollable list of recent generated reports with filtering capabilities
- **Quick Actions**: "Generate Report" button for on-demand report generation

The dashboard aggregates data from the `/api/dashboard` endpoint (cached for 5 minutes) and provides users with immediate feedback on their progress and engagement.

**Key Requirements**:
- Load time: < 2 seconds
- Display correct note counts and streak calculations
- Support timezone-aware streak calculation
- Responsive design for all screen sizes
- Keyboard accessible navigation
- Optimistic UI updates for note operations
- Cache invalidation on data mutations

---

## 2. View Routing

**Route Path**: `/dashboard`

**Route Configuration**:
```typescript
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard],
  data: { title: 'Dashboard - LifeSync' }
}
```

**Route Protection**: The route must be protected by `AuthGuard` to ensure only authenticated users can access the dashboard. Unauthenticated users attempting to access this route should be redirected to the login page.

---

## 3. Component Structure

```
DashboardComponent (Main Container)
├── DashboardHeaderComponent
│   ├── Page Title
│   ├── User Greeting
│   └── GenerateReportButton
├── DashboardSummaryComponent
│   ├── StreakDisplayComponent
│   └── CategoryGridComponent
│       ├── CategoryCardComponent (×6)
│       │   ├── CategoryIcon
│       │   ├── CategoryName
│       │   ├── NoteCount Display
│       │   └── NzProgress (note count as percentage)
│       └── EmptyCategoryPlaceholder (if needed)
├── ReportHistoryComponent
│   ├── ReportHistoryHeaderComponent
│   │   ├── "Report History" Title
│   │   └── WeekFilterDropdown
│   ├── ReportListComponent
│   │   ├── ReportItemComponent (×N, infinite scroll)
│   │   │   ├── ReportDate
│   │   │   ├── GeneratedByBadge
│   │   │   └── ViewReportButton
│   │   └── InfiniteScrollTrigger
│   └── EmptyReportState (if no reports)
└── LoadingSkeletonComponent (during initial load)
```

---

## 4. Component Details

### DashboardComponent

- **Component description**: Main view container that orchestrates data fetching, state management, and layout composition. Handles authentication verification, initial data loading with skeleton display, error handling, and coordination between child components.

- **Main elements**:
  - Header section with title and action buttons
  - Loading skeleton during data fetch
  - Error alert banner (if applicable)
  - Summary section (streak + category grid)
  - Report history section with infinite scroll
  - Empty state placeholder if no data

- **Handled interactions**:
  - Component initialization: Fetch dashboard data
  - Report generation button click: Navigate to report generation or trigger modal
  - Category card click: Navigate to category notes view or show notes modal
  - Report item click: Navigate to report detail view
  - Infinite scroll trigger: Load more reports
  - Week filter change: Reload report history with new filter
  - Retry button click: Retry failed data fetch
  - Cache invalidation on note/report updates: Refresh dashboard data

- **Handled validation**:
  - Verify user is authenticated (401 redirects to login)
  - Validate dashboard API response structure matches `DashboardDto`
  - Verify timezone parameter is valid IANA timezone (if provided)
  - Verify `since` parameter is valid ISO date format YYYY-MM-DD
  - Verify note counts are non-negative integers
  - Verify streak_days is non-negative integer
  - Verify active_categories array contains valid UUIDs
  - Verify recent_reports array items have valid UUIDs and timestamps
  - Check if dashboard data is stale (>5 minutes) for cache refresh

- **Types**:
  - `DashboardDto` (from API response)
  - `DashboardSummaryDto`
  - `RecentReportDto`
  - `DashboardViewModel` (local view model combining API data with UI state)
  - `DashboardState` (loading, success, error states)

- **Props**: None (root component), but receives:
  - Route parameters via `ActivatedRoute`
  - User info via `AuthService`

### DashboardHeaderComponent

- **Component description**: Displays page header with title, user greeting, and primary action buttons. Provides visual hierarchy and quick navigation/action access.

- **Main elements**:
  - Page title: "Dashboard"
  - User greeting: "Welcome, [User Name]"
  - "Generate Report" button (primary action, ng-zorro button)
  - Optional: User profile menu or settings icon
  - Responsive design: Stack vertically on mobile

- **Handled interactions**:
  - Generate Report button click: Emit event to parent or navigate to report generation
  - Profile icon click (if included): Show profile menu

- **Handled validation**:
  - Verify user name is available (fallback to "User" if not)
  - Verify button is enabled based on report generation quota (from preferences/API)
  - Verify button accessibility meets WCAG 2.1 AA standards

- **Types**:
  - `UserInfo` (user name, avatar URL)
  - Optional: Report generation status (quota remaining)

- **Props**:
  ```typescript
  {
    userName: string;
    onGenerateReport: () => void;
    isGeneratingReport?: boolean;
    canGenerateReport?: boolean;
  }
  ```

### StreakDisplayComponent

- **Component description**: Displays the current consecutive-day streak with visual emphasis and iconography. Shows the number of consecutive days the user has added at least one note.

- **Main elements**:
  - Flame icon (or similar visual indicator)
  - Large streak number (e.g., "5")
  - Label: "Day Streak" or "Days"
  - Optional: Previous streak or best streak comparison
  - Background card with color coding (gold/orange for higher streaks)

- **Handled interactions**:
  - Hover tooltip showing "Consecutive days with notes"
  - Click: Show more detail or history of streak dates

- **Handled validation**:
  - Verify streak_days is non-negative integer
  - Handle streak of 0 gracefully
  - Verify streak calculation considers user's timezone

- **Types**:
  - `StreakData`: { days: number; lastNoteDate?: string }

- **Props**:
  ```typescript
  {
    streakDays: number;
    lastNoteDate?: string;
  }
  ```

### CategoryCardComponent

- **Component description**: Reusable card component representing a single life category. Displays category name, icon, current note count, and progress toward a daily goal. Color-coded by category for visual distinction.

- **Main elements**:
  - Category icon (from category system or predefined set)
  - Category name (e.g., "Family")
  - Note count display: "{count} notes"
  - NzProgress bar (0-100%, based on notes vs. goal)
  - Optional: Goal threshold indicator
  - Clickable container (cursor pointer on hover)

- **Handled interactions**:
  - Card click: Navigate to category notes view or show notes modal
  - Hover: Show tooltip with "View notes" text
  - Keyboard: Enter/Space key to trigger click action

- **Handled validation**:
  - Verify category_id is valid UUID
  - Verify note count is non-negative integer
  - Verify progress percentage is 0-100 (cap at 100%)
  - Verify category is in active_categories list
  - Handle missing category icon gracefully

- **Types**:
  - `CategoryCardViewModel`: { id: UUID; name: string; icon: string; noteCount: number; progressPercent: number; color: string }
  - `CategoryDto` (from database)

- **Props**:
  ```typescript
  {
    category: CategoryCardViewModel;
    onCategoryClick: (categoryId: UUID) => void;
  }
  ```

### CategoryGridComponent

- **Component description**: Container for the 6 category cards. Displays them in a responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile). Handles spacing and alignment.

- **Main elements**:
  - Responsive CSS grid (3-2-1 columns)
  - 6 CategoryCard components in fixed order
  - Consistent spacing between cards
  - Optional: "Add Note" overlay or quick-action buttons on cards

- **Handled interactions**:
  - Propagates click events from child CategoryCard components
  - Handles responsive layout changes

- **Handled validation**:
  - Verify exactly 6 categories are provided or handle gracefully if fewer
  - Verify all categories have required data (id, name, noteCount)

- **Types**:
  - `CategoryCardViewModel[]` (array of 6 categories)

- **Props**:
  ```typescript
  {
    categories: CategoryCardViewModel[];
    onCategoryClick: (categoryId: UUID) => void;
  }
  ```

### DashboardSummaryComponent

- **Component description**: Combines streak display and category grid into a unified summary section. Acts as container for overview metrics.

- **Main elements**:
  - StreakDisplayComponent
  - CategoryGridComponent
  - Section title: "Your Progress"
  - Flex container layout

- **Handled interactions**:
  - Delegates interactions to child components

- **Handled validation**:
  - Verify summary data structure is complete
  - Verify streak and categories are both available

- **Types**:
  - `DashboardSummaryDto`
  - `CategoryCardViewModel[]`

- **Props**:
  ```typescript
  {
    summary: DashboardSummaryDto;
    categories: CategoryCardViewModel[];
    onCategoryClick: (categoryId: UUID) => void;
  }
  ```

### ReportHistoryComponent

- **Component description**: Displays a paginated/infinite-scrollable list of recent reports. Allows users to filter by week, view report metadata, and navigate to full report views.

- **Main elements**:
  - Section header: "Your Reports"
  - Week filter dropdown (optional, based on requirements)
  - Infinite scroll container
  - ReportItemComponent for each report
  - "No reports yet" empty state
  - Loading indicator for pagination

- **Handled interactions**:
  - Week filter dropdown change: Reload reports with new filter
  - Report item click: Navigate to report detail
  - Infinite scroll threshold: Trigger load more reports
  - Retry button on load error: Retry pagination fetch

- **Handled validation**:
  - Verify report items have required fields (id, generated_by, created_at)
  - Verify generated_by is valid enum: "scheduled" | "on_demand"
  - Verify created_at is valid ISO datetime
  - Verify pagination total is non-negative integer
  - Handle timezone-aware date formatting
  - Validate week filter parameter if provided

- **Types**:
  - `RecentReportDto[]`
  - `ReportPaginationState`: { items: RecentReportDto[]; total: number; page: number; pageSize: number; hasMore: boolean }
  - `WeekFilter`: { startDate: string; endDate: string }

- **Props**:
  ```typescript
  {
    reports: RecentReportDto[];
    onReportClick: (reportId: UUID) => void;
    onLoadMore: () => void;
    isLoading?: boolean;
    error?: string;
  }
  ```

### ReportItemComponent

- **Component description**: Individual report list item showing report metadata. Displays report generation date, type (scheduled/on-demand), and action button to view full report.

- **Main elements**:
  - Report date (formatted: "January 6, 2025" or "Jan 6")
  - Generated-by badge: "Scheduled" or "On-Demand" (different colors)
  - View button or clickable row
  - Optional: Report summary preview

- **Handled interactions**:
  - Click: Emit event to navigate to report detail
  - Hover: Show tooltip or highlight row
  - Keyboard: Enter/Space to trigger click

- **Handled validation**:
  - Verify report_id is valid UUID
  - Verify created_at is valid ISO datetime
  - Verify generated_by is valid enum value
  - Handle timezone-aware date formatting based on user preferences

- **Types**:
  - `RecentReportDto`
  - `FormattedReportItem`: { id: UUID; formattedDate: string; generatedBy: "scheduled" | "on_demand"; createdAt: string }

- **Props**:
  ```typescript
  {
    report: RecentReportDto;
    onViewReport: (reportId: UUID) => void;
  }
  ```

### LoadingSkeletonComponent

- **Component description**: Skeleton loader displayed during initial dashboard data fetch to improve perceived performance and user experience.

- **Main elements**:
  - NzSkeleton components for header section
  - Skeleton grid for category cards (6 items, 3-column layout)
  - Skeleton list for report history (5-10 items)
  - Animated placeholder blocks matching final layout

- **Handled interactions**:
  - Non-interactive; purely visual placeholder

- **Handled validation**:
  - Ensure skeleton layout matches actual component layout proportions

- **Types**: None (pure UI component)

- **Props**: None (or optional `isLoading: boolean`)

### ErrorAlertComponent

- **Component description**: Displays error messages to users when dashboard data fetch fails. Provides action buttons for retry or navigation alternatives.

- **Main elements**:
  - NzAlert component (ng-zorro)
  - Error message text
  - Retry button
  - Optional: Contact support or report issue link
  - Icon (error/warning)

- **Handled interactions**:
  - Retry button click: Trigger data fetch retry
  - Dismiss button: Hide alert
  - Link click: Navigate to support or settings

- **Handled validation**:
  - Verify error message is appropriate and user-friendly
  - Handle 401 Unauthorized differently (suggest login/logout)
  - Handle network errors differently (show offline message)

- **Types**:
  - `ErrorType`: "unauthorized" | "validation" | "server" | "network"
  - `ErrorState`: { type: ErrorType; message: string; recoverable: boolean }

- **Props**:
  ```typescript
  {
    error: ErrorState;
    onRetry: () => void;
    onDismiss: () => void;
  }
  ```

---

## 5. Types

### Core DTOs (from API Response)

**DashboardDto** (already defined in `src/types.ts`)
```typescript
export type DashboardDto = {
  summary: DashboardSummaryDto;
  recent_reports: RecentReportDto[];
};
```

**DashboardSummaryDto** (already defined in `src/types.ts`)
```typescript
export type DashboardSummaryDto = {
  active_categories: UUID[];           // Array of category UUIDs currently active
  notes_count: Record<UUID, number>;   // Mapping of category UUID → note count in date range
  streak_days: number;                  // Consecutive days with at least one note
};
```

**RecentReportDto** (already defined in `src/types.ts`)
```typescript
export type RecentReportDto = Pick<
  Tables<'reports'>,
  'id' | 'generated_by' | 'created_at'
>;
```

**DashboardQuery** (already defined in `src/types.ts`)
```typescript
export type DashboardQuery = {
  timezone?: string;    // IANA timezone identifier (default: profile timezone)
  since?: string;       // ISO date YYYY-MM-DD (default: 4 weeks ago)
};
```

### View-Specific ViewModels

**DashboardViewModel** (new)

Purpose: Combines API response data with UI state for efficient rendering and state management.

```typescript
export type DashboardViewModel = {
  // Data from API
  summary: DashboardSummaryDto;
  recent_reports: RecentReportDto[];
  
  // Formatted/computed data for UI
  categories: CategoryCardViewModel[];
  streak: StreakData;
  
  // UI state
  isLoading: boolean;
  error: ErrorState | null;
  lastRefreshTime: Date;
  
  // Pagination state for report history
  reportsPagination: ReportPaginationState;
};
```

**CategoryCardViewModel** (new)

Purpose: Transforms category data for display in CategoryCard component with formatted values and color coding.

```typescript
export type CategoryCardViewModel = {
  // Identity
  id: UUID;                        // Category UUID
  name: string;                    // Category name (e.g., "Family")
  
  // Display data
  icon: string;                    // Icon name or class for ng-zorro icon component
  color: string;                   // Tailwind color class (e.g., "bg-blue-500")
  colorClass: string;              // Full CSS class for styling
  
  // Activity metrics
  noteCount: number;               // Number of notes in current date range
  dailyGoal: number;              // Target notes per day (optional, default: 1)
  progressPercent: number;         // Percentage of goal: (noteCount / dailyGoal) * 100, capped at 100
  
  // Metadata
  isActive: boolean;               // Whether category is in active_categories array
  lastNote?: {
    date: string;                 // ISO datetime of most recent note
    title: string;                // Title of most recent note (optional)
  };
};
```

**StreakData** (new)

Purpose: Encapsulates streak information for display.

```typescript
export type StreakData = {
  days: number;                    // Current consecutive-day streak count
  lastNoteDate?: string;           // ISO datetime of most recent note (for tooltip)
  isCurrentDay?: boolean;          // Whether user has a note today (to show active streak)
  bestStreak?: number;             // Historical best streak (optional)
};
```

**ReportPaginationState** (new)

Purpose: Manages pagination and infinite scroll state for report history.

```typescript
export type ReportPaginationState = {
  items: RecentReportDto[];        // Current page of reports
  total: number;                   // Total number of reports
  pageSize: number;                // Reports per page (e.g., 10)
  currentPage: number;             // Current page index (0-based)
  hasMore: boolean;                // Whether more reports are available
  isLoading: boolean;              // Whether loading next page
  error: string | null;            // Error message if load failed
};
```

**FormattedReportItem** (new)

Purpose: Report data formatted for display in ReportItemComponent.

```typescript
export type FormattedReportItem = RecentReportDto & {
  formattedDate: string;           // Human-readable date (e.g., "January 6, 2025")
  relativeTime: string;            // Relative time (e.g., "2 days ago")
  generatedByLabel: string;        // "Scheduled" or "On-Demand"
  generatedByBadgeColor: string;   // Color class for badge
};
```

**ErrorState** (new)

Purpose: Represents error conditions with type and severity information.

```typescript
export type ErrorState = {
  code: string;                    // Error code (e.g., "UNAUTHORIZED", "VALIDATION_ERROR", "SERVER_ERROR")
  message: string;                 // User-friendly error message
  details?: Record<string, string>;// Additional error details (e.g., validation errors)
  type: 'unauthorized' | 'validation' | 'server' | 'network'; // Error category
  recoverable: boolean;            // Whether error can be retried
  timestamp: Date;                 // When error occurred
};
```

**DashboardState** (new)

Purpose: Enum-like representation of dashboard loading states.

```typescript
export enum DashboardLoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

export type DashboardState = DashboardLoadingState;
```

**CategoryColorMap** (new)

Purpose: Maps categories to consistent colors for UI.

```typescript
export const CATEGORY_COLOR_MAP: Record<string, { color: string; class: string; icon: string }> = {
  'family': { color: '#FF6B6B', class: 'bg-red-500', icon: 'home' },
  'friends': { color: '#4ECDC4', class: 'bg-cyan-500', icon: 'team' },
  'pets': { color: '#FFD93D', class: 'bg-yellow-500', icon: 'appstore' },
  'body': { color: '#6BCB77', class: 'bg-green-500', icon: 'heart' },
  'mind': { color: '#4D96FF', class: 'bg-blue-500', icon: 'brain' },
  'passions': { color: '#FF6BCB', class: 'bg-pink-500', icon: 'fire' },
};
```

---

## 6. State Management

### Approach: RxJS Observables with Component State

The Dashboard view uses a service-based approach with RxJS observables for reactive state management, combined with component-level state for UI interactions.

### DashboardService

**Purpose**: Centralized service for dashboard data fetching, caching, and cache invalidation.

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private dashboardData$ = new BehaviorSubject<DashboardDto | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<ErrorState | null>(null);
  private lastRefreshTime$ = new BehaviorSubject<Date | null>(null);
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  constructor(private http: HttpClient) {}
  
  // Observable streams exposed to components
  getDashboardData$(): Observable<DashboardDto | null>;
  getLoading$(): Observable<boolean>;
  getError$(): Observable<ErrorState | null>;
  getLastRefreshTime$(): Observable<Date | null>;
  
  // Data fetching methods
  fetchDashboard(query?: DashboardQuery): Observable<DashboardDto>;
  refreshDashboardIfNeeded(): void;
  invalidateCache(): void;
  
  // Helper methods
  private isCacheValid(): boolean;
  private handleError(error: any): ErrorState;
  private transformApiResponse(data: DashboardDto): DashboardViewModel;
}
```

### Component-Level State

**DashboardComponent manages**:
- Dashboard view model (transformed API data)
- Report pagination state (for infinite scroll)
- Week filter state (for report history filtering)
- UI interaction states (generating report, expanding sections, etc.)

### State Variables

```typescript
// Main data state
dashboardData$: Observable<DashboardViewModel>;
loading$: Observable<boolean>;
error$: Observable<ErrorState | null>;

// Report pagination
reportPage = 0;
reportPageSize = 10;
allReports: RecentReportDto[] = [];
hasMoreReports = true;
isLoadingMoreReports = false;

// Filters
selectedWeekFilter: { start: Date; end: Date } | null = null;
timezone: string = 'UTC';

// UI interactions
isGeneratingReport = false;
showGenerateReportModal = false;
```

### Custom Hook: `useDashboardData`

**Purpose**: Encapsulate dashboard data fetching and caching logic, exposing reactive streams for component consumption.

```typescript
export function useDashboardData(
  dashboardService: DashboardService,
  queryParams?: DashboardQuery
): {
  data$: Observable<DashboardViewModel>;
  loading$: Observable<boolean>;
  error$: Observable<ErrorState | null>;
  refresh: () => void;
  invalidateCache: () => void;
} {
  // Implementation details:
  // 1. Fetch dashboard data on hook initialization
  // 2. Transform API response to ViewModel
  // 3. Handle errors with appropriate error state
  // 4. Expose refresh method to manually trigger fetch
  // 5. Expose invalidateCache method for cache invalidation
  // 6. Return RxJS observables for reactive rendering
}
```

### Cache Invalidation Trigger Points

The dashboard cache must be invalidated when:
1. **Note Created**: After successful note creation
2. **Note Updated**: After successful note update
3. **Note Deleted**: After successful note deletion
4. **Report Generated**: After successful report generation

**Implementation**: 
- Broadcast cache invalidation events from note/report services
- Subscribe to these events in DashboardComponent
- Call `invalidateCache()` on DashboardService when events are received
- Trigger automatic refresh after cache invalidation

```typescript
constructor(private dashboardService: DashboardService, 
            private notesService: NotesService,
            private reportsService: ReportsService) {
  // Subscribe to cache invalidation triggers
  this.notesService.noteCreated$.subscribe(() => this.invalidateDashboard());
  this.notesService.noteUpdated$.subscribe(() => this.invalidateDashboard());
  this.notesService.noteDeleted$.subscribe(() => this.invalidateDashboard());
  this.reportsService.reportGenerated$.subscribe(() => this.invalidateDashboard());
}

private invalidateDashboard(): void {
  this.dashboardService.invalidateCache();
  this.dashboardService.refreshDashboardIfNeeded();
}
```

---

## 7. API Integration

### Endpoint Details

**Endpoint**: `GET /api/dashboard`

**Base URL**: Will be determined by environment configuration (e.g., `http://localhost:3000/api` for development)

### Request

**HTTP Method**: GET

**Query Parameters** (optional):
```typescript
{
  timezone?: string;    // IANA timezone (e.g., "Europe/Warsaw")
  since?: string;       // ISO date YYYY-MM-DD (e.g., "2025-01-06")
}
```

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Type**: `DashboardQuery`

### Response

**Status Code**: 200 OK

**Response Headers**:
```
Cache-Control: private, max-age=300
Content-Type: application/json
```

**Response Body**: `DashboardDto`

```json
{
  "summary": {
    "active_categories": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660e8400-e29b-41d4-a716-446655440001"
    ],
    "notes_count": {
      "550e8400-e29b-41d4-a716-446655440000": 12,
      "660e8400-e29b-41d4-a716-446655440001": 8
    },
    "streak_days": 5
  },
  "recent_reports": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "generated_by": "scheduled",
      "created_at": "2025-01-06T02:00:00Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "generated_by": "on_demand",
      "created_at": "2025-01-05T14:30:00Z"
    }
  ]
}
```

### Error Responses

**401 Unauthorized** - Missing or invalid authentication
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request** - Invalid query parameters
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "timezone": "Invalid timezone format",
      "since": "Invalid date format, must be YYYY-MM-DD"
    }
  }
}
```

**500 Internal Server Error** - Server-side error
```json
{
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

### Implementation Details

**HTTP Client Setup**:
- Use Angular's `HttpClient` service
- Configure with auth interceptor to automatically include JWT token
- Handle request/response transformation

**Data Fetching Logic**:

```typescript
fetchDashboard(query?: DashboardQuery): Observable<DashboardDto> {
  let url = `${this.apiBaseUrl}/api/dashboard`;
  let params = new HttpParams();
  
  if (query?.timezone) {
    params = params.set('timezone', query.timezone);
  }
  if (query?.since) {
    params = params.set('since', query.since);
  }
  
  return this.http.get<DashboardDto>(url, { params }).pipe(
    timeout(5000), // 5-second timeout
    retry({ count: 2, delay: 1000 }), // Retry twice with 1-second delay
    catchError(error => {
      const errorState = this.handleError(error);
      this.error$.next(errorState);
      throw errorState;
    }),
    tap(data => {
      this.dashboardData$.next(data);
      this.lastRefreshTime$.next(new Date());
      this.error$.next(null);
    })
  );
}
```

**Cache Management**:
- Store last fetch time when data is retrieved
- Validate cache freshness (5-minute TTL matches backend)
- Invalidate cache when mutations occur
- Optionally use browser's HTTP cache headers

**Transformation Logic**:
- Convert API response `DashboardDto` to view model `DashboardViewModel`
- Map categories to `CategoryCardViewModel` with formatted data
- Format dates for display (timezone-aware)
- Calculate progress percentages
- Assign color classes to categories

---

## 8. User Interactions

### Interaction: Dashboard Page Load

**User Action**: User navigates to `/dashboard`

**Expected Flow**:
1. Route guard (`AuthGuard`) verifies authentication; redirects to login if not authenticated
2. Component initializes and begins data fetch
3. Skeleton loader displays while fetching
4. Dashboard data retrieved from `/api/dashboard` endpoint
5. Response data transformed to view models
6. UI renders with actual data
7. Skeleton loader disappears

**Success Criteria**:
- Dashboard loads in < 2 seconds
- All data displayed correctly
- No console errors

**Error Handling**:
- 401 error: Display alert and redirect to login
- 400 error: Display validation error message
- Network timeout: Show retry button

### Interaction: Category Card Click

**User Action**: User clicks on a category card

**Expected Flow**:
1. Component emits category ID to parent or triggers navigation
2. Navigate to `/categories/{categoryId}/notes` or open notes modal
3. Show list of notes for that category
4. Allow adding new note for category

**Success Criteria**:
- Navigation occurs smoothly
- Notes for selected category load
- User can add/edit/delete notes in that category

**Error Handling**:
- Invalid category ID: Show error and return to dashboard
- Failed to load notes: Show error with retry option

### Interaction: View Report

**User Action**: User clicks on a report in the report history list

**Expected Flow**:
1. Component emits report ID
2. Navigate to `/reports/{reportId}` to view full report
3. Load and display report details
4. Show report summary, recommendations, and feedback option

**Success Criteria**:
- Report detail page loads
- Full report content displayed
- Feedback submission available

**Error Handling**:
- Report not found (404): Show error message
- Failed to load report: Show error with retry option

### Interaction: Generate Report Button Click

**User Action**: User clicks "Generate Report" button

**Expected Flow**:
1. Check if user has remaining quota (API knowledge)
2. If under quota, show report generation modal/confirmation
3. User selects categories to include in report
4. On confirmation, submit request to `/api/reports/generate` (or similar)
5. Show loading state while generating
6. On success, add new report to history and show success message
7. Refresh dashboard to update report count
8. Return to dashboard

**Success Criteria**:
- Report generation completes
- New report appears in report history
- Dashboard updates reflect new report

**Error Handling**:
- Quota exceeded: Show message explaining limit
- Generation failed: Show error with explanation and retry option
- Missing required data: Show validation errors

### Interaction: Infinite Scroll - Load More Reports

**User Action**: User scrolls to bottom of report history list

**Expected Flow**:
1. Intersection observer detects scroll threshold
2. Component triggers load more reports
3. New page of reports fetched from API (with pagination parameters)
4. Skeleton loader shown for new items
5. New items appended to list
6. If no more reports available, remove scroll trigger

**Success Criteria**:
- Reports load smoothly
- No duplicate reports displayed
- Pagination continues until all reports loaded

**Error Handling**:
- Pagination fails: Show error with retry button
- Network timeout: Show retry option
- Invalid pagination state: Reset pagination and retry from beginning

### Interaction: Filter Reports by Week

**User Action**: User selects a week from filter dropdown (if implemented)

**Expected Flow**:
1. User opens week filter dropdown
2. Selects a date range (e.g., "This week", "Last week", specific dates)
3. Component updates report list filter
4. Reports are re-fetched with new filter parameters
5. Report history list updates to show filtered results
6. Pagination reset to first page

**Success Criteria**:
- Reports filtered correctly by selected week
- Empty state shown if no reports in week
- Filter persists until user changes it

**Error Handling**:
- Invalid date range: Show validation error
- No reports in range: Show empty state message

### Interaction: Retry on Error

**User Action**: User clicks "Retry" button after error

**Expected Flow**:
1. Error alert displays with retry button
2. User clicks retry
3. Dashboard re-fetches data from API
4. Skeleton loader displays during fetch
5. On success, error is cleared and data displays
6. On failure, error message updates

**Success Criteria**:
- Data fetched successfully on retry
- Error cleared from UI
- Dashboard displays updated data

**Error Handling**:
- Multiple retries fail: Suggest contacting support
- Persistent 401 error: Redirect to login

### Interaction: Browser Back Navigation

**User Action**: User navigates back to dashboard from another view

**Expected Flow**:
1. Component detects page activation
2. Check if cached data is still fresh (< 5 minutes old)
3. If fresh: Display cached data immediately
4. If stale: Fetch fresh data in background
5. Cache invalidation events trigger refresh if needed

**Success Criteria**:
- Dashboard displays immediately (cached data)
- Fresh data loaded in background if needed
- No duplicate fetches occur

**Error Handling**:
- Cache invalidation event missed: Trigger manual refresh on page activation

---

## 9. Conditions and Validation

### API Response Validation

All API response data must be validated before rendering. Implement strict validation using Zod or similar schema validation library.

#### DashboardDto Validation

**Condition: Response matches DashboardDto structure**
```typescript
const DashboardDtoSchema = z.object({
  summary: z.object({
    active_categories: z.array(z.string().uuid()),
    notes_count: z.record(z.string().uuid(), z.number().nonnegative()),
    streak_days: z.number().nonnegative().int(),
  }),
  recent_reports: z.array(z.object({
    id: z.string().uuid(),
    generated_by: z.enum(['scheduled', 'on_demand']),
    created_at: z.string().datetime(),
  })),
});
```

**Component Impact**: 
- If validation fails, set error state to "Invalid API response"
- Display error alert to user
- Offer retry option

**How Verified**: 
- Parse response with `DashboardDtoSchema.parse()` before storing
- Catch `ZodError` and convert to user-friendly error message

#### Query Parameter Validation

**Condition: Timezone parameter is valid IANA timezone**
```typescript
if (query.timezone) {
  const validTimezones = Intl.supportedValuesOf('timeZone');
  if (!validTimezones.includes(query.timezone)) {
    throw new ValidationError('Invalid timezone format');
  }
}
```

**Component Impact**: Prevents sending invalid timezone to API

**How Verified**: 
- Before calling API, validate timezone against supported values
- Use Intl API or predefined list of valid timezones

**Condition: Since parameter is valid ISO date in past or today**
```typescript
if (query.since) {
  const since = new Date(query.since);
  const today = new Date();
  if (isNaN(since.getTime()) || since > today) {
    throw new ValidationError('Invalid date format or date is in future');
  }
}
```

**Component Impact**: Prevents invalid date queries

**How Verified**: 
- Parse since parameter as ISO date
- Verify it parses correctly and is not in future
- Format must be YYYY-MM-DD

### UI State Validation

#### Category Data Validation

**Condition: Active categories contain valid UUIDs**
- Each UUID in `active_categories` must be valid UUID format
- Used to map note counts in `notes_count` object

**Component Impact**: Only render category cards for valid categories

**How Verified**: 
```typescript
const validCategories = summary.active_categories.filter(
  id => isValidUUID(id) && summary.notes_count.hasOwnProperty(id)
);
```

#### Note Count Validation

**Condition: Note counts are non-negative integers**
- Each value in `notes_count` object must be >= 0
- Used to calculate progress percentage

**Component Impact**: Prevent displaying negative progress

**How Verified**: 
```typescript
const validNoteCount = Math.max(0, notes_count[categoryId]);
```

#### Streak Days Validation

**Condition: Streak days is non-negative integer**
- `streak_days` must be >= 0
- Used for display only

**Component Impact**: Show 0 streak if invalid

**How Verified**: 
```typescript
const validStreak = Math.max(0, Math.floor(summary.streak_days));
```

#### Report Data Validation

**Condition: Each report has valid id, generated_by, and created_at**
- `id` must be valid UUID
- `generated_by` must be "scheduled" or "on_demand"
- `created_at` must be valid ISO datetime

**Component Impact**: Filter out invalid reports; display only valid ones

**How Verified**: 
```typescript
const validReports = recent_reports.filter(report => 
  isValidUUID(report.id) &&
  ['scheduled', 'on_demand'].includes(report.generated_by) &&
  isValidISO8601(report.created_at)
);
```

### Component-Level Conditions

#### Authentication Required

**Condition: User is authenticated**
- JWT token must be present in auth service
- Token must not be expired

**Component Impact**: 
- If not authenticated, redirect to login immediately
- Prevent any data fetching

**How Verified**: 
- AuthGuard checks authentication before route activation
- On component init, verify auth state
- If auth service returns null/undefined user, redirect to login

**Code**:
```typescript
ngOnInit(): void {
  if (!this.authService.isAuthenticated()) {
    this.router.navigate(['/login']);
    return;
  }
  this.loadDashboard();
}
```

#### Data Loading Timeout

**Condition: Dashboard data must load within 2 seconds**

**Component Impact**: 
- Show loading skeleton for max 2 seconds
- If data not received after 2 seconds, show timeout error

**How Verified**: 
```typescript
this.dashboardService.fetchDashboard()
  .pipe(
    timeout(2000),
    catchError(error => {
      if (error.name === 'TimeoutError') {
        throw new Error('Dashboard load timeout');
      }
      throw error;
    })
  )
  .subscribe(...);
```

#### Cache Freshness

**Condition: Dashboard cache is valid if < 5 minutes old**

**Component Impact**: 
- Use cached data if fresh
- Fetch new data if cache is stale
- Don't refetch if already fetching

**How Verified**: 
```typescript
private isCacheValid(): boolean {
  const lastRefresh = this.lastRefreshTime$.value;
  if (!lastRefresh) return false;
  const now = new Date();
  const ageMs = now.getTime() - lastRefresh.getTime();
  return ageMs < (5 * 60 * 1000); // 5 minutes
}
```

#### Report Generation Quota

**Condition: User has not exceeded report generation limit**
- User can generate max 3 reports per week
- API enforces this, but frontend should check too

**Component Impact**: 
- Disable "Generate Report" button if quota reached
- Show warning message if at quota limit

**How Verified**: 
- Count on-demand reports generated this week in recent_reports
- Disable button if count >= 3
- Show remaining quota to user

---

## 10. Error Handling

### Error Categories and Responses

#### 1. Authentication Errors (401 Unauthorized)

**Scenario**: User session expired or invalid JWT token

**How it Occurs**:
- User's token is expired or invalid
- API returns 401 Unauthorized
- User navigated directly to URL or session timed out

**User-Facing Message**: 
"Your session has expired. Please log in again."

**Component Response**:
- Clear authentication state
- Redirect to `/login` page
- Preserve return URL for post-login redirect

**Implementation**:
```typescript
private handleError(error: HttpErrorResponse): ErrorState {
  if (error.status === 401) {
    this.authService.logout();
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: '/dashboard' } 
    });
    return {
      code: 'UNAUTHORIZED',
      message: 'Your session has expired. Please log in again.',
      type: 'unauthorized',
      recoverable: false,
      timestamp: new Date(),
    };
  }
}
```

#### 2. Validation Errors (400 Bad Request)

**Scenario**: Invalid query parameters sent to API

**How it Occurs**:
- Invalid timezone format
- Invalid date format for `since` parameter
- Date in future

**User-Facing Message**: 
"Invalid filter parameters. Please try again with valid values."

**Component Response**:
- Display error message
- Highlight which parameters are invalid (in details)
- Offer to reset to defaults
- Provide retry button

**Implementation**:
```typescript
if (error.status === 400) {
  const details = error.error?.error?.details || {};
  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid query parameters. Please try again.',
    details: details,
    type: 'validation',
    recoverable: true,
    timestamp: new Date(),
  };
}
```

#### 3. Server Errors (500 Internal Server Error)

**Scenario**: Backend error while processing request

**How it Occurs**:
- Database connection error
- Unhandled exception in API handler
- External service failure (Supabase)

**User-Facing Message**: 
"An unexpected error occurred. Our team has been notified. Please try again in a moment."

**Component Response**:
- Display generic error message (don't expose details)
- Offer retry button
- Log full error for debugging
- Show support contact option after multiple retries

**Implementation**:
```typescript
if (error.status >= 500) {
  console.error('Dashboard server error:', error);
  return {
    code: 'SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    type: 'server',
    recoverable: true,
    timestamp: new Date(),
  };
}
```

#### 4. Network Errors (Timeout, No Connection)

**Scenario**: Network connectivity issue

**How it Occurs**:
- Request times out (> 5 seconds)
- User offline
- Network interrupted mid-request

**User-Facing Message**: 
"Network connection lost. Please check your connection and try again."

**Component Response**:
- Show network error with retry button
- Auto-retry with exponential backoff (optional)
- Show offline indicator if user is offline

**Implementation**:
```typescript
if (error.status === 0 || error.name === 'TimeoutError') {
  return {
    code: 'NETWORK_ERROR',
    message: 'Network connection lost. Please check your connection.',
    type: 'network',
    recoverable: true,
    timestamp: new Date(),
  };
}
```

#### 5. Data Validation Errors (Client-Side)

**Scenario**: API response doesn't match expected schema

**How it Occurs**:
- Unexpected response structure
- Missing required fields
- Invalid data types

**User-Facing Message**: 
"Received invalid data from server. Please refresh the page."

**Component Response**:
- Log full response for debugging
- Offer page refresh button
- Switch to empty state if partial data corrupted

**Implementation**:
```typescript
private validateResponse(data: any): DashboardDto {
  try {
    return DashboardDtoSchema.parse(data);
  } catch (error) {
    console.error('Invalid dashboard response:', error);
    throw new Error('Invalid response format from server');
  }
}
```

#### 6. Empty State (No Data)

**Scenario**: Valid response but no notes or reports yet

**How it Occurs**:
- New user with no activity
- Date range filter returns no results
- All reports older than 6 months (deleted by cron)

**User-Facing Message**: 
- "No notes yet. Add your first note to get started!"
- "No reports found for this week."
- "No recent activity."

**Component Response**:
- Display helpful empty state UI
- Show action button to create first note/report
- Suggest next steps

**Implementation**:
```typescript
// In template
<div *ngIf="(loading$ | async) === false && categories.length === 0" 
     class="empty-state">
  <p>No notes yet. Click on a category to add your first note!</p>
  <button (click)="onFirstCategoryClick()">Add First Note</button>
</div>
```

### Error Alert Component

Display errors using ng-zorro `NzAlert` component with:
- Error icon
- Error message
- Retry button (if recoverable)
- Dismiss button
- Optional: Contact support link

```typescript
<nz-alert 
  *ngIf="error$ | async as error"
  nzType="error"
  [nzMessage]="error.message"
  [nzDescription]="error.details | json"
  nzCloseable
  (nzOnClose)="onErrorDismiss()"
  [nzShowIcon]="true">
  <ng-container *nzAlertDescription>
    <p>{{ error.message }}</p>
    <button *ngIf="error.recoverable" (click)="retry()">Retry</button>
    <a href="/support">Contact Support</a>
  </ng-container>
</nz-alert>
```

### Retry Strategy

**Max Retries**: 3 attempts

**Retry Delay**: Exponential backoff
- Attempt 1: 1 second delay
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay

**Retry Conditions**:
- Network errors: Always retry
- Timeout errors: Always retry
- 5xx server errors: Retry with backoff
- 4xx client errors: Don't retry (except timeout/network)

**Implementation**:
```typescript
.pipe(
  retry({
    count: 3,
    delay: (error, retryCount) => {
      if (this.isRetryableError(error)) {
        const delayMs = Math.pow(2, retryCount - 1) * 1000;
        console.log(`Retrying request, attempt ${retryCount}, delay ${delayMs}ms`);
        return timer(delayMs);
      }
      throw error;
    }
  })
)

private isRetryableError(error: any): boolean {
  return error.status === 0 || 
         error.name === 'TimeoutError' || 
         error.status >= 500;
}
```

---

## 11. Implementation Steps

### Step 1: Create Dashboard Service

**File**: `src/app/services/dashboard.service.ts`

**Create service** with methods:
- `fetchDashboard(query?: DashboardQuery): Observable<DashboardDto>`
- `refreshDashboardIfNeeded(): void`
- `invalidateCache(): void`
- Private helper methods for cache management and error handling

**Responsibilities**:
- Fetch data from `/api/dashboard` endpoint
- Manage caching with 5-minute TTL
- Handle errors and expose error state
- Provide BehaviorSubjects for reactive data flow
- Transform API response to view models

**Implementation Details**:
- Use HttpClient with timeout and retry operators
- Store last refresh timestamp
- Expose observables: `data$`, `loading$`, `error$`
- Validate response with Zod schema

### Step 2: Create View Model Types

**File**: `src/app/models/dashboard.models.ts`

**Define types**:
- `DashboardViewModel`
- `CategoryCardViewModel`
- `StreakData`
- `ReportPaginationState`
- `FormattedReportItem`
- `ErrorState`
- `CATEGORY_COLOR_MAP` constant

**Responsibilities**:
- Export all types needed by dashboard components
- Provide color and icon mapping for categories
- Document each type with JSDoc comments

### Step 3: Create Dashboard Component (Main)

**File**: `src/app/views/dashboard/dashboard.component.ts`

**Component Setup**:
- Use OnInit lifecycle hook
- Inject DashboardService, Router, ActivatedRoute, AuthService
- Define component-level state variables
- Implement error handling and retry logic

**Key Methods**:
- `ngOnInit()`: Verify auth, fetch initial data
- `loadDashboard()`: Fetch dashboard data and transform to view models
- `onCategoryClick(categoryId: UUID)`: Navigate to category notes view
- `onReportClick(reportId: UUID)`: Navigate to report detail view
- `onGenerateReportClick()`: Show report generation modal/page
- `onLoadMoreReports()`: Fetch next page of reports for infinite scroll
- `onFilterChange(week: DateRange)`: Update report filter and reload
- `retry()`: Retry failed data fetch
- `private invalidateDashboard()`: Listen for cache invalidation events

**Template Structure**:
- Loading skeleton during fetch
- Error alert (if error state)
- Header component
- Summary section (streak + categories)
- Report history section with infinite scroll

### Step 4: Create Dashboard Header Component

**File**: `src/app/views/dashboard/components/dashboard-header.component.ts`

**Features**:
- Display "Dashboard" title
- Show user greeting
- "Generate Report" button (primary action)
- Responsive layout

**Props**:
- `userName: string`
- `onGenerateReport: () => void`
- `canGenerateReport?: boolean`
- `isGeneratingReport?: boolean`

### Step 5: Create Streak Display Component

**File**: `src/app/views/dashboard/components/streak-display.component.ts`

**Features**:
- Display current streak count with flame icon
- Show "Day Streak" label
- Optional: Previous/best streak comparison
- Color-coded based on streak length

**Props**:
- `streakDays: number`
- `lastNoteDate?: string`

### Step 6: Create Category Card Component

**File**: `src/app/views/dashboard/components/category-card.component.ts`

**Features**:
- Reusable card for each category
- Display category icon, name, note count
- NzProgress bar showing progress toward daily goal
- Color-coded by category
- Click handler for navigation

**Props**:
- `category: CategoryCardViewModel`
- `onCategoryClick: (categoryId: UUID) => void`

**Template**:
```html
<div class="category-card" [ngClass]="'category-' + category.name.toLowerCase()"
     (click)="onCategoryClick(category.id)" (keydown.enter)="onCategoryClick(category.id)"
     tabindex="0" role="button" [attr.aria-label]="category.name">
  <div class="card-header">
    <i nz-icon [nzType]="category.icon" [nzTheme]="'outline'"></i>
    <span class="category-name">{{ category.name }}</span>
  </div>
  <div class="card-content">
    <span class="note-count">{{ category.noteCount }} notes</span>
    <nz-progress [nzPercent]="category.progressPercent" 
                 nzShowInfo="false"
                 [nzStrokeColor]="category.color"></nz-progress>
  </div>
</div>
```

### Step 7: Create Category Grid Component

**File**: `src/app/views/dashboard/components/category-grid.component.ts`

**Features**:
- Container for 6 category cards
- Responsive grid layout (3-2-1 columns)
- Passes click events to parent

**Props**:
- `categories: CategoryCardViewModel[]`
- `onCategoryClick: (categoryId: UUID) => void`

**Styles**:
- CSS Grid with responsive columns
- Consistent spacing between cards

### Step 8: Create Dashboard Summary Component

**File**: `src/app/views/dashboard/components/dashboard-summary.component.ts`

**Features**:
- Container combining streak display and category grid
- Section title: "Your Progress"
- Passes events to parent

**Props**:
- `summary: DashboardSummaryDto`
- `categories: CategoryCardViewModel[]`
- `onCategoryClick: (categoryId: UUID) => void`

### Step 9: Create Report History Component

**File**: `src/app/views/dashboard/components/report-history.component.ts`

**Features**:
- Display recent reports in scrollable list
- Week filter dropdown (optional)
- Infinite scroll handling
- Empty state
- Loading indicator for pagination

**Props**:
- `reports: RecentReportDto[]`
- `onReportClick: (reportId: UUID) => void`
- `onLoadMore: () => void`
- `isLoading?: boolean`
- `error?: string`

**Template**:
```html
<section class="report-history">
  <div class="report-history-header">
    <h2>Your Reports</h2>
    <select (change)="onFilterChange($event)" 
            [disabled]="isLoading"
            aria-label="Filter reports by week">
      <option value="">All time</option>
      <option value="this-week">This week</option>
      <option value="last-week">Last week</option>
    </select>
  </div>
  
  <div class="report-list" infiniteScroll
       [infiniteScrollDistance]="2"
       [infiniteScrollThrottle]="500"
       (scrolled)="onLoadMore()">
    <report-item *ngFor="let report of reports"
                 [report]="report"
                 (viewReport)="onReportClick($event)">
    </report-item>
  </div>
  
  <div *ngIf="reports.length === 0 && !isLoading" class="empty-state">
    <p>No reports yet. Generate your first report to get started!</p>
  </div>
  
  <div *ngIf="error" class="error-message">
    {{ error }}
    <button (click)="retry()">Retry</button>
  </div>
</section>
```

### Step 10: Create Report Item Component

**File**: `src/app/views/dashboard/components/report-item.component.ts`

**Features**:
- Display individual report metadata
- Generated-by badge (Scheduled/On-Demand)
- Formatted date in user's timezone
- View button or clickable row

**Props**:
- `report: RecentReportDto`
- `onViewReport: (reportId: UUID) => void`

**Template**:
```html
<div class="report-item" (click)="onViewReport(report.id)"
     (keydown.enter)="onViewReport(report.id)"
     tabindex="0" role="button" [attr.aria-label]="'View report from ' + (report.created_at | date)">
  <div class="report-date">
    {{ report.created_at | date: 'mediumDate' }}
  </div>
  <span class="generated-by-badge" 
        [ngClass]="'badge-' + report.generated_by">
    {{ report.generated_by === 'scheduled' ? 'Scheduled' : 'On-Demand' }}
  </span>
  <button nz-button nzType="primary" nzSize="small">View</button>
</div>
```

### Step 11: Create Loading Skeleton Component

**File**: `src/app/views/dashboard/components/dashboard-skeleton.component.ts`

**Features**:
- Skeleton layout matching dashboard structure
- Header skeleton
- 6 category card skeletons (3-column grid)
- Report list skeletons (5-10 items)
- Animated loading state

**Template**:
```html
<div class="dashboard-skeleton">
  <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 1 }"></nz-skeleton>
  
  <div class="category-grid-skeleton">
    <nz-skeleton *ngFor="let i of [1,2,3,4,5,6]" 
                 [nzActive]="true" 
                 [nzParagraph]="{ rows: 3 }"></nz-skeleton>
  </div>
  
  <nz-skeleton [nzActive]="true" 
               [nzParagraph]="{ rows: 10 }"></nz-skeleton>
</div>
```

### Step 12: Create Error Alert Component

**File**: `src/app/views/dashboard/components/error-alert.component.ts`

**Features**:
- Display error message
- Show error details (if validation error)
- Retry button (if recoverable)
- Dismiss button
- Error-specific messaging

**Props**:
- `error: ErrorState`
- `onRetry: () => void`
- `onDismiss: () => void`

### Step 13: Add Cache Invalidation Listeners

**Files to Update**:
- `src/app/services/notes.service.ts`: Add subject emissions on CRUD
- `src/app/services/reports.service.ts`: Add subject emission on generate
- `src/app/views/dashboard/dashboard.component.ts`: Subscribe to invalidation events

**Implementation**:
```typescript
// In notes.service.ts
noteCreated$ = new Subject<UUID>();
noteUpdated$ = new Subject<UUID>();
noteDeleted$ = new Subject<UUID>();

// After createNote, updateNote, deleteNote methods
this.noteCreated$.next(note.id);
```

```typescript
// In dashboard.component.ts
this.notesService.noteCreated$.subscribe(() => {
  this.dashboardService.invalidateCache();
  this.loadDashboard();
});
```

### Step 14: Add Dashboard Route

**File**: `src/app/app.routes.ts`

**Add route**:
```typescript
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard],
  data: { title: 'Dashboard - LifeSync' }
}
```

### Step 15: Create HTTP Interceptor for Auth

**File**: `src/app/interceptors/auth.interceptor.ts`

**Features**:
- Automatically attach JWT token to requests
- Handle 401 responses by redirecting to login
- Add request timeout

**Implementation**:
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next.handle(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
```

### Step 16: Add Infinite Scroll Implementation

**Install Package** (if not already installed):
```bash
npm install ngx-infinite-scroll
```

**Import in module**: 
```typescript
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
```

**Use in report history template**:
```html
<div infiniteScroll
     [infiniteScrollDistance]="2"
     [infiniteScrollThrottle]="500"
     (scrolled)="onLoadMore()">
  <!-- Report items -->
</div>
```

### Step 17: Add Zod Schema for Validation

**File**: `src/app/validation/dashboard.validation.ts`

**Create schemas**:
```typescript
import { z } from 'zod';

export const DashboardDtoSchema = z.object({
  summary: z.object({
    active_categories: z.array(z.string().uuid()),
    notes_count: z.record(z.string().uuid(), z.number().nonnegative().int()),
    streak_days: z.number().nonnegative().int(),
  }),
  recent_reports: z.array(z.object({
    id: z.string().uuid(),
    generated_by: z.enum(['scheduled', 'on_demand']),
    created_at: z.string().datetime(),
  })),
});

export const DashboardQuerySchema = z.object({
  timezone: z.string().refine(isValidTimezone, 'Invalid timezone').optional(),
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidPastDate, 'Must be valid past date').optional(),
});
```

### Step 18: Style Dashboard with Tailwind

**File**: `src/app/views/dashboard/dashboard.component.scss`

**Key styles**:
- Responsive grid for categories (3-2-1 columns)
- Card styling with shadows and hover effects
- Streak counter styling
- Report list styling
- Color-coded category cards
- Responsive layout adjustments

### Step 19: Testing

**Create Unit Tests**:
- `dashboard.component.spec.ts`: Component initialization, data loading, error handling
- `dashboard.service.spec.ts`: Data fetching, caching, cache invalidation
- `category-card.component.spec.ts`: Component rendering, click handling
- `report-item.component.spec.ts`: Report rendering, click handling

**Test Coverage Areas**:
- Happy path: Load dashboard, display data correctly
- Error scenarios: 401, 400, 500, network errors
- Cache validation: Fresh cache, stale cache, invalidation
- User interactions: Category click, report click, infinite scroll
- Accessibility: Keyboard navigation, ARIA labels
- Responsive layout: Mobile, tablet, desktop viewports

**Integration Tests**:
- Full dashboard flow: Route → Load → Display → Interact
- Cache invalidation triggers: Note CRUD → Dashboard refresh
- Infinite scroll: Load initial → Scroll → Load more

### Step 20: Performance Optimization

**Implement**:
- OnPush change detection strategy for category cards
- Lazy loading for report history (infinite scroll)
- Memoization of view model transformations
- CSS containment for card components
- Virtual scrolling for large report lists (if needed)

**Verification**:
- Dashboard must load in < 2 seconds (use Chrome DevTools Lighthouse)
- No layout shifts after data loads (Cumulative Layout Shift)
- Smooth infinite scroll without jank

---

## Additional Considerations

### Timezone Handling

The dashboard must correctly handle user timezones for streak calculation. A note created at 23:30 UTC on Jan 6 should count as Jan 6 for a Warsaw user (UTC+1).

**Implementation**:
- Pass user's timezone to API via query parameter
- API calculates streak in user's local timezone
- Frontend displays streak relative to user's current date
- Format all dates/times using user's timezone

### Caching Strategy

**HTTP Cache**:
- Backend sets `Cache-Control: private, max-age=300`
- Browser automatically caches for 5 minutes
- Browser caches are cleared on hard refresh

**Client-Side Cache**:
- Store last fetch time in DashboardService
- Check freshness before fetching
- Invalidate on data mutations

**Optional: Server-Side Cache (Redis)**:
- Implement Redis caching if high load observed
- Key: `dashboard:${userId}`
- TTL: 5 minutes
- Invalidate on mutations

### Accessibility

**WCAG 2.1 AA Compliance**:
- Category cards keyboard accessible (tabindex="0", enter/space to activate)
- Report items keyboard accessible (same as cards)
- Proper ARIA labels on interactive elements
- Color not sole indicator of information (streak levels, badges)
- Form fields have associated labels
- Error messages clearly associated with fields
- Skip to main content link

**Screen Reader Support**:
- Semantic HTML: `<section>`, `<header>`, `<main>`
- Role attributes where needed
- ARIA live regions for error messages
- Alt text for icons (or hidden from screen readers if decorative)

### Performance Targets

- **Dashboard Load Time**: < 2 seconds (P95)
- **First Contentful Paint**: < 1 second
- **Time to Interactive**: < 2 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1

### Security

- **Data Exposure**: Only display user's own data (RLS enforced on backend)
- **XSS Prevention**: Use Angular's built-in sanitization for dynamic content
- **CSRF Protection**: Use ng-zorro forms with CSRF tokens
- **Auth Token Storage**: Store in HttpOnly cookies (handled by backend)
- **Rate Limiting**: Respect backend rate limits; show user-friendly messages

