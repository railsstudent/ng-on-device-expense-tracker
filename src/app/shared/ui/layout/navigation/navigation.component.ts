import { NavLink } from '@/app.routes';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-navigation">
      <div class="nav-container">
        <!-- Left Side: Logo -->
        <div class="nav-logo" routerLink="/extract">
          <span class="material-symbols-outlined logo-icon">bolt</span>
          <span class="logo-text">Expense Tracker</span>
        </div>

        <!-- Center: Route Links -->
        <nav class="nav-links">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-item"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <!-- Right Side: Utility Icons -->
        <div class="nav-actions">
          <button class="icon-button" aria-label="Settings">
            <span class="material-symbols-outlined">settings</span>
          </button>
          <button class="icon-button" aria-label="Profile">
            <span class="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./navigation.component.css'],
})
export class NavigationComponent {
  // Strongly-typed list of navigation links using NavLink model from routing rules
  protected readonly navLinks: NavLink[] = [
    { label: 'Extract Expense', path: '/extract' },
    { label: 'History & Insights', path: '/history' },
  ];
}
