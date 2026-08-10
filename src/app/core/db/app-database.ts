import Dexie, { type Table } from 'dexie';
import { Expense } from '@/shared/interfaces/expense.interface';

/**
 * AppDatabase class: Dexie-based schema definition.
 */
export class AppDatabase extends Dexie {
  public expenses!: Table<Expense, number>;

  constructor() {
    super('expenses_tracker_db');
    this.version(1).stores({
      expenses: '++id, merchantName, transactionDate, category',
    });
  }
}
