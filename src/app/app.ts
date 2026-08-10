import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DatabaseService } from './core/services/database.service';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly database = inject(DatabaseService);
  private readonly pwa = inject(PwaService);

  protected readonly title = signal('ngOnDeviceExpenseTracker');
  protected readonly dbStatus = this.database.isConnected;
  protected readonly swStatus = this.pwa.status;

  async ngOnInit(): Promise<void> {
    try {
      console.log('AppComponent: Database is pre-initialized and ready!');

      // Self-test: Insert a verification row using IndexedDB/Dexie
      const newId = await this.database.insert({
        merchantName: 'Trader Joes',
        amount: 34.19,
        transactionDate: new Date().toISOString().split('T')[0],
        category: 'Groceries',
      });
      console.log(`Verification: Successfully inserted a test row (ID: ${newId}) into IndexedDB via Dexie!`);

      // Self-test: Query rows using IndexedDB/Dexie
      const results = await this.database.select();
      console.log('Verification: Queried rows from IndexedDB via Dexie:', results);
    } catch (err) {
      console.error('Failed to verify IndexedDB on device:', err);
    }
  }
}
