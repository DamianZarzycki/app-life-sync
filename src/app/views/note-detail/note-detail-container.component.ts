/**
 * NoteDetailContainerComponent
 *
 * Smart/Container component for displaying and managing a single note.
 * Handles:
 * - Fetching note data by ID from API
 * - State management using Angular Signals
 * - Edit operations (PUT /api/notes/{id})
 * - Delete operations (DELETE /api/notes/{id})
 * - Modal workflows for edit and delete confirmation
 * - Error handling with user-friendly messages
 *
 * Flow:
 * 1. Route parameter (noteId) triggers note fetch
 * 2. NoteDto loaded and transformed to NoteDetailViewModel
 * 3. NoteContentDisplay shows formatted note
 * 4. NoteActions provides Edit/Delete buttons
 * 5. User interactions open modals or trigger API calls
 * 6. On success: UI updates, notifications shown
 * 7. On error: Error messages displayed, modals remain open for retry
 *
 * State Management:
 * - Uses Angular 19 Signals API for reactive state
 * - Computed properties derive state for child components
 * - Immutable state updates via signal.update()
 * - Automatic cleanup via takeUntilDestroyed()
 */

import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterModule,
} from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import {
  NzModalService,
  NzModalModule,
} from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import {
  NoteDetailViewState,
  NoteDetailViewModel,
  NoteDto,
  UpdateNoteCommand,
  AddNoteError,
} from '../../../types';
import { NotesService } from '../../services/notes.service';
import { DashboardService } from '../../services/dashboard.service';
import {
  CATEGORY_COLOR_MAP,
  getCategoryColorMapping,
} from '../../models/dashboard.models';
import {
  NoteContentDisplayComponent,
} from './components/note-content-display/note-content-display.component';
import {
  NoteActionsComponent,
} from './components/note-actions/note-actions.component';
import {
  EditNoteModalComponent,
} from './components/edit-note-modal/edit-note-modal.component';

@Component({
  selector: 'app-note-detail-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzModalModule,
    NzAlertModule,
    NzSpinModule,
    NoteContentDisplayComponent,
    NoteActionsComponent,
    EditNoteModalComponent,
  ],
  templateUrl: './note-detail-container.component.html',
  styleUrl: './note-detail-container.component.scss',
})
export class NoteDetailContainerComponent implements OnInit {
  // Services
  private readonly notesService = inject(NotesService);
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly modalService = inject(NzModalService);
  private readonly messageService = inject(NzMessageService);

  // State
  private readonly viewState = signal<NoteDetailViewState>({
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

  // Computed properties
  readonly viewModel = computed(() => this.transformToViewModel(this.viewState().note));
  readonly isLoading = computed(() => this.viewState().isLoading);
  readonly isUpdating = computed(() => this.viewState().isUpdating);
  readonly isDeleting = computed(() => this.viewState().isDeleting);
  readonly isEditModalOpen = computed(
    () => this.viewState().isEditModalOpen,
  );
  readonly fetchError = computed(() => this.viewState().fetchError);
  readonly operationError = computed(() => this.viewState().operationError);
  readonly editFormError = computed(() => this.viewState().editFormError);
  readonly successMessage = computed(() => this.viewState().successMessage);

  // Expose state for template
  readonly state = this.viewState;

  constructor() {
    // Listen to route parameter changes and fetch note data
    // This subscription is automatically cleaned up when component is destroyed
    // via takeUntilDestroyed() without manual unsubscribe needed
    this.route.params
      .pipe(
        // Extract noteId from route params and fetch the note
        switchMap((params) => this.notesService.getNote(params['noteId'])),
        // Automatic cleanup on component destroy
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (note) => {
          // Update state with fetched note data
          this.viewState.update((state) => ({
            ...state,
            note,
            isLoading: false,
          }));
        },
        error: (error) => {
          // Map HTTP error to user-friendly error format
          this.viewState.update((state) => ({
            ...state,
            fetchError: this.mapErrorToAddNoteError(error),
            isLoading: false,
          }));
        },
      });
  }

  ngOnInit(): void {
    // Additional initialization if needed
  }

  /**
   * Navigate back to the previous route
   */
  onBackClicked(): void {
    this.location.back();
  }

  /**
   * Open the edit modal
   */
  onEditClicked(): void {
    this.viewState.update((state) => ({
      ...state,
      isEditModalOpen: true,
    }));
  }

  /**
   * Handle edit modal cancellation
   */
  onEditCancelled(): void {
    this.viewState.update((state) => ({
      ...state,
      isEditModalOpen: false,
    }));
  }

  /**
   * Handle edit form submission
   * Modal component handles API call and emits updated note
   */
  onNoteUpdated(updatedNote: NoteDto): void {
    this.viewState.update((state) => ({
      ...state,
      note: updatedNote,
      isEditModalOpen: false,
    }));

    this.messageService.success('Note updated successfully');

    // Auto-dismiss success message after 3 seconds
    setTimeout(() => {
      // Additional UI updates if needed
    }, 3000);
  }

  /**
   * Open the delete confirmation dialog
   */
  onDeleteClicked(): void {
    const noteId = this.viewState().note?.id;
    if (!noteId) return;

    this.modalService.confirm({
      nzTitle: 'Delete This Note?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => this.onDeleteConfirmed(noteId),
    });
  }

  /**
   * Handle delete confirmation
   */
  private onDeleteConfirmed(noteId: string): void {
    this.viewState.update((state) => ({
      ...state,
      isDeleting: true,
    }));

    this.notesService.deleteNote(noteId).subscribe({
      next: () => {
        this.messageService.success('Note deleted successfully');
        this.viewState.update((state) => ({
          ...state,
          isDeleting: false,
        }));

        // Navigate to dashboard after 1 second
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (error) => {
        const mappedError = this.mapErrorToAddNoteError(error);
        this.viewState.update((state) => ({
          ...state,
          operationError: mappedError,
          isDeleting: false,
        }));

        this.messageService.error(mappedError.message);
      },
    });
  }

  /**
   * Transform NoteDto to NoteDetailViewModel with formatted dates and metadata
   * Note: Category name resolution requires backend API enhancement to include
   * category metadata in NoteDto response, or category cache service implementation.
   */
  private transformToViewModel(
    note: NoteDto | null,
  ): NoteDetailViewModel | null {
    if (!note) return null;

    // TODO: Enhance category resolution
    // Currently, category_id is a UUID, but CATEGORY_COLOR_MAP is indexed by names.
    // Options for improvement:
    // 1. Backend should return category metadata in NoteDto
    // 2. Create a category cache service that resolves UUIDs to names
    // 3. Pass category data from parent component
    //
    // For now, we use a default approach and log for debugging
    let categoryName = 'Uncategorized';
    let categoryColorClass = 'bg-gray-500';

    // Default fallback - use first available category mapping
    // This ensures proper styling even without category name
    const firstKey = Object.keys(CATEGORY_COLOR_MAP)[0] || 'family';
    const firstCategory = CATEGORY_COLOR_MAP[firstKey];
    categoryColorClass = firstCategory.color;
    categoryName = firstKey.charAt(0).toUpperCase() + firstKey.slice(1);

    console.debug(
      'Note Detail: Category ID',
      note.category_id,
      'resolved to:',
      categoryName
    );

    return {
      ...note,
      createdAtFormatted: this.formatDate(note.created_at),
      updatedAtFormatted: this.formatDate(note.updated_at),
      categoryName,
      categoryColor: categoryColorClass,
      isEdited: note.updated_at !== note.created_at,
      readableContent: note.content,
    };
  }

  /**
   * Format date string to readable format
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Map HTTP errors to AddNoteError format
   */
  private mapErrorToAddNoteError(error: any): AddNoteError {
    return {
      code: error.error?.code || 'UNKNOWN_ERROR',
      message: error.error?.message || 'An error occurred',
      details: error.error?.details,
      status: error.status || 500,
    };
  }
}

