/**
 * NotesListContainerComponent
 *
 * Smart/Container component for displaying a list of notes filtered by category.
 * Handles:
 * - Fetching notes by category from API
 * - State management using Angular Signals
 * - Pagination and infinite scroll
 * - Navigation to note detail view
 * - Error handling with user-friendly messages
 *
 * Flow:
 * 1. Route query param (categoryId) triggers notes fetch
 * 2. ListNotesQuery sent to API with category filter
 * 3. Notes loaded and displayed in list
 * 4. User clicks note to navigate to detail view
 * 5. User can go back to dashboard or search
 *
 * State Management:
 * - Uses Angular 19 Signals API for reactive state
 * - Computed properties derive state for child components
 * - Immutable state updates via signal.update()
 * - Automatic cleanup via takeUntilDestroyed()
 */

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import { NoteDto, ListNotesQuery, UUID } from '../../../types';
import { NotesService } from '../../services/notes.service';
import { DashboardService } from '../../services/dashboard.service';
import { NotesListItemComponent } from './components/notes-list-item/notes-list-item.component';

interface NotesListViewState {
  notes: NoteDto[];
  isLoading: boolean;
  error: { code: string; message: string } | null;
  categoryId: UUID | null;
  totalCount: number;
  currentOffset: number;
  hasMore: boolean;
}

@Component({
  selector: 'app-notes-list-container',
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    NzAlertModule,
    NzEmptyModule,
    NotesListItemComponent,
  ],
  templateUrl: './notes-list-container.component.html',
  // styleUrl: './notes-list-container.component.scss',
})
export class NotesListContainerComponent {
  // Services
  private readonly notesService = inject(NotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dashboardService = inject(DashboardService);

  // State
  private readonly viewState = signal<NotesListViewState>({
    notes: [],
    isLoading: true,
    error: null,
    categoryId: null,
    totalCount: 0,
    currentOffset: 0,
    hasMore: false,
  });

  // Computed properties
  readonly notes = computed(() => this.viewState().notes);
  readonly isLoading = computed(() => this.viewState().isLoading);
  readonly error = computed(() => this.viewState().error);
  readonly categoryId = computed(() => this.viewState().categoryId);
  readonly hasMore = computed(() => this.viewState().hasMore);
  readonly totalCount = computed(() => this.viewState().totalCount);

  // Expose state for template
  readonly state = this.viewState;

  constructor() {
    // Listen to query param changes for categoryId
    this.route.queryParams
      .pipe(
        switchMap(params => {
          const catId = params['categoryId'];
          if (!catId) {
            return [];
          }

          this.viewState.update(state => ({
            ...state,
            categoryId: catId,
            isLoading: true,
            error: null,
            notes: [],
            currentOffset: 0,
          }));

          const query: ListNotesQuery = {
            category_id: catId,
            limit: 20,
            offset: 0,
            sort: 'created_at_desc',
          };

          return this.notesService.listNotes(query);
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: response => {
          this.viewState.update(state => ({
            ...state,
            notes: response.items,
            totalCount: response.total,
            isLoading: false,
            hasMore: response.offset + response.limit < response.total,
          }));
        },
        error: error => {
          this.viewState.update(state => ({
            ...state,
            error: this.mapErrorToMessage(error),
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
   * Navigate to note detail view
   */
  onNoteClicked(noteId: UUID): void {
    this.router.navigate(['/notes', noteId]);
  }

  /**
   * Load more notes (pagination)
   */
  onLoadMore(): void {
    const currentState = this.viewState();
    if (!currentState.categoryId || currentState.isLoading) {
      return;
    }

    const newOffset = currentState.currentOffset + 20;
    const query: ListNotesQuery = {
      category_id: currentState.categoryId,
      limit: 20,
      offset: newOffset,
      sort: 'created_at_desc',
    };

    this.viewState.update(state => ({
      ...state,
      isLoading: true,
    }));

    this.notesService.listNotes(query).subscribe({
      next: response => {
        this.viewState.update(state => ({
          ...state,
          notes: [...state.notes, ...response.items],
          currentOffset: newOffset,
          isLoading: false,
          hasMore: newOffset + response.limit < response.total,
        }));
      },
      error: error => {
        this.viewState.update(state => ({
          ...state,
          error: this.mapErrorToMessage(error),
          isLoading: false,
        }));
      },
    });
  }

  /**
   * Map HTTP errors to user-friendly messages
   */
  private mapErrorToMessage(error: any): { code: string; message: string } {
    if (error.status === 404) {
      return {
        code: 'NOT_FOUND',
        message: 'No notes found for this category',
      };
    } else if (error.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'You are not authorized to view these notes',
      };
    } else if (error.status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An error occurred while loading notes',
    };
  }

  /**
   * Get category name for display
   */
  getCategoryName(categoryId: UUID): string {
    // For now, return a default - this could be enhanced with category lookup
    return 'Notes';
  }
}
