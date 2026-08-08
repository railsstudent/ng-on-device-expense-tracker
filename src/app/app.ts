import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SqliteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly sqlite = inject(SqliteService);

  protected readonly title = signal('ngOnDeviceExpenseTracker');
  protected readonly dbStatus = this.sqlite.isConnected;
  protected readonly swStatus = signal('Checking...');

  async ngOnInit(): Promise<void> {
    try {
      await this.sqlite.initialize();
    } catch (err) {
      console.error('Failed to initialize SQLite on device:', err);
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          this.swStatus.set(`Active (Scope: ${registration.scope})`);
        } else {
          this.swStatus.set('Ready (Registered upon Production Build)');
        }
      } catch {
        this.swStatus.set('Failed to check Service Worker');
      }
    } else {
      this.swStatus.set('Not Supported by Browser');
    }
  }
}
