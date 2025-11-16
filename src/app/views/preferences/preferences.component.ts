import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';

import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  FormsModule,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, combineLatest, timer } from 'rxjs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import {
  PreferencesDto,
  UpdatePreferencesCommand,
  CategoryDto,
  DayOfWeekOption,
  ErrorResponseDto,
  DeliveryChannel,
} from '../../../types';

/**
 * PreferencesComponent
 *
 * Standalone component for managing user preferences including:
 * - Focus categories selection (max 3)
 * - Weekly report day and time
 * - Delivery channel preferences
 * - Daily note constraints
 *
 * Uses Angular 19 signals for state management and Reactive Forms for validation.
 */
@Component({
  selector: 'app-preferences',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzButtonModule,
    NzAlertModule,
    NzSpinModule,
    NzIconModule,
  ],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesComponent implements OnInit, OnDestroy {
  private readonly preferencesService = inject(PreferencesService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();

  // ============
  // Signals
  // ============

  // Data signals
  readonly preferencesSignal = signal<PreferencesDto | null>(null);
  readonly categoriesSignal = signal<CategoryDto[]>([]);

  // UI state signals
  readonly isLoadingSignal = signal(false);
  readonly isSavingSignal = signal(false);
  readonly isSuccessSignal = signal(false);

  // Form state signals
  readonly isDirtySignal = signal(false);

  // Error state signals
  readonly errorSignal = signal<ErrorResponseDto | null>(null);
  readonly validationErrorsSignal = signal<Record<string, string>>({});

  // Computed signal for save button state
  readonly canSaveSignal = computed(
    () =>
      this.preferencesForm.valid &&
      this.isDirtySignal() &&
      !this.isSavingSignal()
  );

  // ============
  // Form Group
  // ============

  preferencesForm: FormGroup = this.fb.group({
    active_categories: [
      [],
      [Validators.required, this.maxCategoriesValidator.bind(this)],
    ],
    report_dow: [
      0,
      [Validators.required, Validators.min(0), Validators.max(6)],
    ],
    report_hour: [
      2,
      [Validators.required, Validators.min(0), Validators.max(23)],
    ],
    preferred_delivery_channels: [
      ['in_app' as DeliveryChannel],
      [Validators.required, this.minChannelsValidator.bind(this)],
    ],
    max_daily_notes: [
      4,
      [Validators.required, Validators.min(1), Validators.max(10)],
    ],
    email_unsubscribed_at: [null],
  });

  // ============
  // UI Constants
  // ============

  readonly daysOfWeek = signal<DayOfWeekOption[]>([
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ]);

  readonly hours = signal<number[]>(Array.from({ length: 24 }, (_, i) => i));

  readonly deliveryChannels = signal<
    Array<{
      value: DeliveryChannel;
      label: string;
      description: string;
      icon: string;
    }>
  >([
    {
      value: 'in_app' as DeliveryChannel,
      label: 'In-App Generation',
      description: 'Generate reports in your dashboard',
      icon: '🔔',
    },
    {
      value: 'email' as DeliveryChannel,
      label: 'Email',
      description: 'Receive reports via email',
      icon: '📧',
    },
  ]);

  // ============
  // Lifecycle
  // ============

  ngOnInit(): void {
    this.loadData();

    // Track form changes
    this.preferencesForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateDirtyState();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============
  // Public Methods
  // ============

  /**
   * Format hour for display (e.g., "14:00 (2:00 PM)")
   */
  formatHour(hour: number): string {
    const padded = String(hour).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${padded}:00 (${displayHour}:00 ${ampm})`;
  }

  /**
   * Compare function for select component (for UUID values)
   */
  compareFn = (a: string, b: string): boolean => a === b;

  /**
   * Handle category toggle with max 3 selection limit
   */
  onCategoryToggle(event: Event, categoryId: string): void {
    const checkbox = event.target as HTMLInputElement;
    const currentValue = (this.preferencesForm.get('active_categories')
      ?.value || []) as string[];

    if (checkbox.checked) {
      if (currentValue.length < 3) {
        this.preferencesForm.patchValue({
          active_categories: [...currentValue, categoryId],
        });
      } else {
        checkbox.checked = false;
      }
    } else {
      this.preferencesForm.patchValue({
        active_categories: currentValue.filter(
          (id: string) => id !== categoryId
        ),
      });
    }
  }

  /**
   * Handle delivery channel toggle
   */
  onDeliveryChannelToggle(event: Event, channel: DeliveryChannel): void {
    const checkbox = event.target as HTMLInputElement;
    const currentValue = (this.preferencesForm.get(
      'preferred_delivery_channels'
    )?.value || []) as DeliveryChannel[];

    if (checkbox.checked) {
      this.preferencesForm.patchValue({
        preferred_delivery_channels: [...currentValue, channel],
      });
    } else {
      this.preferencesForm.patchValue({
        preferred_delivery_channels: currentValue.filter(
          (ch: DeliveryChannel) => ch !== channel
        ),
      });
    }
  }

  /**
   * Get error message for category field
   */
  getCategoryError(): string | null {
    const control = this.preferencesForm.get('active_categories');
    if (control?.hasError('maxCategories')) {
      return 'Maximum 3 categories allowed';
    }
    return null;
  }

  /**
   * Get error message for delivery channels field
   */
  getDeliveryChannelsError(): string | null {
    const control = this.preferencesForm.get('preferred_delivery_channels');
    if (control?.hasError('minChannels')) {
      return 'At least one delivery channel must be selected';
    }
    return null;
  }

  /**
   * Get error message for any form field
   */
  getFieldError(fieldName: string): string | null {
    const control = this.preferencesForm.get(fieldName);
    if (!control || !control.invalid || !control.touched) {
      return null;
    }

    if (control.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control.hasError('min')) {
      const min = control.getError('min').min;
      return `Value must be at least ${min}`;
    }
    if (control.hasError('max')) {
      const max = control.getError('max').max;
      return `Value must be at most ${max}`;
    }

    return null;
  }

  /**
   * Get error description for error alert
   */
  getErrorDescription(error: ErrorResponseDto): string {
    if (error.error.details) {
      const detailsArray = Object.entries(error.error.details)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      return detailsArray;
    }
    return error.error.message;
  }

  /**
   * Handle save button click
   */
  onSave(): void {
    if (!this.preferencesForm.valid) {
      this.markFormGroupTouched(this.preferencesForm);
      return;
    }

    this.isSavingSignal.set(true);
    this.errorSignal.set(null);

    const formValue = this.preferencesForm.value as UpdatePreferencesCommand;

    this.preferencesService
      .updatePreferences(formValue)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: updated => {
          this.preferencesSignal.set(updated);
          this.isDirtySignal.set(false);
          this.isSuccessSignal.set(true);
          this.isSavingSignal.set(false);
          this.validationErrorsSignal.set({});

          // Auto-dismiss success message after 3 seconds
          timer(3000)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.isSuccessSignal.set(false));
        },
        error: error => {
          this.isSavingSignal.set(false);
          this.handleSaveError(error);
        },
      });
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    if (this.preferencesSignal()) {
      this.initializeForm(this.preferencesSignal()!);
      this.isDirtySignal.set(false);
      this.errorSignal.set(null);
      this.isSuccessSignal.set(false);
      this.validationErrorsSignal.set({});
    }
  }

  /**
   * Handle error alert dismiss
   */
  onErrorDismiss(): void {
    this.errorSignal.set(null);
    this.validationErrorsSignal.set({});
  }

  // ============
  // Private Methods
  // ============

  /**
   * Load categories and preferences in parallel
   */
  private loadData(): void {
    this.isLoadingSignal.set(true);

    combineLatest([
      this.preferencesService.getCategories(),
      this.preferencesService.getPreferences(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([categoriesResponse, preferences]) => {
          this.categoriesSignal.set(categoriesResponse.items);
          this.preferencesSignal.set(preferences);
          this.initializeForm(preferences);
          this.isLoadingSignal.set(false);
        },
        error: error => {
          this.isLoadingSignal.set(false);
          this.handleLoadError(error);
        },
      });
  }

  /**
   * Initialize form with preferences data
   */
  private initializeForm(preferences: PreferencesDto): void {
    this.preferencesForm.patchValue({
      active_categories: preferences.active_categories || [],
      report_dow: preferences.report_dow,
      report_hour: preferences.report_hour,
      preferred_delivery_channels: preferences.preferred_delivery_channels || [
        'in_app',
      ],
      max_daily_notes: preferences.max_daily_notes,
      email_unsubscribed_at: preferences.email_unsubscribed_at,
    });

    this.preferencesForm.markAsPristine();
    this.isDirtySignal.set(false);
  }

  /**
   * Update dirty state based on form changes
   */
  private updateDirtyState(): void {
    const original = this.preferencesSignal();
    if (!original) {
      return;
    }

    const formValue = this.preferencesForm.value;
    const isDifferent =
      JSON.stringify(formValue.active_categories?.sort()) !==
        JSON.stringify(original.active_categories?.sort()) ||
      formValue.report_dow !== original.report_dow ||
      formValue.report_hour !== original.report_hour ||
      JSON.stringify(formValue.preferred_delivery_channels?.sort()) !==
        JSON.stringify(original.preferred_delivery_channels?.sort()) ||
      formValue.max_daily_notes !== original.max_daily_notes;

    this.isDirtySignal.set(isDifferent);
  }

  /**
   * Handle load errors
   */
  private handleLoadError(error: HttpErrorResponse): void {
    console.error('Failed to load preferences:', error);

    // Check for authentication error
    if (error.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return;
    }

    // Handle 404 - create default preferences
    if (error.status === 404) {
      const defaultPreferences: PreferencesDto = {
        user_id: this.authService.userId() || '',
        active_categories: [],
        report_dow: 0,
        report_hour: 2,
        preferred_delivery_channels: ['in_app'],
        email_unsubscribed_at: null,
        max_daily_notes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.preferencesSignal.set(defaultPreferences);
      this.initializeForm(defaultPreferences);
      this.isLoadingSignal.set(false);
      return;
    }

    // Generic error
    const errorResponse: ErrorResponseDto = {
      error: {
        code: error.status === 0 ? 'NETWORK_ERROR' : 'SERVER_ERROR',
        message:
          error.status === 0
            ? 'Failed to connect. Please check your internet connection.'
            : 'Failed to load preferences. Please try again.',
      },
    };

    this.errorSignal.set(errorResponse);
  }

  /**
   * Handle save errors
   */
  private handleSaveError(error: HttpErrorResponse): void {
    console.error('Failed to save preferences:', error);

    if (error.status === 422 && error.error?.error?.details) {
      this.validationErrorsSignal.set(error.error.error.details);
    }

    const errorResponse: ErrorResponseDto = {
      error: {
        code: error.error?.error?.code || 'SERVER_ERROR',
        message:
          error.error?.error?.message ||
          'Failed to save preferences. Please try again.',
        details: error.error?.error?.details,
      },
    };

    this.errorSignal.set(errorResponse);
  }

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Custom validator: Maximum 3 categories allowed
   */
  private maxCategoriesValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const categories = control.value as string[];
    if (categories && categories.length > 3) {
      return { maxCategories: true };
    }
    return null;
  }

  /**
   * Custom validator: At least one delivery channel required
   */
  private minChannelsValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const channels = control.value as DeliveryChannel[];
    if (!channels || channels.length === 0) {
      return { minChannels: true };
    }
    return null;
  }
}
