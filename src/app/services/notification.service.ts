import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: Record<string, any>;
  duration?: number; // milliseconds, null = no auto-dismiss
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private notificationIdCounter = 0;

  /**
   * Get all notifications as observable
   */
  getNotifications$(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Add a success notification
   */
  success(title: string, message?: string, duration: number = 5000): void {
    this.addNotification({
      type: 'success',
      title,
      message: message || '',
      duration,
    });
  }

  /**
   * Add an error notification
   */
  error(title: string, message?: string, details?: Record<string, any>, duration: number = 8000): void {
    this.addNotification({
      type: 'error',
      title,
      message: message || '',
      details,
      duration,
    });
  }

  /**
   * Add a warning notification
   */
  warning(title: string, message?: string, duration: number = 6000): void {
    this.addNotification({
      type: 'warning',
      title,
      message: message || '',
      duration,
    });
  }

  /**
   * Add an info notification
   */
  info(title: string, message?: string, duration: number = 5000): void {
    this.addNotification({
      type: 'info',
      title,
      message: message || '',
      duration,
    });
  }

  /**
   * Add a generic notification
   */
  private addNotification(
    notification: Omit<Notification, 'id' | 'timestamp'>
  ): void {
    const id = `notification-${this.notificationIdCounter++}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, fullNotification]);

    // Auto-dismiss if duration is specified
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }
  }

  /**
   * Remove a notification by ID
   */
  removeNotification(id: string): void {
    const currentNotifications = this.notifications$.value;
    this.notifications$.next(
      currentNotifications.filter(n => n.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications$.next([]);
  }
}

