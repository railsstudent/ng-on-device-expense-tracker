import { APP_DATABASE_TOKEN } from '@/core/consts/app-database.const';
import { Expense, ExtractedExpense } from '@/shared/interfaces/expense.interface';
import { Service, inject, signal } from '@angular/core';

@Service()
export class DatabaseService {
  #db = inject(APP_DATABASE_TOKEN);
  #isConnected = signal(false);
  public readonly isConnected = this.#isConnected.asReadonly();

  /**
   * Initializes the IndexedDB database connection via Dexie.js.
   */
  public async initialize(): Promise<void> {
    try {
      console.log('IndexedDB: Opening database connection...');
      await this.#db.open();
      this.#isConnected.set(true);
      console.log('IndexedDB: Connection successfully verified and active!');
    } catch (err) {
      console.error('IndexedDB: Connection failed during startup:', err);
      throw err;
    }
  }

  /**
   * Selects and returns all expense entries in the database.
   */
  public async select(): Promise<Expense[]> {
    return this.#db.expenses.toArray();
  }

  /**
   * Inserts a new expense log into the database and returns its new auto-incremented primary key id.
   */
  public async insert(expense: ExtractedExpense): Promise<number> {
    return this.#db.expenses.add(expense as Expense);
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
}
