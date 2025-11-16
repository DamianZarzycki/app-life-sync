import { Component, inject } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClickOutsideDirective } from '../directives/click-outside.directive';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-top-navbar',
  imports: [ClickOutsideDirective, NzIconModule],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent {
  private router = inject(Router);
  readonly authService = inject(AuthService);
  showUserMenu = false;

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToPreferences(): void {
    this.router.navigate(['/preferences']);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeUserMenu();
  }
}
