import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import {
  CommonModule,
  NgClass,
} from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LoginError, SignUpFormValue, SignUpRequest } from '../../../../../types';
import { FormErrorAlertComponent } from '../../../../views/login/components/form-error-alert/form-error-alert.component';
import { PasswordStrengthIndicatorComponent } from '../password-strength-indicator/password-strength-indicator.component';
import { PasswordStrengthAnalyzer } from '../../../../utils/password-strength';

/**
 * RegistrationFormComponent
 *
 * Main registration form component with:
 * - Reactive form with email, password, and confirm password fields
 * - Real-time validation with visual feedback
 * - Password strength indicator
 * - Error display and management
 * - Loading state during submission
 * - Navigation link to login page
 */
@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzIconModule,
    FormErrorAlertComponent,
    PasswordStrengthIndicatorComponent,
  ],
  templateUrl: './registration-form.component.html',
  styleUrl: './registration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  // Inputs using modern Angular 19 input() function
  isLoading = input(false);
  error = input<LoginError | null>(null);
  initialFormValue = input<SignUpFormValue | undefined>();

  // Outputs using modern Angular 19 output() function
  onSubmit = output<SignUpRequest>();
  onErrorDismiss = output<void>();
  navigateToLogin = output<void>();

  // State signals for field interactions
  private emailTouched = signal(false);
  private passwordTouched = signal(false);
  private confirmPasswordTouched = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // Form group (created in ngOnInit)
  formGroup!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize the reactive form with validators
   */
  private initializeForm(): void {
    this.formGroup = this.fb.group(
      {
        email: [
          '',
          [Validators.required, Validators.email],
        ],
        password: [
          '',
          [Validators.required, Validators.minLength(1)],
        ],
        confirmPassword: [
          '',
          [Validators.required],
        ],
      },
      {
        validators: this.passwordMatchValidator.bind(this),
      }
    );
  }

  /**
   * Custom validator to check if passwords match
   * @param group - The form group to validate
   * @returns Validation error or null
   */
  private passwordMatchValidator(group: AbstractControl): Record<string, boolean> | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  /**
   * Mark email field as touched
   */
  onEmailBlur(): void {
    this.emailTouched.set(true);
  }

  /**
   * Mark password field as touched
   */
  onPasswordBlur(): void {
    this.passwordTouched.set(true);
  }

  /**
   * Mark confirm password field as touched
   */
  onConfirmPasswordBlur(): void {
    this.confirmPasswordTouched.set(true);
  }

  /**
   * Handle form submission
   */
  submit(): void {
    // Validate form before submission
    if (this.formGroup.invalid) {
      this.emailTouched.set(true);
      this.passwordTouched.set(true);
      this.confirmPasswordTouched.set(true);
      return;
    }

    // Prevent multiple submissions
    if (this.isLoading()) {
      return;
    }

    // Create signup request and emit
    const request: SignUpRequest = {
      email: this.formGroup.get('email')?.value,
      password: this.formGroup.get('password')?.value,
    };

    this.onSubmit.emit(request);
  }

  /**
   * Dismiss error message
   */
  dismissError(): void {
    this.onErrorDismiss.emit();
  }

  /**
   * Navigate to login page
   */
  goToLogin(): void {
    this.navigateToLogin.emit();
  }

  /**
   * Get email field value
   */
  getEmailValue(): string {
    return this.formGroup.get('email')?.value || '';
  }

  /**
   * Get password field value
   */
  getPasswordValue(): string {
    return this.formGroup.get('password')?.value || '';
  }

  /**
   * Check if email field has error
   */
  hasEmailError(): boolean {
    const control = this.formGroup.get('email');
    return !!control && control.invalid && this.emailTouched();
  }

  /**
   * Get email error message
   */
  getEmailErrorMessage(): string {
    const control = this.formGroup.get('email');
    if (control?.hasError('required')) {
      return 'Email is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  /**
   * Check if password field has error
   */
  hasPasswordError(): boolean {
    const control = this.formGroup.get('password');
    return !!control && control.invalid && this.passwordTouched();
  }

  /**
   * Get password error message
   */
  getPasswordErrorMessage(): string {
    const control = this.formGroup.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    return '';
  }

  /**
   * Check if confirm password field has error
   */
  hasConfirmPasswordError(): boolean {
    const control = this.formGroup.get('confirmPassword');
    const passwordMismatch = this.formGroup.hasError('passwordMismatch');
    return (!!control && control.invalid && this.confirmPasswordTouched()) ||
           (passwordMismatch && this.confirmPasswordTouched());
  }

  /**
   * Get confirm password error message
   */
  getConfirmPasswordErrorMessage(): string {
    const control = this.formGroup.get('confirmPassword');
    if (control?.hasError('required')) {
      return 'Confirm password is required';
    }
    if (this.formGroup.hasError('passwordMismatch') && this.confirmPasswordTouched()) {
      return 'Passwords do not match';
    }
    return '';
  }

  /**
   * Check if form is valid for submission
   */
  isFormValid(): boolean {
    return this.formGroup.valid && !this.isLoading();
  }

  /**
   * Check if email is touched
   */
  isEmailTouched(): boolean {
    return this.emailTouched();
  }

  /**
   * Check if password is touched
   */
  isPasswordTouched(): boolean {
    return this.passwordTouched();
  }

  /**
   * Check if confirm password is touched
   */
  isConfirmPasswordTouched(): boolean {
    return this.confirmPasswordTouched();
  }
}
