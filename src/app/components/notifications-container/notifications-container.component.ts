import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { NotificationComponent } from '../notification/notification.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notifications-container',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './notifications-container.component.html',
  styleUrl: './notifications-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsContainerComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  notifications$!: Observable<Notification[]>;

  ngOnInit(): void {
    this.notifications$ = this.notificationService.getNotifications$();
  }

  /**
   * Close a notification
   */
  onCloseNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }
}

