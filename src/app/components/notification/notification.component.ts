import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  @Input() notification!: Notification;
  @Output() close = new EventEmitter<string>();

  /**
   * Get background color based on notification type
   */
  getBackgroundClass(): string {
    const baseClass = 'border-l-4 p-4 mb-4 rounded';
    switch (this.notification.type) {
      case 'success':
        return `${baseClass} bg-green-50 border-green-500`;
      case 'error':
        return `${baseClass} bg-red-50 border-red-500`;
      case 'warning':
        return `${baseClass} bg-yellow-50 border-yellow-500`;
      case 'info':
        return `${baseClass} bg-blue-50 border-blue-500`;
      default:
        return baseClass;
    }
  }

  /**
   * Get text color based on notification type
   */
  getTitleClass(): string {
    switch (this.notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  /**
   * Get icon emoji based on notification type
   */
  getIcon(): string {
    switch (this.notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  }

  /**
   * Get icon circle background color
   */
  getIconCircleClass(): string {
    switch (this.notification.type) {
      case 'success':
        return 'bg-green-200 text-green-700';
      case 'error':
        return 'bg-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-200 text-yellow-700';
      case 'info':
        return 'bg-blue-200 text-blue-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  }

  /**
   * Get close button color
   */
  getCloseButtonClass(): string {
    switch (this.notification.type) {
      case 'success':
        return 'text-green-600 hover:text-green-700';
      case 'error':
        return 'text-red-600 hover:text-red-700';
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-700';
      case 'info':
        return 'text-blue-600 hover:text-blue-700';
      default:
        return 'text-gray-600 hover:text-gray-700';
    }
  }

  /**
   * Close notification
   */
  onClose(): void {
    this.close.emit(this.notification.id);
  }
}

