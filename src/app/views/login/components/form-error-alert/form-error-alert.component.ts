import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { LoginError } from '../../../../../types';

@Component({
  selector: 'app-form-error-alert',
  standalone: true,
  imports: [CommonModule, NzAlertModule],
  template: `
    @if (error()) {
      <nz-alert
        [nzType]="getAlertType()"
        [nzMessage]="getErrorTitle()"
        [nzDescription]="error()!.message"
        [nzShowIcon]="true"
        [nzCloseable]="dismissible"
        (nzOnClose)="onDismiss.emit()">
      </nz-alert>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormErrorAlertComponent {
  error = input< LoginError | null >();
  dismissible = input< boolean >(true);
  onDismiss = output<void>();

  getAlertType(): 'success' | 'info' | 'warning' | 'error' {
    if (!this.error) return 'info';

    switch (this.error()?.code) {
      case 'VALIDATION_ERROR':
        return 'warning';
      case 'INVALID_CREDENTIALS':
      case 'UNVERIFIED_EMAIL':
      case 'SERVER_ERROR':
        return 'error';
      case 'RATE_LIMITED':
      case 'NETWORK_ERROR':
        return 'warning';
      default:
        return 'info';
    }
  }

  getErrorTitle(): string {
    if (!this.error) return 'Error';

    switch (this.error()?.code) {
      case 'VALIDATION_ERROR':
        return 'Validation Error';
      case 'INVALID_CREDENTIALS':
        return 'Sign In Failed';
      case 'UNVERIFIED_EMAIL':
        return 'Email Not Verified';
      case 'RATE_LIMITED':
        return 'Too Many Attempts';
      case 'NETWORK_ERROR':
        return 'Connection Error';
      case 'SERVER_ERROR':
        return 'Server Error';
      default:
        return 'Error';
    }
  }
}
