# Note Detail View Implementation Plan

## 1. Overview

The Note Detail View is a focused, single-note display page that allows authenticated users to view, edit, and delete individual notes. The view serves as a bridge between the dashboard's overview and detailed note management, providing a dedicated space for viewing note content with associated metadata (creation/modification dates) and performing CRUD operations on that specific note.

The view is accessed when a user clicks on a note from either the category cards on the dashboard or from a notes list view, navigating to `/notes/:noteId`. It presents the full note content in a clean, readable format and offers contextual actions for editing and deletion.

---

## 2. View Routing

**Route Path**: `/notes/:noteId`

**Route Parameters:**
- `noteId` (UUID string) - The unique identifier of the note to display

**Navigation Flow:**
- **Incoming**: From dashboard category cards or notes list view via `router.navigate(['/notes', noteId])`
- **Outgoing**: 
  - Back to previous route via browser back button
  - To dashboard via `router.navigate(['/dashboard'])` after note deletion
  - Implicit reload of current view when note is updated

**Route Guards:**
- Requires `AuthGuard` to verify user authentication (existing guard)
- Authorization is handled at API level (note ownership verification)

---

## 3. Component Structure

```
NoteDetailContainer (Smart Component)
├── NoteContentDisplay (Presentational Component)
├── NoteActions (Presentational Component)
├── EditNoteModal (Modal Component)
└── NoteDeleteConfirmationModal (ng-zorro Modal - inline)
```

**Hierarchy Explanation:**
- **NoteDetailContainer** orchestrates the entire view, managing state, API calls, and modal flows
- **NoteContentDisplay** presents formatted note data without state management
- **NoteActions** provides edit/delete buttons; emits events to parent container
- **EditNoteModal** wraps the reusable add-note-form component with pre-filled edit context
- **Delete confirmation** handled via ng-zorro's `NzModalService` directly in container for simplicity

---

## 4. Component Details

### 4.1 NoteDetailContainer

**Component Description:**
Smart/container component that serves as the main view. It fetches the note data from the API, manages all state (loading, error, modals), orchestrates sub-components, and handles all user interactions (edit, delete, navigation).

**Main Elements:**
- Root `<div>` with Tailwind layout classes
- Top navigation section: Back button (browser back or programmatic) + page title
- Content section containing `<app-note-content-display>`
- Action section containing `<app-note-actions>`
- Conditional `<app-edit-note-modal>` component
- Modal placeholder for delete confirmation (rendered via `NzModalService`)

**Handled Interactions:**
1. **Component Initialization**: Fetch note data from API on route parameter change
2. **Edit Action**: Open edit modal when user clicks edit button (emitted from NoteActions)
3. **Edit Submission**: Submit updated note to API, close modal, refresh note data
4. **Delete Action**: Open delete confirmation modal when user clicks delete (emitted from NoteActions)
5. **Delete Confirmation**: Submit delete request to API, navigate to dashboard
6. **Modal Close**: Close modals without action when user cancels
7. **Back Navigation**: Return to previous route (default browser behavior)

**Handled Validation:**
- **Note Existence (404)**: Display error state if note not found
- **Authorization (401)**: Display error state if user doesn't own the note
- **Form Validation on Edit**: 
  - Title: optional, max 255 characters (enforced by input)
  - Content: required, 1-1000 characters (enforced by input and API)
  - Category: must be active in user preferences (verified by API, error shown to user)
- **Category Active Status**: When editing, if category is no longer active (403), display error message
- **Daily Limit (409)**: If user has already created max notes for category today and is editing to a new category, show error
- **Network Errors**: Display generic error message for network/server errors

**Types:**
- `NoteDetailViewState` (Custom ViewModel - see Types section)
- `NoteDetailViewModel` (Custom ViewModel - see Types section)
- `NoteDto` (from API response)
- `UpdateNoteCommand` (for API request)
- `AddNoteError` (from services for error handling)

**Props/Inputs:**
- None (data fetched from route parameters and API)

**Outputs/Events:**
- None (navigation handled internally)

---

### 4.2 NoteContentDisplay

**Component Description:**
Presentational component that renders the note's content and metadata in a clean, readable format. Responsible only for display—no state management or API calls. Receives formatted note data and renders it with appropriate styling.

**Main Elements:**
- `<div class="note-title">` - Renders note title (or "Untitled Note" if null)
- `<div class="note-content">` - Renders note content with word-wrapping and line-height for readability
- `<div class="note-metadata">` - Displays creation date, modification date, and category name
- All elements use Tailwind utility classes for responsive design and spacing
- Metadata dates formatted via pipe or component logic (e.g., "Jan 15, 2025 at 2:30 PM")

**Handled Interactions:**
- Display only; no interactions (read-only presentation)

**Handled Validation:**
- None (receives pre-validated data from parent)

**Types:**
- `NoteDetailViewModel` (input)

**Props:**
```typescript
@Input() note: NoteDetailViewModel | null = null;
@Input() isLoading: boolean = false;
```

---

### 4.3 NoteActions

**Component Description:**
Presentational component that provides Edit and Delete action buttons. Emits events to parent container when buttons are clicked. No state management—only renders buttons and emits events.

**Main Elements:**
- `<div class="actions-container">` - Flex container for buttons
- `<button class="edit-button">` - Edit button with icon (ng-zorro button)
- `<button class="delete-button">` - Delete button with icon (danger/red styling via ng-zorro)
- ARIA labels for accessibility

**Handled Interactions:**
1. Edit button click → emit `@Output() editClicked: EventEmitter<void>`
2. Delete button click → emit `@Output() deleteClicked: EventEmitter<void>`

**Handled Validation:**
- None (no validation in presentational component)

**Types:**
- None (uses only primitives for events)

**Props:**
```typescript
@Input() isLoading: boolean = false;
@Input() isDeleting: boolean = false;
@Output() editClicked = new EventEmitter<void>();
@Output() deleteClicked = new EventEmitter<void>();
```

---

### 4.4 EditNoteModal

**Component Description:**
Modal component for editing an existing note. Wraps/reuses the add-note-form component with pre-filled data and edit-specific context. Emits events for submission or cancellation.

**Main Elements:**
- ng-zorro `<nz-modal>` component as wrapper
- `<app-add-note-form>` component (reused from add-note-modal) with pre-filled form values
- Modal header: "Edit Note" title
- Modal footer: Cancel and Save buttons

**Handled Interactions:**
1. Modal open/close state managed by parent container
2. Form submission → validate and emit submit event with `UpdateNoteCommand`
3. Cancel button → emit cancel event (modal closes in parent)
4. Close icon (X) → emit cancel event

**Handled Validation:**
- Form validation delegated to add-note-form component (title optional, content required 1-1000 chars)
- Category selection available (user can change category, but must be active)

**Types:**
- `UpdateNoteCommand` (for form submission)
- `AddNoteFormValue` (form state)
- `AddNoteError` (for displaying form errors)
- `NoteDetailViewModel` (to pre-fill form)

**Props:**
```typescript
@Input() isOpen: boolean = false;
@Input() note: NoteDetailViewModel | null = null;
@Input() isSubmitting: boolean = false;
@Input() error: AddNoteError | null = null;
@Output() submitted = new EventEmitter<UpdateNoteCommand>();
@Output() cancelled = new EventEmitter<void>();
```

---

## 5. Types

### 5.1 NoteDetailViewState (Container State Management)

Represents the complete state of the Note Detail View container.

```typescript
interface NoteDetailViewState {
  // Data from API
  note: NoteDto | null;  // Current note being displayed (null during initial load)
  
  // Loading/Fetching States
  isLoading: boolean;    // True while fetching initial note data
  isUpdating: boolean;   // True while submitting edit (PUT request)
  isDeleting: boolean;   // True while submitting delete (DELETE request)
  
  // Modal States
  isEditModalOpen: boolean;      // Controls visibility of edit modal
  isDeleteConfirmationOpen: boolean; // Controls visibility of delete confirmation
  
  // Form State (for edit modal)
  editFormValue: UpdateNoteCommand | null;  // Current values in edit form
  editFormError: AddNoteError | null;       // Validation errors from form
  
  // Error State
  fetchError: AddNoteError | null;    // Error from initial fetch
  operationError: AddNoteError | null; // Error from edit/delete operations
  
  // UI Feedback
  successMessage: string | null;      // Shown after successful update
}
```

**Field Descriptions:**
- `note`: Stores the fetched note data; null until data arrives
- `isLoading`: Prevents user interactions during initial fetch; shows loading spinner
- `isUpdating/isDeleting`: Disables buttons and shows loading state during operations
- `isEditModalOpen`: Controls conditional rendering of edit modal
- `isDeleteConfirmationOpen`: Controls visibility of delete confirmation dialog
- `editFormValue`: Tracks current form state for edit submissions
- `editFormError`: Stores validation errors from form submission for display to user
- `fetchError`: Displayed in error alert if note fetch fails (404, 401, 500)
- `operationError`: Displayed in error alert if edit/delete operations fail
- `successMessage`: Shown in success notification after edit (auto-dismisses in 3 seconds)

---

### 5.2 NoteDetailViewModel (Display/Formatted Data)

Extends `NoteDto` with computed/formatted display properties for UI rendering.

```typescript
interface NoteDetailViewModel extends NoteDto {
  // Formatted dates for display
  createdAtFormatted: string;   // e.g., "Jan 15, 2025 at 2:30 PM"
  updatedAtFormatted: string;   // e.g., "Jan 16, 2025 at 10:15 AM"
  
  // Category information (resolved from service)
  categoryName: string;         // e.g., "Family", "Friends", "Pets", etc.
  categoryColor: string;        // Tailwind color class for category badge
  
  // Display flags
  isEdited: boolean;            // True if updated_at > created_at
  readableContent: string;      // Content with line breaks preserved
}
```

**Field Descriptions:**
- `createdAtFormatted`: Date formatted using `DatePipe` or utility function; locale-aware
- `updatedAtFormatted`: Same format as createdAtFormatted; shown only if different from createdAt
- `categoryName`: Retrieved from dashboard models or category lookup
- `categoryColor`: Used for visual category identification in badge
- `isEdited`: Computed property; `updated_at !== created_at`; controls visibility of "edited" label
- `readableContent`: Content with proper line-break handling for display

---

### 5.3 Reused Existing Types

**NoteDto** (from `src/types.ts`):
```typescript
type NoteDto = Tables<'notes'>;
// Contains: id, user_id, category_id, title, content, created_at, updated_at, deleted_at
```

**UpdateNoteCommand** (from `src/types.ts`):
```typescript
type UpdateNoteCommand = Pick<
  TablesUpdate<'notes'>,
  'category_id' | 'title' | 'content'
>;
// Used for PUT request payload
```

**AddNoteFormValue** (from `src/types.ts`):
```typescript
interface AddNoteFormValue {
  title: string | null;
  content: string;
}
// Used for form state in edit modal
```

**AddNoteError** (from `src/types.ts`):
```typescript
interface AddNoteError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}
// Used for error handling across container
```

---

## 6. State Management

### 6.1 Approach

The Note Detail View uses a **component-level reactive state management** approach with Angular's `Signal` API (Angular 19 native) or `BehaviorSubject` (if Signals not available). The container component maintains all state and exposes it via computed signals/observables to child components.

### 6.2 State Initialization

```typescript
// In NoteDetailContainer component
private viewState = signal<NoteDetailViewState>({
  note: null,
  isLoading: true,
  isUpdating: false,
  isDeleting: false,
  isEditModalOpen: false,
  isDeleteConfirmationOpen: false,
  editFormValue: null,
  editFormError: null,
  fetchError: null,
  operationError: null,
  successMessage: null,
});

// Derived signals for child component consumption
viewModel = computed(() => this.transformToViewModel(this.viewState().note));
isEditModalOpen = computed(() => this.viewState().isEditModalOpen);
isLoading = computed(() => this.viewState().isLoading);
// ... other computed signals
```

### 6.3 State Updates

State updates occur in response to:

1. **On Component Init / Route Params Change**:
   - Update `isLoading = true`
   - Call `notes.service.getNoteById(noteId)`
   - On success: Update `note`, `isLoading = false`
   - On error: Update `fetchError`, `isLoading = false`

2. **On Edit Button Click**:
   - Update `isEditModalOpen = true`
   - Pre-fill `editFormValue` from current note

3. **On Edit Form Submission**:
   - Update `isUpdating = true`
   - Call `notes.service.updateNote(noteId, command)`
   - On success: Update `note`, `isUpdating = false`, `isEditModalOpen = false`, `successMessage = "Note updated successfully"`
   - On error: Update `editFormError` or `operationError`, `isUpdating = false`
   - Auto-dismiss success message after 3 seconds

4. **On Delete Button Click**:
   - Update `isDeleteConfirmationOpen = true`

5. **On Delete Confirmation**:
   - Update `isDeleting = true`
   - Call `notes.service.deleteNote(noteId)`
   - On success: Update `isDeleting = false`, `isDeleteConfirmationOpen = false`, navigate to `/dashboard`
   - On error: Update `operationError`, `isDeleting = false`

6. **On Modal Close/Cancel**:
   - Update `isEditModalOpen = false` or `isDeleteConfirmationOpen = false`
   - Clear `editFormError`

### 6.4 State Subscriptions

```typescript
// Listen to route params changes
this.route.params.pipe(
  switchMap(params => this.notesService.getNoteById(params['noteId'])),
  takeUntilDestroyed()
).subscribe(
  note => this.viewState.update(state => ({ ...state, note, isLoading: false })),
  error => this.viewState.update(state => ({ ...state, fetchError: error, isLoading: false }))
);
```

### 6.5 Custom Hook (Optional but Recommended)

Create a custom hook `useNoteDetail` to encapsulate state management logic:

```typescript
@Injectable()
export class NoteDetailService {
  constructor(private notesService: NotesService) {}

  loadNote(noteId: UUID): Observable<NoteDetailViewState> {
    return this.notesService.getNoteById(noteId).pipe(
      map(note => ({ note, isLoading: false, fetchError: null })),
      catchError(error => of({ note: null, isLoading: false, fetchError: error }))
    );
  }

  updateNote(noteId: UUID, command: UpdateNoteCommand): Observable<NoteDetailViewState> {
    return this.notesService.updateNote(noteId, command).pipe(
      map(note => ({ note, isUpdating: false, successMessage: 'Note updated successfully' })),
      catchError(error => of({ isUpdating: false, operationError: error }))
    );
  }

  deleteNote(noteId: UUID): Observable<void> {
    return this.notesService.deleteNote(noteId);
  }
}
```

---

## 7. API Integration

### 7.1 Required Service Methods

Assumes `NotesService` exists with these methods (reference implementation plans for details):

```typescript
// In notes.service.ts
getNoteById(noteId: UUID): Observable<NoteDto>;
updateNote(noteId: UUID, command: UpdateNoteCommand): Observable<NoteDto>;
deleteNote(noteId: UUID): Observable<void>;
```

### 7.2 API Request/Response Specification

#### 7.2.1 Fetch Note (GET `/api/notes/{noteId}`)

**Request:**
```http
GET /api/notes/{noteId}
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "650e8400-e29b-41d4-a716-446655440000",
  "category_id": "750e8400-e29b-41d4-a716-446655440000",
  "title": "Weekly Reflection",
  "content": "This week was productive...",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-16T14:20:00Z",
  "deleted_at": null
}
```

**Error Responses:**
- **404 Not Found**: Note doesn't exist or is deleted
  ```json
  { "error": { "code": "NOT_FOUND", "message": "Note not found" } }
  ```
- **401 Unauthorized**: User not authenticated
  ```json
  { "error": { "code": "UNAUTHORIZED", "message": "Missing or invalid token" } }
  ```
- **500 Server Error**: Internal server error

#### 7.2.2 Update Note (PUT `/api/notes/{noteId}`)

**Request:**
```http
PUT /api/notes/{noteId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "category_id": "750e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Title",
  "content": "Updated content with new information..."
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "650e8400-e29b-41d4-a716-446655440000",
  "category_id": "750e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Title",
  "content": "Updated content with new information...",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-16T15:45:00Z",
  "deleted_at": null
}
```

**Error Responses:**
- **400/422 Validation Error**: Invalid input
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Content must be between 1 and 1000 characters",
      "details": { "field": "content" }
    }
  }
  ```
- **403 Forbidden**: Category not active in user preferences
  ```json
  {
    "error": {
      "code": "CATEGORY_NOT_ACTIVE",
      "message": "Selected category is not active in your preferences"
    }
  }
  ```
- **409 Conflict**: Daily limit reached for target category
  ```json
  {
    "error": {
      "code": "DAILY_LIMIT_REACHED",
      "message": "You have reached the maximum notes for this category today"
    }
  }
  ```
- **404 Not Found**: Note doesn't exist
- **401 Unauthorized**: Not authenticated or wrong owner

#### 7.2.3 Delete Note (DELETE `/api/notes/{noteId}`)

**Request:**
```http
DELETE /api/notes/{noteId}
Authorization: Bearer {access_token}
```

**Response (204 No Content):**
```
(empty body)
```

**Error Responses:**
- **404 Not Found**: Note doesn't exist
- **401 Unauthorized**: Not authenticated or wrong owner
- **500 Server Error**: Internal error

### 7.3 Service Integration Pattern

```typescript
// In NoteDetailContainer component
constructor(
  private notesService: NotesService,
  private router: Router,
  private route: ActivatedRoute,
  private message: NzMessageService // ng-zorro for notifications
) {}

ngOnInit() {
  // Fetch note on init
  this.route.params.pipe(
    switchMap(params => this.notesService.getNoteById(params['noteId'])),
    takeUntilDestroyed()
  ).subscribe({
    next: (note) => {
      this.viewState.update(state => ({
        ...state,
        note,
        isLoading: false
      }));
    },
    error: (error) => {
      this.viewState.update(state => ({
        ...state,
        fetchError: this.mapErrorToAddNoteError(error),
        isLoading: false
      }));
    }
  });
}

onEditSubmitted(command: UpdateNoteCommand) {
  this.viewState.update(state => ({ ...state, isUpdating: true }));
  this.notesService.updateNote(this.noteId, command).subscribe({
    next: (updatedNote) => {
      this.viewState.update(state => ({
        ...state,
        note: updatedNote,
        isUpdating: false,
        isEditModalOpen: false,
        successMessage: 'Note updated successfully'
      }));
      this.message.success('Note updated successfully');
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        this.viewState.update(state => ({ ...state, successMessage: null }));
      }, 3000);
    },
    error: (error) => {
      this.viewState.update(state => ({
        ...state,
        operationError: this.mapErrorToAddNoteError(error),
        isUpdating: false
      }));
    }
  });
}

onDeleteConfirmed() {
  this.viewState.update(state => ({ ...state, isDeleting: true }));
  this.notesService.deleteNote(this.noteId).subscribe({
    next: () => {
      this.message.success('Note deleted successfully');
      this.router.navigate(['/dashboard']);
    },
    error: (error) => {
      this.viewState.update(state => ({
        ...state,
        operationError: this.mapErrorToAddNoteError(error),
        isDeleting: false
      }));
    }
  });
}
```

---

## 8. User Interactions

### 8.1 View Note Details

**User Action**: Navigate to `/notes/:noteId` (via dashboard click or direct URL)

**Expected Outcome:**
1. Loading spinner appears
2. API call to `GET /api/notes/{noteId}` initiated
3. On success: Note content, title, and metadata display; loading spinner disappears
4. On error: Error message displays (e.g., "Note not found" for 404, "Access denied" for 401)

**Implementation Detail:**
- Triggered by `ngOnInit` via route parameter subscription
- Loading state prevents any interaction until note loads

---

### 8.2 Edit Note

**User Action**: Click Edit button on Note Actions component

**Expected Outcome:**
1. Edit modal opens
2. Form is pre-filled with current note data (title, content, category)
3. User modifies form fields

**Form Submission (User clicks Save):**
1. Form validation occurs (title optional, content required 1-1000 chars)
2. If validation fails: Error message displayed in form
3. If validation passes: 
   - Loading state applied to Save button
   - API call to `PUT /api/notes/{noteId}` with `UpdateNoteCommand`
4. On success:
   - Modal closes
   - Note content refreshes in main view
   - Success message shown: "Note updated successfully"
   - Success message auto-dismisses after 3 seconds
5. On error:
   - Modal remains open
   - Error message displayed in modal (e.g., "Category not active", "Daily limit reached", "Validation error")
   - Save button re-enabled

**Cancel Action:**
- User clicks Cancel or Close (X) button
- Modal closes without saving
- Form data discarded

---

### 8.3 Delete Note

**User Action**: Click Delete button on Note Actions component

**Expected Outcome:**
1. Delete confirmation modal/dialog opens
2. Displays warning message: "Are you sure you want to delete this note? This action cannot be undone."
3. Two buttons: Cancel and Confirm Delete

**Confirmation (User clicks Confirm):**
1. Loading state applied to Confirm button
2. API call to `DELETE /api/notes/{noteId}` initiated
3. On success:
   - Confirmation modal closes
   - Success message shown: "Note deleted successfully"
   - User navigated to `/dashboard` after 1-second delay
4. On error:
   - Confirmation modal remains open
   - Error message displayed below buttons
   - Confirm button re-enabled

**Cancellation:**
- User clicks Cancel button
- Confirmation modal closes
- User remains on Note Detail page

---

### 8.4 Navigate Back

**User Action**: Click browser back button or page back button (if implemented)

**Expected Outcome:**
- Browser navigation history used
- User returns to previous page (typically dashboard or notes list)
- View cleanup: Subscriptions unsubscribed via `takeUntilDestroyed()`

**Implementation Detail:**
- Browser back button works automatically via Angular routing
- Optional custom back button can be implemented:
  ```typescript
  onBackClicked() {
    this.location.back();
  }
  ```

---

## 9. Conditions and Validation

### 9.1 Initial Load Validation

**Condition**: Route parameter `noteId` exists and is valid UUID format

**Verification**: Angular route resolver or component initialization check

**Effect on Interface**: 
- If invalid: 404 error displayed
- If valid: Proceed with API call

---

### 9.2 Note Existence & Ownership (404/401)

**Condition**: User owns the note being accessed

**Verification**: API returns 404 (not found) or 401 (unauthorized)

**Component Affected**: `NoteDetailContainer`

**Effect on Interface**:
- **404**: Display error message "Note not found" with option to return to dashboard
- **401**: Display error message "You don't have permission to view this note"
- Disable all action buttons
- Hide note content

---

### 9.3 Form Validation (Edit Modal)

#### Title Field
**Condition**: Optional; if provided, max 255 characters

**Verification**: 
- Input type constraint
- Template validation via `maxlength="255"`

**Component Affected**: `EditNoteModal` / `add-note-form`

**Effect**: Character counter displayed; input prevents exceeding limit

#### Content Field
**Condition**: Required; 1-1000 characters

**Verification**:
- `required` validator
- Template validation via `minlength="1"` and `maxlength="1000"`
- API validation (422 if violated)

**Component Affected**: `EditNoteModal` / `add-note-form`

**Effect on Interface**:
- Red border/error state if empty
- Character counter displayed (e.g., "450/1000")
- Save button disabled if validation fails

#### Category Selection
**Condition**: Selected category must be active in user preferences

**Verification**: 
- API returns 403 if category not active
- Optional: Pre-filter dropdown to only show active categories

**Component Affected**: `EditNoteModal` / `add-note-form`

**Effect on Interface**:
- If 403 error: Display message "This category is no longer active. Please select an active category."
- Only active categories available in dropdown

---

### 9.4 Daily Note Limit (409 Conflict)

**Condition**: User hasn't exceeded daily per-category limit for target category

**Verification**: API returns 409 if limit exceeded

**Component Affected**: `EditNoteModal`

**Effect on Interface**:
- If 409 error: Display message "You've reached the maximum notes for this category today. Try editing your existing notes instead."
- Save button disabled until user changes category or action reverts

---

### 9.5 API Response Validation

**Condition**: API responses conform to expected `NoteDto` shape

**Verification**: TypeScript type checking and runtime validation (optional runtime schema validation library)

**Effect**: Type safety ensures proper rendering; any deviation handled as server error

---

## 10. Error Handling

### 10.1 Fetch Error Scenarios

#### Note Not Found (404)

**Trigger**: API returns 404

**Handling**:
```typescript
.catch(error => {
  if (error.status === 404) {
    this.viewState.update(state => ({
      ...state,
      fetchError: {
        code: 'NOT_FOUND',
        message: 'Note not found. It may have been deleted.',
        status: 404
      },
      isLoading: false
    }));
  }
});
```

**UI Display**:
- Error alert section visible in main container
- Message: "Note not found. It may have been deleted."
- Button: "Return to Dashboard"
- Action buttons (Edit/Delete) hidden

---

#### Unauthorized Access (401)

**Trigger**: API returns 401 (user not authenticated or wrong owner)

**Handling**:
```typescript
.catch(error => {
  if (error.status === 401) {
    // Auth interceptor may handle redirect to login
    this.viewState.update(state => ({
      ...state,
      fetchError: {
        code: 'UNAUTHORIZED',
        message: 'You don\'t have permission to view this note.',
        status: 401
      },
      isLoading: false
    }));
  }
});
```

**UI Display**:
- Error alert: "Access Denied"
- Message: "You don't have permission to view this note."
- Action buttons disabled

---

#### Server Error (500)

**Trigger**: API returns 500 or other 5xx status

**Handling**:
```typescript
.catch(error => {
  if (error.status >= 500) {
    this.viewState.update(state => ({
      ...state,
      fetchError: {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        status: error.status
      },
      isLoading: false
    }));
  }
});
```

**UI Display**:
- Error alert: "Server Error"
- Message: "Something went wrong. Please try again later."
- Retry button option

---

#### Network Error

**Trigger**: Network request fails (connection lost, timeout)

**Handling**:
```typescript
.catch(error => {
  if (!error.status || error.status === 0) {
    this.viewState.update(state => ({
      ...state,
      fetchError: {
        code: 'NETWORK_ERROR',
        message: 'Network error. Check your connection and try again.',
        status: 0
      },
      isLoading: false
    }));
  }
});
```

**UI Display**:
- Error alert: "Network Connection Error"
- Message: "Unable to load note. Check your internet connection."

---

### 10.2 Edit Operation Error Scenarios

#### Validation Error (422)

**Trigger**: API returns 422 with field-level errors

**Handling**:
```typescript
// In form submission
.catch(error => {
  if (error.status === 422) {
    this.viewState.update(state => ({
      ...state,
      editFormError: {
        code: 'VALIDATION_ERROR',
        message: error.error.message,
        details: error.error.details,
        status: 422
      },
      isUpdating: false
    }));
  }
});
```

**UI Display**:
- Error message displayed below form fields or in alert box
- Field-specific errors highlighted
- Save button re-enabled

---

#### Category Not Active (403)

**Trigger**: API returns 403 - selected category not in user's active categories

**Handling**:
```typescript
.catch(error => {
  if (error.status === 403) {
    this.viewState.update(state => ({
      ...state,
      editFormError: {
        code: 'CATEGORY_NOT_ACTIVE',
        message: 'This category is no longer active. Please select an active category.',
        status: 403
      },
      isUpdating: false
    }));
  }
});
```

**UI Display**:
- Alert: "Category Not Available"
- Message displayed in modal
- Category dropdown filtered to show only active categories
- Save button disabled until valid category selected

---

#### Daily Limit Reached (409)

**Trigger**: API returns 409 - daily per-category limit exceeded

**Handling**:
```typescript
.catch(error => {
  if (error.status === 409) {
    this.viewState.update(state => ({
      ...state,
      editFormError: {
        code: 'DAILY_LIMIT_REACHED',
        message: 'You have reached the maximum notes for this category today.',
        status: 409
      },
      isUpdating: false
    }));
  }
});
```

**UI Display**:
- Alert: "Daily Limit Reached"
- Message: "You have reached the maximum notes for this category today. Try editing your existing notes instead."
- Suggest user keep note in current category or delete another note

---

### 10.3 Delete Operation Error Scenarios

#### Delete Fails (Any Error)

**Trigger**: API returns error during DELETE request

**Handling**:
```typescript
.catch(error => {
  const errorMessage = error.status === 404 
    ? 'Note not found.'
    : error.status === 401
    ? 'Access denied.'
    : 'Failed to delete note. Please try again.';
    
  this.viewState.update(state => ({
    ...state,
    operationError: {
      code: 'DELETE_FAILED',
      message: errorMessage,
      status: error.status
    },
    isDeleting: false,
    isDeleteConfirmationOpen: true // Keep modal open
  }));
});
```

**UI Display**:
- Confirmation modal remains open
- Error message displayed below buttons
- Confirm button re-enabled for retry
- User can cancel and remain on page

---

### 10.4 Error Display Pattern

**Global Error Alert Component** in container template:
```html
<ng-container *ngIf="viewState().fetchError as error">
  <nz-alert
    [nzType]="'error'"
    [nzMessage]="error.message"
    nzShowIcon
    [nzCloseable]="true"
    class="mb-4"
  ></nz-alert>
</ng-container>
```

**Modal Error Display** in edit modal:
```html
<nz-alert
  *ngIf="error"
  [nzType]="'error'"
  [nzMessage]="error.message"
  nzShowIcon
  class="mb-4"
></nz-alert>
```

---

### 10.5 Error Recovery Strategies

1. **Retry Mechanism**: For network/server errors, provide "Retry" button
2. **State Refresh**: After user interaction (e.g., returning from error), clear error state
3. **Fallback Navigation**: For permanent errors (404, 403 unauthorized), provide navigation to safe routes
4. **User Feedback**: Use ng-zorro Message/Notification for success/error feedback

---

## 11. Implementation Steps

### Phase 1: Setup & Types

**Step 1.1**: Create type definitions in `src/types.ts`
- Add `NoteDetailViewState` interface
- Add `NoteDetailViewModel` interface

**Step 1.2**: Verify existing types
- Confirm `NoteDto`, `UpdateNoteCommand`, `AddNoteFormValue`, `AddNoteError` exist in `src/types.ts`
- Review existing `NotesService` methods for `getNoteById()`, `updateNote()`, `deleteNote()`

---

### Phase 2: Create Components

**Step 2.1**: Create NoteDetailContainer component
- Generate component: `ng generate component views/note-detail/note-detail-container`
- Implement component class with:
  - Route parameter subscription in `ngOnInit`
  - State signal initialization
  - API call methods (`onEditSubmitted`, `onDeleteConfirmed`, etc.)
  - Computed signals for child components
  - Error mapping utility function

**Step 2.2**: Create NoteContentDisplay component
- Generate component: `ng generate component views/note-detail/components/note-content-display`
- Implement as presentational component with:
  - `@Input() note: NoteDetailViewModel | null`
  - `@Input() isLoading: boolean`
  - Template rendering title, content, metadata
  - Tailwind styling for readability

**Step 2.3**: Create NoteActions component
- Generate component: `ng generate component views/note-detail/components/note-actions`
- Implement with:
  - `@Input() isLoading, isDeleting`
  - `@Output() editClicked, deleteClicked`
  - Edit and Delete buttons with ng-zorro styling
  - ARIA labels for accessibility

**Step 2.4**: Create EditNoteModal component
- Generate component: `ng generate component views/note-detail/components/edit-note-modal`
- Implement with:
  - Reuse/wrap existing `add-note-form` component
  - `@Input() isOpen, note, isSubmitting, error`
  - `@Output() submitted, cancelled`
  - ng-zorro Modal wrapper
  - Form pre-filling logic

---

### Phase 3: Template & Styling

**Step 3.1**: Implement NoteDetailContainer template
```html
<div class="note-detail-container">
  <!-- Back button / header -->
  <div class="mb-6">
    <button (click)="onBackClicked()" class="text-blue-600 hover:text-blue-800">
      ← Back to Dashboard
    </button>
  </div>

  <!-- Error alerts -->
  <ng-container *ngIf="viewState().fetchError as error">
    <nz-alert [nzMessage]="error.message" nzType="error" nzShowIcon class="mb-4"></nz-alert>
  </ng-container>

  <!-- Loading state -->
  <div *ngIf="viewState().isLoading" class="text-center">
    <nz-spin></nz-spin>
  </div>

  <!-- Note content (when loaded) -->
  <ng-container *ngIf="viewModel() as vm">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <app-note-content-display 
          [note]="vm"
          [isLoading]="viewState().isLoading"
        ></app-note-content-display>
      </div>
      <div>
        <app-note-actions
          [isLoading]="viewState().isUpdating"
          [isDeleting]="viewState().isDeleting"
          (editClicked)="onEditClicked()"
          (deleteClicked)="onDeleteClicked()"
        ></app-note-actions>
      </div>
    </div>
  </ng-container>

  <!-- Edit modal -->
  <app-edit-note-modal
    [isOpen]="viewState().isEditModalOpen"
    [note]="viewModel()"
    [isSubmitting]="viewState().isUpdating"
    [error]="viewState().editFormError"
    (submitted)="onEditSubmitted($event)"
    (cancelled)="onEditCancelled()"
  ></app-edit-note-modal>
</div>
```

**Step 3.2**: Implement NoteContentDisplay template
```html
<div class="note-content-wrapper bg-white rounded-lg shadow p-6">
  <!-- Title -->
  <h1 class="text-3xl font-bold mb-4">
    {{ note?.title || 'Untitled Note' }}
  </h1>

  <!-- Edited indicator -->
  <div *ngIf="note?.isEdited" class="text-sm text-gray-500 mb-4">
    Edited {{ note.updatedAtFormatted }}
  </div>

  <!-- Content -->
  <div class="prose max-w-none mb-6 whitespace-pre-wrap">
    {{ note?.content }}
  </div>

  <!-- Metadata -->
  <div class="border-t pt-4 text-sm text-gray-600">
    <div class="mb-2">
      <span class="font-semibold">Created:</span> {{ note?.createdAtFormatted }}
    </div>
    <div *ngIf="note?.isEdited" class="mb-2">
      <span class="font-semibold">Last Updated:</span> {{ note?.updatedAtFormatted }}
    </div>
    <div>
      <span class="font-semibold">Category:</span> 
      <span [class]="'inline-block px-3 py-1 rounded text-white ' + note?.categoryColor">
        {{ note?.categoryName }}
      </span>
    </div>
  </div>
</div>
```

**Step 3.3**: Implement NoteActions template
```html
<div class="actions-container space-y-2">
  <button
    nz-button
    nzType="primary"
    nzSize="large"
    nzBlock
    (click)="editClicked.emit()"
    [disabled]="isLoading"
    aria-label="Edit note"
  >
    <span nz-icon nzType="edit"></span>
    Edit
  </button>
  <button
    nz-button
    nzType="default"
    nzDanger
    nzSize="large"
    nzBlock
    (click)="deleteClicked.emit()"
    [disabled]="isDeleting"
    aria-label="Delete note"
  >
    <span nz-icon nzType="delete"></span>
    Delete
  </button>
</div>
```

**Step 3.4**: Apply Tailwind styling
- Use Tailwind utility classes in templates (already shown above)
- Ensure responsive design (mobile-first)
- Create component-specific SCSS files for complex styling

---

### Phase 4: State & Logic

**Step 4.1**: Implement NoteDetailContainer class
- Set up state signal with initial values
- Create computed signals for view models
- Implement route parameter subscription
- Implement API call methods

**Step 4.2**: Implement error mapping utility
```typescript
private mapErrorToAddNoteError(error: any): AddNoteError {
  return {
    code: error.error?.code || 'UNKNOWN_ERROR',
    message: error.error?.message || 'An error occurred',
    details: error.error?.details,
    status: error.status
  };
}
```

**Step 4.3**: Implement view model transformation
```typescript
private transformToViewModel(note: NoteDto | null): NoteDetailViewModel | null {
  if (!note) return null;
  
  return {
    ...note,
    createdAtFormatted: this.formatDate(note.created_at),
    updatedAtFormatted: this.formatDate(note.updated_at),
    categoryName: this.getCategoryName(note.category_id),
    categoryColor: this.getCategoryColor(note.category_id),
    isEdited: note.updated_at !== note.created_at,
    readableContent: note.content
  };
}
```

---

### Phase 5: Modal Components

**Step 5.1**: Implement EditNoteModal
- Wrap add-note-form component
- Implement form pre-filling from note data
- Handle form submission with `UpdateNoteCommand`
- Display errors from parent

**Step 5.2**: Implement delete confirmation
- Use ng-zorro Modal service directly in container
```typescript
onDeleteClicked() {
  this.modal.confirm({
    nzTitle: 'Delete Note',
    nzContent: 'Are you sure you want to delete this note? This action cannot be undone.',
    nzOkText: 'Delete',
    nzOkType: 'primary',
    nzOkDanger: true,
    nzCancelText: 'Cancel',
    nzOnOk: () => this.onDeleteConfirmed()
  });
}
```

---

### Phase 6: Routing & Integration

**Step 6.1**: Add route to `app.routes.ts`
```typescript
{
  path: 'notes/:noteId',
  component: NoteDetailContainerComponent,
  canActivate: [AuthGuard]
}
```

**Step 6.2**: Update dashboard/category-card navigation
- Ensure navigation passes note ID to new route
```typescript
this.router.navigate(['/notes', noteId]);
```

---

### Phase 7: Testing & Polish

**Step 7.1**: Create component specs for testing
- Test state initialization
- Test API call success/error scenarios
- Test user interactions (edit, delete)
- Test form validation

**Step 7.2**: Test error handling
- Mock API errors (404, 401, 422, 409, 500)
- Verify error messages display correctly
- Verify UI state updates appropriately

**Step 7.3**: Test user flows
- Navigate to note detail
- Edit note with valid/invalid data
- Delete note with confirmation
- Go back to dashboard

**Step 7.4**: Accessibility review
- Verify ARIA labels on buttons
- Test keyboard navigation
- Test screen reader compatibility

**Step 7.5**: Styling & responsive design
- Test on mobile, tablet, desktop
- Verify readability and spacing
- Test dark mode (if supported)

---

### Phase 8: Documentation & Handoff

**Step 8.1**: Add code comments
- Document state management logic
- Document error handling patterns
- Document component interfaces

**Step 8.2**: Update README
- Document component usage
- List dependencies and services
- Provide usage examples

**Step 8.3**: Create Storybook stories (optional)
- Create stories for each component
- Document props and interactions
- Test components in isolation

---

## Summary

This implementation plan provides a comprehensive guide for building the Note Detail View with three main components (NoteDetailContainer, NoteContentDisplay, NoteActions), full error handling, state management via Angular Signals, and integration with the existing Notes API. The view supports viewing, editing, and deleting notes while maintaining proper validation, error handling, and user feedback throughout the interaction flow.

The implementation follows Angular best practices, leverages TypeScript for type safety, uses Tailwind CSS for styling, and integrates with ng-zorro for UI components. The step-by-step guide ensures systematic implementation with clear milestones for testing and validation.

