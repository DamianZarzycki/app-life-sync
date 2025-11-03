import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { SignInUserDto } from '../../../../../types';

/**
 * SuccessMessageComponent
 *
 * Displays a success message after successful user registration.
 * Shows the registered email, verification instructions, and provides:
 * - Link to resend verification email
 * - Navigation button to dashboard
 *
 * Purely presentational component emitting user actions.
 */
@Component({
  selector: 'app-success-message',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './success-message.component.html',
  styleUrl: './success-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessMessageComponent {
  // Inputs using modern Angular 19 input() function
  email = input('');
  user = input<SignInUserDto | undefined>();
  autoNavigateSeconds = input<number | undefined>();

  // Outputs using modern Angular 19 output() function
  navigateToDashboard = output<void>();
  resendVerificationEmail = output<string>();

  /**
   * Handle dashboard navigation
   */
  onNavigateToDashboard(): void {
    this.navigateToDashboard.emit();
  }

  /**
   * Handle resend verification email request
   */
  onResendVerification(): void {
    const emailToResend = this.email();
    if (emailToResend) {
      this.resendVerificationEmail.emit(emailToResend);
    }
  }
}
