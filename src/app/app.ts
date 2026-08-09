import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SqliteService } from './core/services/sqlite.service';
import { expenses } from './shared/db/schema';

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
      console.log('Database Initialized successfully!');

      await this.sqlite.db.delete(expenses);
      console.log('Successfully wiped all rows from the database!');

      // Self-test: Insert a verification row using Drizzle
      await this.sqlite.db.insert(expenses).values({
        merchantName: 'Trader Joes',
        amount: 34.19,
        transactionDate: new Date().toISOString().split('T')[0],
        category: 'Groceries',
      });
      console.log('Verification: Successfully inserted a test row into SQLite via Drizzle!');

      // Self-test: Query rows using Drizzle
      const results = await this.sqlite.db.select().from(expenses);
      console.log('Verification: Queried rows from SQLite via Drizzle:', results);
    } catch (err) {
      console.error('Failed to initialize or verify SQLite on device:', err);
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
