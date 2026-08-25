import { APP_DATABASE_TOKEN } from '@/core/consts/app-database.const';
import { Expense, ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { OnDestroy, Service, inject, signal } from '@angular/core';

@Service()
export class DatabaseService implements OnDestroy {
  #db = inject(APP_DATABASE_TOKEN);
  #isConnected = signal(false);
  public readonly isConnected = this.#isConnected.asReadonly();

  /**
   * Initializes the IndexedDB database connection via Dexie.js.
   */
  public async initialize(): Promise<void> {
    try {
      await this.#db.open();
      this.#isConnected.set(true);
    } catch (err) {
      console.error('IndexedDB: Connection failed during startup:', err);
      throw err;
    }
  }

  /**
   * Inserts a new expense log into the database and returns its new auto-incremented primary key id.
   */
  public async insert(expense: ExtractedExpense): Promise<number> {
    const data = { ...expense } as Expense;
    if ('id' in data) {
      delete data.id;
    }
    return this.#db.expenses.add(data);
  }

  /**
   * Updates an existing expense entry matching the specified id.
   */
  public async update(id: number, expense: Partial<ExtractedExpense>): Promise<void> {
    await this.#db.expenses.update(id, expense);
  }

  /**
   * Deletes an expense entry matching the specified id.
   */
  public async delete(id: number): Promise<void> {
    await this.#db.expenses.delete(id);
  }

  /**
   * Selects expenses matching a specific inclusive transaction date range (YYYY-MM-DD).
   */
  public async selectByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    return this.#db.expenses.where('transactionDate').between(startDate, endDate, true, true).toArray();
  }

  public close(): void {
    console.log('IndexedDB: Closing database connection...');
    this.#db.close();
    this.#isConnected.set(false);
    console.log('IndexedDB: Connection closed successfully.');
  }

  /**
   * Automatically cleans up the connection on service destruction.
   */
  public ngOnDestroy(): void {
    this.close();
  }
}
