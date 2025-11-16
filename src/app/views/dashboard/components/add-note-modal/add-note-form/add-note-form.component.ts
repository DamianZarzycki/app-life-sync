import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  output,
  signal,
  effect,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import {
  AddNoteFormValue,
  CreateNoteCommand,
  UUID,
} from '../../../../../../types';

/**
 * AddNoteFormComponent
 * Handles note form display, validation, and submission
 * Used as content in Ng-zorro modal
 */
@Component({
  selector: 'app-add-note-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzSpaceModule,
    NzSpinModule,
  ],
  templateUrl: './add-note-form.component.html',
  styleUrls: ['./add-note-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteFormComponent implements OnInit, OnDestroy {
  // ============
  // Inputs
  // ============
  categoryId = signal<UUID | null>(null);
  isSubmitting = signal<boolean>(false);

  // ============
  // Outputs
  // ============
  readonly noteSubmitted = output<CreateNoteCommand>();
  readonly formCancelled = output<void>();

  // ============
  // State
  // ============
  form!: FormGroup;
  characterCount = signal<number>(0);
  contentTouched = signal<boolean>(false);

  // ============
  // Services
  // ============
  private formBuilder = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  constructor() {
    /**
     * Effect: Monitor form disabled state based on isSubmitting
     */
    effect(() => {
      if (this.form) {
        if (this.isSubmitting()) {
          this.form.disable({ emitEvent: false });
        } else {
          this.form.enable({ emitEvent: false });
        }
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.setupCharacterCounter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize reactive form with validators
   */
  private initializeForm(): void {
    this.form = this.formBuilder.group({
      title: [null, [Validators.maxLength(255)]],
      content: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(1000),
        ],
      ],
    });
  }

  /**
   * Setup character counter for content field
   */
  private setupCharacterCounter(): void {
    this.form
      .get('content')
      ?.valueChanges.pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe((value: string) => {
        this.characterCount.set(value?.length || 0);
      });

    const initialContent = this.form.get('content')?.value;
    if (initialContent) {
      this.characterCount.set(initialContent.length);
    }
  }

  /**
   * Get content FormControl
   */
  get contentControl() {
    return this.form.get('content');
  }

  /**
   * Get title FormControl
   */
  get titleControl() {
    return this.form.get('title');
  }

  /**
   * Check if content has validation errors
   */
  isContentInvalid(): boolean {
    const control = this.contentControl;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || this.contentTouched())
    );
  }

  /**
   * Check if title has validation errors
   */
  isTitleInvalid(): boolean {
    const control = this.titleControl;
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * Get content error message
   */
  getContentErrorMessage(): string {
    const control = this.contentControl;
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Content is required';
    }
    if (control.hasError('minlength')) {
      return 'Content must be at least 1 character';
    }
    if (control.hasError('maxlength')) {
      return 'Content must not exceed 1000 characters';
    }

    return '';
  }

  /**
   * Get title error message
   */
  getTitleErrorMessage(): string {
    const control = this.titleControl;
    if (!control) return '';

    if (control.hasError('maxlength')) {
      return 'Title must not exceed 255 characters';
    }

    return '';
  }

  /**
   * Get character counter color
   */
  getCharacterCounterColor(): string {
    const count = this.characterCount();
    if (count <= 750) return 'text-green-600';
    if (count <= 950) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.contentTouched.set(true);

    if (!this.form.valid || !this.categoryId()) {
      return;
    }

    const formValue = this.form.getRawValue() as AddNoteFormValue;

    const command: CreateNoteCommand = {
      category_id: this.categoryId()!,
      title: formValue.title,
      content: formValue.content,
    };

    this.noteSubmitted.emit(command);
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.form.reset();
    this.characterCount.set(0);
    this.contentTouched.set(false);
    this.formCancelled.emit();
  }

  /**
   * Mark content as touched
   */
  markContentAsTouched(): void {
    this.contentTouched.set(true);
  }
}
