import { CanonicalExpenseCategory } from './expense.interface';

/**
 * Represents standardized aggregated metrics for highest or lowest transaction extremes.
 */
export interface ExtremeExpense {
  merchant: string;
  amount: number;
  date: string;
  category: CanonicalExpenseCategory;
}
