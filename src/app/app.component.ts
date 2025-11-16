import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

import { TopNavbarComponent } from './top-navbar/top-navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'app-life-sync';
  private router = inject(Router);

  get showNavbar(): boolean {
    const currentRoute = this.router.url;
    // Show navbar for protected routes (dashboard, preferences)
    return (
      currentRoute.includes('/dashboard') ||
      currentRoute.includes('/preferences')
    );
  }
}
