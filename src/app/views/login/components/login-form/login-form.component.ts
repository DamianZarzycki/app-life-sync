import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { FormErrorAlertComponent } from '../form-error-alert/form-error-alert.component';
import { VerifyEmailPromptComponent } from '../verify-email-prompt/verify-email-prompt.component';
import { LoginError, SignInRequest } from '../../../../../types';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    FormErrorAlertComponent,
    VerifyEmailPromptComponent,
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  isLoading = input.required<boolean>();
  error = input< LoginError | null >();

  onSubmit = output<SignInRequest>();
  onErrorDismiss = output<void>();
  onResendVerification = output<string>();



  loginForm: FormGroup = this.buildForm();

  ngOnInit(): void {
    // Set focus to email input after component initialization
    setTimeout(() => {
      const emailInput = document.querySelector(
        '[formControlName="email"]'
      ) as HTMLInputElement;
      emailInput?.focus();
    }, 100);
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          this.customEmailValidator(),
        ],
      ],
      password: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  private customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(control.value)
        ? null
        : { invalidEmail: true };
    };
  }

  getEmailError(): string | null {
    const control = this.loginForm.get('email');
    if (!control || !control.touched) return null;

    if (control.hasError('required')) {
      return 'Email is required';
    }
    if (control.hasError('email') || control.hasError('invalidEmail')) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  getPasswordError(): string | null {
    const control = this.loginForm.get('password');
    if (!control || !control.touched) return null;

    if (control.hasError('required')) {
      return 'Password is required';
    }
    return null;
  }

  onFormSubmit(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.onSubmit.emit(this.loginForm.value as SignInRequest);
  }

  handleErrorDismiss(): void {
    this.onErrorDismiss.emit();
  }

  handleResendVerification(email: string): void {
    this.onResendVerification.emit(email);
  }
}
