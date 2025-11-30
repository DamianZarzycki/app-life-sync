import { Component, output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-delete-note-confirmation',
  imports: [NzIconModule],
  templateUrl: './delete-note-confirmation.component.html',
  styleUrl: './delete-note-confirmation.component.scss'
})
export class DeleteNoteConfirmationComponent {
  readonly cancel = output<void>();
  readonly submit = output<void>();

  onCancel(): void {
    this.cancel.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }
}
