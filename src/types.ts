import { Enums, Tables, TablesUpdate, TablesInsert } from './db/database.types';

// Alias for UUIDs as strings (Supabase exposes UUIDs as strings in generated types)
export type UUID = string;

// ==========================
// Common Envelopes and Enums
// ==========================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ErrorResponseDto {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type CategorySort = 'name_asc' | 'name_desc';
export type NotesSort =
  | 'created_at_desc'
  | 'created_at_asc'
  | 'updated_at_desc';
export type ReportsSort = 'created_at_desc' | 'created_at_asc';

// Narrowed enum aliases sourced from DB to ensure coupling to schema
export type DeliveryChannel = Enums<'delivery_channel_type'>; // 'in_app' | 'email'
export type DeliveryStatus = Enums<'delivery_status_type'>; // 'queued' | 'sent' | 'opened'
export type GeneratedBy = Enums<'generated_by_type'>; // 'scheduled' | 'on_demand'

// ==============
// Auth / Session
// ==============

export interface MeResponseDto {
  userId: UUID;
  email: string;
  emailVerified: boolean;
  hasProfile: boolean;
  hasPreferences: boolean;
}

export interface SignInSessionDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'bearer';
}

export interface SignInUserDto {
  id: UUID;
  email: string;
  email_confirmed_at: string | null;
}

export interface SignInResponseDto {
  user: SignInUserDto;
  session: SignInSessionDto;
}

// Registration-specific types
export interface SignUpFormValue {
  email: string; // User's email address, used for registration
  password: string; // User's plaintext password
  confirmPassword: string; // Confirmation password field (frontend only)
}

export interface PasswordStrengthResult {
  score: number; // 0-4 strength score
  level: 'weak' | 'fair' | 'good' | 'strong'; // Strength level
  feedback: string[]; // Array of improvement suggestions
  criteria: {
    hasMinLength: boolean; // Meets minimum length (6+ chars)
    hasUppercase: boolean; // Contains uppercase letters
    hasLowercase: boolean; // Contains lowercase letters
    hasNumbers: boolean; // Contains numeric digits
    hasSpecialChars: boolean; // Contains special characters
  };
}

export interface RegistrationViewState {
  isLoading: boolean; // True during API call
  error: LoginError | null; // Current error, if any
  formValue: SignUpFormValue; // Current form values
  isSuccess: boolean; // True after successful registration
  registeredEmail: string | null; // Email used for successful registration
  user: SignInUserDto | null; // Registered user info from API response
  passwordStrength: PasswordStrengthResult | null; // Current password strength analysis
}

// ==================
// Login View Models
// ==================

export interface SignInRequest {
  email: string;
  password: string;
}

export interface LoginError {
  code:
    | 'VALIDATION_ERROR'
    | 'INVALID_CREDENTIALS'
    | 'SERVER_ERROR'
    | 'UNVERIFIED_EMAIL'
    | 'RATE_LIMITED'
    | 'NETWORK_ERROR'
    | 'EMAIL_EXISTS'
    | 'WEAK_PASSWORD';
  message: string;
  details?: {
    field?: string;
    reason?: string;
    retryAfter?: number;
    action?: string;
  };
}

export interface LoginFormValue {
  email: string;
  password: string;
}

export interface LoginViewState {
  isLoading: boolean;
  error: LoginError | null;
  formValue: LoginFormValue;
  emailValidated: boolean;
  lastAttemptTime?: Date;
}

// Request type for sign-up endpoint
export interface SignUpRequest {
  email: string; // Valid email address, must be unique
  password: string; // Non-empty password, min 6 chars (enforced by Supabase)
}

// =========
// Profiles
// =========

// DTO mirrors DB row shape for stable API contract
export type ProfileDto = Pick<
  Tables<'profiles'>,
  'user_id' | 'timezone' | 'created_at' | 'updated_at'
>;

// Command accepts only the updatable field(s)
export type UpdateProfileCommand = Required<
  Pick<TablesUpdate<'profiles'>, 'timezone'>
>;

// ===========
// Categories
// ===========

export type CategoryDto = Tables<'categories'>;

export interface ListCategoriesQuery {
  active?: boolean; // default true
  sort?: CategorySort; // default 'name_asc'
  limit?: number; // default 20, max 100
  offset?: number; // default 0
}

export type ListCategoriesResponseDto = PaginatedResponse<CategoryDto>;

// ============
// Preferences
// ============

export type PreferencesDto = Tables<'preferences'>;

// Make update fields required at the API boundary; DB-level defaults/validation still apply
export type UpdatePreferencesCommand = Required<
  Pick<
    TablesUpdate<'preferences'>,
    | 'active_categories'
    | 'report_dow'
    | 'report_hour'
    | 'preferred_delivery_channels'
    | 'email_unsubscribed_at'
    | 'max_daily_notes'
  >
> & {
  // Ensure element-level coupling with DB enums and UUIDs
  active_categories: UUID[];
  preferred_delivery_channels: DeliveryChannel[];
};

/**
 * PreferencesViewState
 * Internal state type for the Preferences View component
 * Tracks UI state, form state, and data loading
 */
export interface PreferencesViewState {
  // Data from API
  preferences: PreferencesDto | null;
  categories: CategoryDto[];

  // UI State
  isLoading: boolean;
  isSaving: boolean;
  isSuccess: boolean;

  // Form State
  formValue: UpdatePreferencesCommand | null;
  isDirty: boolean;

  // Error State
  error: ErrorResponseDto | null;
  validationErrors: Record<string, string>;
}

/**
 * DayOfWeekOption
 * Represents a selectable day of week for report scheduling
 */
export interface DayOfWeekOption {
  value: number; // 0-6 (0 = Monday)
  label: string; // e.g., "Monday", "Tuesday", etc.
}

/**
 * HourOption
 * Represents a selectable hour for report scheduling
 */
export interface HourOption {
  value: number; // 0-23
  label: string; // e.g., "00:00 (Midnight)", "14:00 (2:00 PM)"
}

// =====
// Notes
// =====

export type NoteDto = Tables<'notes'>;

export interface ListNotesQuery {
  category_id?: UUID | UUID[]; // supports single, repeated, or comma-separated upstream
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  include_deleted?: boolean; // default false
  limit?: number; // default 20, max 100
  offset?: number; // default 0
  sort?: NotesSort; // default 'created_at_desc'
}

export type ListNotesResponseDto = PaginatedResponse<NoteDto>;

export type CreateNoteCommand = Pick<
  TablesInsert<'notes'>,
  'category_id' | 'title' | 'content'
>;

export type UpdateNoteCommand = Pick<
  TablesUpdate<'notes'>,
  'category_id' | 'title' | 'content'
>;

// =========
// Dashboard
// =========

export interface DashboardQuery {
  timezone?: string; // default profile timezone
  since?: string; // ISO date range start (default 4 weeks)
}

export interface DashboardSummaryDto {
  categories: (CategoryDto & { notes_count: number })[];
  streak_days: number;
}

export type RecentReportDto = Pick<
  Tables<'reports'>,
  'id' | 'generated_by' | 'created_at'
>;

export interface DashboardDto {
  summary: DashboardSummaryDto;
  recent_reports: RecentReportDto[];
}

// =======
// Reports
// =======

export type ReportDto = Tables<'reports'>;

export interface ListReportsQuery {
  week_start_local?: string; // YYYY-MM-DD
  generated_by?: GeneratedBy;
  include_deleted?: boolean; // default false
  limit?: number; // default 20, max 100
  offset?: number; // default 0
  sort?: ReportsSort; // default 'created_at_desc'
}

export type ListReportsResponseDto = PaginatedResponse<ReportDto>;

export interface GenerateReportCommand {
  include_categories: UUID[];
}

// =================
// Report Deliveries
// =================

export type ReportDeliveryDto = Tables<'report_deliveries'>;

export interface ListReportDeliveriesQuery {
  report_id?: UUID;
  channel?: DeliveryChannel;
  status?: DeliveryStatus;
  limit?: number; // default 20, max 100
  offset?: number; // default 0
}

export type ListReportDeliveriesResponseDto =
  PaginatedResponse<ReportDeliveryDto>;

export interface EmailDeliveryResponseDto {
  delivery: Pick<ReportDeliveryDto, 'id' | 'status' | 'channel'>;
}

// ===============
// Report Feedback
// ===============

export type ReportFeedbackDto = Tables<'report_feedback'>;

export type SubmitFeedbackCommand = Pick<
  TablesInsert<'report_feedback'>,
  'report_id' | 'rating' | 'comment'
>;

// =========
// Analytics
// =========

// Align to DB row for GET responses
export type AnalyticsEventDto = Tables<'analytics_events'>;

// Client-side command excludes server-owned fields
export type RecordAnalyticsEventCommand = Omit<
  TablesInsert<'analytics_events'>,
  'user_id'
> & {
  source: 'web' | 'api';
};

export interface ListAnalyticsEventsQuery {
  event_name?: string;
  from?: string; // ISO datetime
  to?: string; // ISO datetime
  limit?: number; // default 20, max 100
  offset?: number; // default 0
}

export type AnalyticsEventsListResponseDto =
  PaginatedResponse<AnalyticsEventDto>;

export type AnalyticsEventResponseDto = Pick<AnalyticsEventDto, 'id'>;

// ========================
// Report List View Models
// ========================

/**
 * ReportListItemViewModel
 * Represents a single report item for display in the reports list
 */
export interface ReportListItemViewModel {
  id: UUID; // Unique report identifier (UUID string)
  generatedBy: GeneratedBy; // 'scheduled' | 'on_demand'
  createdAt: Date; // Report creation timestamp (ISO string converted to Date)
  deliveryChannel: DeliveryChannel; // 'email' | 'in_app'
  deliveryStatus: DeliveryStatus; // 'queued' | 'sent' | 'opened'
  categoriesSnapshot: {
    // Categories included in this report
    id: UUID;
    name: string;
  }[];
}

/**
 * ReportListFilters
 * Represents the current filter and sort state applied to the report list
 */
export interface ReportListFilters {
  weekStart?: string; // ISO date in YYYY-MM-DD format (e.g., "2025-01-06")
  sort: ReportsSort; // 'created_at_desc' | 'created_at_asc'
  generatedBy?: GeneratedBy; // Optional: filter by 'scheduled' | 'on_demand'
}

/**
 * ReportListViewState
 * Represents the complete state of the report list view
 */
export interface ReportListViewState {
  reports: ReportListItemViewModel[]; // Currently loaded reports (accumulated across pages)
  isLoading: boolean; // True while fetching initial batch
  isLoadingMore: boolean; // True while fetching additional batch via pagination
  hasMore: boolean; // True if more reports available beyond current offset
  error: ErrorResponseDto | null; // Current error, if any (null if no error)
  currentOffset: number; // Current pagination offset (e.g., 0, 20, 40)
  totalCount: number; // Total reports available (from API response)
  filters: ReportListFilters; // Current active filters
}

/**
 * ReportListItemDisplayData
 * Extended view model for template rendering with pre-formatted display strings
 */
export type ReportListItemDisplayData = ReportListItemViewModel & {
  createdAtFormatted: string; // Formatted date (e.g., "Jan 06, 2025 at 2:00 AM")
  generatedByLabel: string; // Display label ("Scheduled" or "On-Demand")
  deliveryChannelLabel: string; // Display label ("Email" or "In-App")
  deliveryChannelIcon: string; // Icon code or class ("mail" for email, "inbox" for in-app)
  deliveryStatusLabel: string; // Display label ("Queued", "Sent", or "Opened")
  deliveryStatusColor: 'default' | 'success' | 'warning' | 'error'; // For ng-zorro badge color
};

/**
 * WeekOption
 * Represents a selectable week for report filtering
 */
export interface WeekOption {
  label: string; // Display label (e.g., "Week of Jan 6, 2025")
  value: string; // ISO date YYYY-MM-DD
}

// =====================
// Add Note Modal Types
// =====================

/**
 * AddNoteFormValue
 * Local form state model for the add note form
 */
export interface AddNoteFormValue {
  title: string | null; // Optional note title (null or string, max 255 chars)
  content: string; // Required note content (1-1000 characters)
}

/**
 * AddNoteError
 * Error state model mapping backend error codes to user-friendly messages
 */
export interface AddNoteError {
  code: string; // Backend error code ('VALIDATION_ERROR', 'CATEGORY_NOT_ACTIVE', etc.)
  message: string; // User-friendly error message for display
  details?: Record<string, unknown>; // Additional error details (field-specific errors, limit info)
  status: number; // HTTP status code (422, 403, 409, 500, etc.)
}

/**
 * AddNoteModalState
 * Component state for the modal managing UI state, form state, and error state
 */
export interface AddNoteModalState {
  isOpen: boolean; // Modal visibility state
  isSubmitting: boolean; // True while API call in progress
  error: AddNoteError | null; // Current error state (null if no error)
  formValue: AddNoteFormValue; // Current form values
  selectedCategoryId: UUID | null; // Category user is adding note to
}
