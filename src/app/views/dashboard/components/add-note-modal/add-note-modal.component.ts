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
  CategoryDto,
  NoteDto,
  CreateNoteCommand,
  AddNoteError,
  UUID,
} from '../../../../../types';
import { NotesService } from '../../../../services/notes.service';
import { AddNoteFormComponent } from './add-note-form/add-note-form.component';
import { AddNoteErrorMapperService } from '../../../../services/add-note-error-mapper.service';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * AddNoteModalComponent
 * Manages note creation modal using Ng-zorro modal service
 * Handles form submission, error mapping, and API integration
 */
@Component({
  selector: 'app-add-note-modal',
  standalone: true,
  imports: [NzModalModule, NzIconModule],
  template: '',
  styleUrls: ['./add-note-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteModalComponent {
  // ============
  // Inputs
  // ============
  readonly isOpen = input<boolean>(false);
  readonly selectedCategory = input<CategoryDto | null>(null);

  // ============
  // Outputs
  // ============
  readonly modalClosed = output<void>();
  readonly noteCreated = output<NoteDto>();

  // ============
  // State
  // ============
  isSubmitting = signal<boolean>(false);
  error = signal<AddNoteError | null>(null);
  selectedCategoryId = signal<UUID | null>(null);
  private modalInstance: {
    destroy: () => void;
    getContentComponent: () => AddNoteFormComponent;
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
      const category = this.selectedCategory();

      if (open && category) {
        this.selectedCategoryId.set(category.id);
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
    this.error.set(null);
    this.isSubmitting.set(false);

    // Create modal instance with AddNoteFormComponent as content
    this.modalInstance = this.modalService.create({
      nzTitle: `Add Note for ${this.selectedCategory()?.name} category`,
      nzContent: AddNoteFormComponent,
      nzCentered: true,
      nzWidth: 600,
      nzMask: true,
      nzMaskClosable: false,
      nzKeyboard: true,
      nzOkText: null,
      nzCancelText: null,
      nzFooter: null,
      nzWrapClassName: 'add-note-modal-wrapper',
      nzZIndex: 1000,
      nzOnCancel: () => {
        this.closeModal();
      },
    });

    // Get form component and set up communication
    setTimeout(() => {
      try {
        const formComponent =
          this.modalInstance?.getContentComponent() as AddNoteFormComponent;
        if (formComponent) {
          // Set component signals
          formComponent.categoryId.set(this.selectedCategoryId());
          formComponent.isSubmitting.set(this.isSubmitting());

          // Subscribe to form events
          formComponent.noteSubmitted.subscribe(
            (command: CreateNoteCommand) => {
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
  private onFormSubmit(command: CreateNoteCommand): void {
    this.error.set(null);
    this.isSubmitting.set(true);

    this.notesService.createNote(command).subscribe({
      next: (note: NoteDto) => {
        this.isSubmitting.set(false);
        this.noteCreated.emit(note);
        this.closeModal();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        const mappedError = this.errorMapperService.mapError(error);
        this.error.set(mappedError);
        console.error('Error creating note:', mappedError);
      },
    });
  }

  /**
   * Close modal and reset all state
   */
  private closeModal(): void {
    this.error.set(null);
    this.isSubmitting.set(false);
    this.selectedCategoryId.set(null);

    if (this.modalInstance) {
      this.modalInstance.destroy();
      this.modalInstance = null;
    }

    this.modalClosed.emit();
  }
}
