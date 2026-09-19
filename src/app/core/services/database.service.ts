import type { AppDatabase } from '@/core/db/app-database';
import { Expense, ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { DestroyRef, inject, injectAsync, onIdle, Service, signal } from '@angular/core';

@Service()
export class DatabaseService {
  readonly #destroyRef = inject(DestroyRef);
  readonly #loadDb = injectAsync(() => import('@/core/db/app-database').then((m) => m.AppDatabase), {
    prefetch: onIdle,
  });

  #db: AppDatabase | null = null;
  readonly #isConnected = signal(false);
  readonly isConnected = this.#isConnected.asReadonly();

  constructor() {
    this.#destroyRef.onDestroy(() => this.close());
  }

  async #getDb(): Promise<AppDatabase> {
    if (this.#db) {
      return this.#db;
    }

    try {
      const db = await this.#loadDb();
      if (!db.isOpen()) {
        await db.open();
      }
      this.#db = db;
      this.#isConnected.set(true);
      return this.#db;
    } catch (err) {
      console.error('IndexedDB: Connection failed during startup:', err);
      throw err;
    }
  }

  /**
   * Inserts a new expense log into the database and returns its new auto-incremented primary key id.
   */
  async insert(expense: ExtractedExpense): Promise<number> {
    const db = await this.#getDb();
    const data = { ...expense } as Expense;
    if ('id' in data) {
      delete data.id;
    }
    return db.expenses.add(data);
  }

  /**
   * Updates an existing expense entry matching the specified id.
   */
  async update(id: number, expense: Partial<ExtractedExpense>): Promise<void> {
    const db = await this.#getDb();
    await db.expenses.update(id, expense);
  }

  /**
   * Deletes an expense entry matching the specified id.
   */
  async delete(id: number): Promise<void> {
    const db = await this.#getDb();
    await db.expenses.delete(id);
  }

  /**
   * Selects expenses matching a specific inclusive transaction date range (YYYY-MM-DD).
   */
  async selectByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const db = await this.#getDb();
    return db.expenses.where('transactionDate').between(startDate, endDate, true, true).toArray();
  }

  close(): void {
    console.log('IndexedDB: Closing database connection...');
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
    this.#isConnected.set(false);
    console.log('IndexedDB: Connection closed successfully.');
  }
}
