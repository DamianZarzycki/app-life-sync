import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
  inject,
} from '@angular/core';

import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';

import {
  NoteDetailViewModel,
  UpdateNoteCommand,
  AddNoteError,
} from '../../../../../types';
import { NotesService } from '../../../../services/notes.service';
import { EditNoteFormComponent } from './edit-note-form/edit-note-form.component';
import { AddNoteErrorMapperService } from '../../../../services/add-note-error-mapper.service';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * EditNoteModalComponent
 * Manages note edit modal using Ng-zorro modal service
 * Handles form submission, error mapping, and API integration
 * Uses same pattern as AddNoteModalComponent
 */
@Component({
  selector: 'app-edit-note-modal',
  standalone: true,
  imports: [NzModalModule, NzIconModule],
  template: '',
  styleUrls: ['./edit-note-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNoteModalComponent {
  // ============
  // Inputs
  // ============
  readonly isOpen = input<boolean>(false);
  readonly note = input<NoteDetailViewModel | null>(null);

  // ============
  // Outputs
  // ============
  readonly modalClosed = output<void>();
  readonly noteUpdated = output<NoteDetailViewModel>();

  // ============
  // State
  // ============
  isSubmitting = signal<boolean>(false);
  error = signal<AddNoteError | null>(null);
  private modalInstance: {
    destroy: () => void;
    getContentComponent: () => EditNoteFormComponent;
  } | null = null;

  // ============
  // Services
  // ============
  private notesService = inject(NotesService);
  private errorMapperService = inject(AddNoteErrorMapperService);
  private modalService = inject(NzModalService);

  constructor() {
    /**
     * Effect: Watch isOpen input and manage modal lifecycle
     */
    effect(() => {
      const open = this.isOpen();
      const noteData = this.note();

      if (open && noteData) {
        this.openModal();
      } else if (!open && this.modalInstance) {
        this.modalInstance.destroy();
        this.modalInstance = null;
        this.error.set(null);
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Open modal with form component
   */
  private openModal(): void {
    const noteData = this.note();
    if (!noteData) return;

    this.error.set(null);
    this.isSubmitting.set(false);

    // Create modal instance with EditNoteFormComponent as content
    this.modalInstance = this.modalService.create({
      nzTitle: 'Edit Note',
      nzClosable: false,
      nzContent: EditNoteFormComponent,
      nzCentered: true,
      nzWidth: 600,
      nzKeyboard: true,
      nzOkText: null,
      nzCancelText: null,
      nzFooter: null,
      nzWrapClassName: 'edit-note-modal-wrapper',
      nzZIndex: 1000,
      nzOnCancel: () => {
        this.closeModal();
      },
    });

    // Get form component and set up communication
    setTimeout(() => {
      try {
        const formComponent =
          this.modalInstance?.getContentComponent() as EditNoteFormComponent;
        if (formComponent && noteData) {
          // Set component signals
          formComponent.categoryId.set(noteData.category_id);
          formComponent.isSubmitting.set(this.isSubmitting());

          // Pre-fill form with current note data
          if (formComponent.form) {
            formComponent.form.patchValue({
              title: noteData.title,
              content: noteData.content,
            });
            formComponent.characterCount.set(noteData.content.length);
          }

          // Subscribe to form events
          formComponent.noteSubmitted.subscribe(
            (command: UpdateNoteCommand) => {
              this.onFormSubmit(command);
            }
          );

          formComponent.formCancelled.subscribe(() => {
            this.closeModal();
          });
        }
      } catch (error) {
        console.error('Error setting up modal form:', error);
      }
    }, 100);
  }

  /**
   * Handle form submission - call API and manage response
   */
  private onFormSubmit(command: UpdateNoteCommand): void {
    const noteData = this.note();
    if (!noteData) return;

    this.error.set(null);
    this.isSubmitting.set(true);

    this.notesService.updateNote(noteData.id, command).subscribe({
      next: (updatedNote: any) => {
        this.isSubmitting.set(false);
        this.noteUpdated.emit(updatedNote);
        this.closeModal();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const mappedError = this.errorMapperService.mapError(error);
        this.error.set(mappedError);
        console.error('Error updating note:', mappedError);
      },
    });
  }

  /**
   * Close modal and reset all state
   */
  private closeModal(): void {
    this.error.set(null);
    this.isSubmitting.set(false);

    if (this.modalInstance) {
      this.modalInstance.destroy();
      this.modalInstance = null;
    }

    this.modalClosed.emit();
  }
}
