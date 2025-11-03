import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-verify-email-prompt',
  standalone: true,
  imports: [CommonModule, NzAlertModule, NzButtonModule],
  template: `
    <div class="verify-email-prompt">
      <nz-alert
        nzType="warning"
        nzMessage="Email Not Verified"
        nzDescription="Please verify your email before signing in. Check your inbox for the verification link."
        [nzShowIcon]="true"
        class="mb-4">
      </nz-alert>
      <button
        nz-button
        nzType="primary"
        nzBlock
        nzSize="large"
        (click)="onResend.emit(email)">
        Resend Verification Email to {{ email }}
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .verify-email-prompt {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #f0f0f0;
      }

      .mb-4 {
        margin-bottom: 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPromptComponent {
  @Input() email: string = '';
  @Output() onResend = new EventEmitter<string>();
}
